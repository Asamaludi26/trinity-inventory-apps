# FIX-006: CI TypeScript Typecheck Failure — Prisma Client Not Generated

**Date**: 2026-04-04
**Severity**: CRITICAL (blocks CI pipeline)
**Status**: RESOLVED (3 iterations)

---

## Problem

The **TypeScript** CI job in GitHub Actions (`typecheck`) and **Build** job fail with ~17 cascading errors:

```
Property 'user' does not exist on type 'PrismaService'
Property 'division' does not exist on type 'PrismaService'
Property 'role' does not exist on type 'UpdateUserDto'
Property 'permissions' does not exist on type 'UpdateUserDto'
Module '"@prisma/client"' has no exported member 'UserRole'
Parameter 'user' implicitly has an 'any' type
```

**Affected jobs**: `typecheck`, `build`
**Unaffected jobs**: `lint`, `backend-tests`, `frontend-tests`, `migrations`

---

## Root Cause Analysis

### Primary: `prisma generate` fails silently without `DATABASE_URL`

The project uses **Prisma v7** with `@prisma/config` (TypeScript config file). The `prisma.config.ts` references `process.env.DATABASE_URL`:

```typescript
// backend/prisma.config.ts
export default defineConfig({
  schema: 'prisma/schema/',
  datasource: {
    url: process.env.DATABASE_URL, // undefined in CI!
  },
});
```

And the `schema.prisma` datasource block has **no URL**:

```prisma
datasource db {
  provider = "postgresql"
  // no url = relies on prisma.config.ts
}
```

When `prisma generate` runs in CI **without `DATABASE_URL` set**, the datasource URL is `undefined`. Prisma either skips generation or produces an empty client — all model delegates (`.user`, `.division`) and enum exports (`UserRole`, `AssetStatus`) are missing.

The `backend-tests` job was unaffected because it provides a real `DATABASE_URL` via its step-level env.

### Secondary: Code-level type safety issues

1. **`whatsapp.service.ts`** used inline import `import("@prisma/client").UserRole` instead of a top-level import
2. **`UpdateUserDto`** relied on `PartialType(CreateUserDto)` from `@nestjs/mapped-types`, which doesn't always propagate TypeScript types for inherited fields
3. **`build` job** also needed `prisma generate` before `nest build` (TypeScript compilation)

### Error Cascade

```
Missing DATABASE_URL
  → prisma generate produces empty client
    → @prisma/client has no UserRole export           (TS2305)
    → PrismaClient has no .user/.division delegates   (TS2339)
    → findMany() returns unknown → param has any type (TS7006)
    → UpdateUserDto has no .role/.permissions          (TS2339)
```

---

## Changes Made

### Iteration 1: Source-level type fixes

#### 1a. CI Workflow — `.github/workflows/ci-cd.yml` (initial)

Added `prisma generate` step before typecheck:

```yaml
typecheck:
  steps:
    - run: pnpm install --frozen-lockfile
    - name: Generate Prisma Client # <-- ADDED
      run: pnpm --filter backend prisma:generate
    - run: pnpm typecheck
```

#### 1b. WhatsApp Service — `backend/src/modules/whatsapp/whatsapp.service.ts`

Added proper top-level import and replaced inline import:

```typescript
// BEFORE (line 1972):
role: role as unknown as import("@prisma/client").UserRole,

// AFTER:
import { UserRole } from "@prisma/client";  // top-level
// ...
role: role as unknown as UserRole,
```

#### 1c. UpdateUserDto — `backend/src/modules/users/dto/update-user.dto.ts`

Explicitly re-declared `role`, `divisionId`, and `permissions` fields to guarantee TypeScript visibility:

```typescript
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // explicitly declared

  @IsOptional()
  @IsInt()
  divisionId?: number; // explicitly declared

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]; // explicitly declared

  // ... existing password fields
}
```

#### 1d. Seed File — `backend/prisma/seed.ts`

- Removed unused `formatDocNumber()` function (lint warning)
- Cleaned up commented-out imports (unused enum imports)
- Fixed misleading summary counts to match actual seeded data

### Iteration 2: CI environment & workflow hardening

#### 2a. Workflow-level `DATABASE_URL` — `.github/workflows/ci-cd.yml`

Added a dummy `DATABASE_URL` at the workflow `env` level so `prisma generate` can resolve the datasource URL in every job:

```yaml
env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9.15.0'
  DATABASE_URL: 'postgresql://ci:ci@localhost:5432/ci_placeholder'
```

