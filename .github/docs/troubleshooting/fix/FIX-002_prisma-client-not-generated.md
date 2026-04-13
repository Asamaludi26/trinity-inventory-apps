# FIX-002: Prisma Client Not Generated — Missing Model Types

**Date**: 2026-04-02  
**Severity**: CRITICAL (blocks backend compilation)  
**Agent**: Database Agent / DevOps Agent  
**Status**: ✅ RESOLVED

---

## Symptom

```
error TS2339: Property 'maintenance' does not exist on type 'PrismaService'.
error TS2339: Property '$transaction' does not exist on type 'PrismaService'.
error TS2339: Property 'user' does not exist on type 'PrismaService'.
error TS2305: Module '"@prisma/client"' has no exported member 'UserRole'.
error TS2305: Module '"@prisma/client"' has no exported member 'ItemStatus'.
error TS2305: Module '"@prisma/client"' has no exported member 'AssetStatus'.
```

Setelah clean `pnpm install`, backend gagal compile karena `@prisma/client` belum di-generate. Semua model, enum, dan method Prisma tidak dikenali TypeScript.

## Root Cause

- `pnpm install` hanya menginstall package dari npm registry
- Prisma Client perlu di-generate dari schema files (`prisma/schema/*.prisma`) agar menghasilkan type-safe client
- Setelah reinstall node_modules, generated client di `node_modules/@prisma/client` hilang

## Resolution

```bash
# Generate Prisma Client dari schema
pnpm db:generate
# atau: pnpm --filter ./backend prisma:generate
# atau: cd backend && npx prisma generate
```

Output seharusnya:

```
✔ Generated Prisma Client (v7.4.0) to ./node_modules/@prisma/client
```

## Prevention

- Tambahkan `prisma generate` sebagai `postinstall` script di backend/package.json
- Atau jalankan `pnpm db:generate` setiap kali setelah `pnpm install`
- Pertimbangkan menambah di root:
  ```json
  "postinstall": "pnpm --filter ./backend prisma:generate"
  ```

## Related Files

- [backend/prisma/schema/](../../../../backend/prisma/schema/) — Prisma schema files
- [backend/prisma.config.ts](../../../../backend/prisma.config.ts) — Prisma configuration
- [backend/prisma.service.ts](../../../../backend/prisma.service.ts) — PrismaService class