`prisma generate` never connects to the database — it only reads the schema. The dummy URL satisfies the Prisma v7 config validation. Jobs with a real database (e.g. `backend-tests`, `migrations`) override `DATABASE_URL` at the step level with the actual postgres service URL.

#### 2b. `prisma generate` in `build` job

The `build` job runs `nest build` (TypeScript compilation), which also needs Prisma types:

```yaml
build:
  steps:
    - run: pnpm install --frozen-lockfile
    - name: Generate Prisma Client # <-- ADDED
      run: pnpm --filter backend prisma:generate
    - run: pnpm --filter backend build
```

#### 2c. Deploy health check improvements

Replaced fragile `sleep 15` with retry-based health checks (12 attempts × 5 seconds = 60 second timeout):

```yaml
- name: Health check
  run: |
    for i in $(seq 1 12); do
      if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "Health check passed on attempt $i"
        exit 0
      fi
      echo "Attempt $i/12: waiting for services..."
      sleep 5
    done
    echo "Health check failed after 60 seconds"
    docker compose logs --tail=50
    exit 1
```

#### 2d. Docker build caching

Removed `--no-cache` from `docker compose build` for faster CI builds. Docker layer caching is beneficial in CI — full rebuilds are only needed when troubleshooting cache corruption.

### Iteration 3: Sequential pipeline restructure

The parallel job architecture (6 independent CI jobs) was fundamentally fragile — each job needed its own postgres service, prisma generate, and DATABASE_URL setup, with no guarantee that infrastructure was healthy before validation ran.

#### 3a. Restructured pipeline to sequential stages

Old pipeline (parallel, fragile):

```
lint ──────────┐
typecheck ─────┤
backend-tests ─┤→ quality-gate → deploy
frontend-tests─┤
build ─────────┤
migrations ────┘
```

New pipeline (sequential, reliable):

```
Stage 1: setup (DB + prisma validate + generate + migrate status)
    ↓
Stage 2: validate (DB + prisma generate + migrate deploy + pnpm validate)
    ↓
Stage 3: build (prisma generate + pnpm build) → quality-gate
    ↓
Stage 4: deploy-dev / deploy-prod
```

#### 3b. Consolidated `pnpm validate`

Replaced 4 separate CI jobs (`lint`, `typecheck`, `backend-tests`, `frontend-tests`) with a single `validate` job running `pnpm validate` (`lint → typecheck → test`). Benefits:

- Guarantees prisma generate and migrations run BEFORE any checks
- Single postgres service shared across all steps
- Fail-fast: if lint fails, typecheck and tests don't waste resources
- Matches the local development workflow (`pnpm validate`)

#### 3c. Fixed flaky LoginPage tests

Two frontend tests (`LoginPage.test.tsx`) timed out at the default 5000ms due to `user.type` keystroke-by-keystroke simulation overhead. Increased timeout to 15_000ms for:

- "calls login on valid form submission"
- "shows loading state during login"

---

## Verification

```bash
# Full validation pipeline: 0 errors, 866 tests passed
pnpm validate
# → lint:      0 warnings (backend + frontend)
# → typecheck: 0 errors (backend + frontend)
# → test:      518 backend + 348 frontend = 866 passed
```

---

## Prevention

To prevent this class of issue:

1. **Always provide `DATABASE_URL`** (even a dummy) in any CI job that runs `prisma generate` — Prisma v7 with `@prisma/config` resolves the URL from `process.env.DATABASE_URL`
2. **Always run `prisma generate` before `tsc`** in any CI job that performs type checking or compilation
3. **Use proper top-level imports** instead of inline `import()` type expressions
4. **When using NestJS `PartialType`**, re-declare critical fields that will be accessed by name in services
5. **Add a `postinstall` script** to auto-generate Prisma client after `pnpm install` (optional):
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

---

## Related Files

| File                                               | Change                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `.github/workflows/ci-cd.yml`                      | Restructured to sequential stages (setup → validate → build → deploy) |
| `backend/prisma.config.ts`                         | Root cause — provides `url: process.env.DATABASE_URL` to Prisma       |
| `backend/prisma/schema/schema.prisma`              | Root cause — datasource has no `url` field, relies on config          |
| `backend/src/modules/whatsapp/whatsapp.service.ts` | Added `UserRole` import, removed inline import                        |
| `backend/src/modules/users/dto/update-user.dto.ts` | Re-declared `role`, `divisionId`, `permissions`                       |
| `backend/prisma/seed.ts`                           | Removed unused function, cleaned imports, fixed summary               |
| `frontend/src/features/auth/LoginPage.test.tsx`    | Increased timeout for 2 flaky form-submission tests (5s → 15s)        |
