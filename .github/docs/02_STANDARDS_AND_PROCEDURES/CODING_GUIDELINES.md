# Coding Guidelines & Conventions — Trinity Inventory Apps

**Versi**: 1.0.0
**Tanggal**: 10 April 2026
**Referensi Utama**: PRD v3.1 (NFR-08 Maintainability), SDD v3.1 (Struktur Folder)
**Status**: FINAL — Standar ini wajib dipatuhi oleh seluruh developer dan agent AI.

> **Catatan**: Dokumen ini mencakup **backend dan frontend**. Standar frontend yang lebih detail tersedia di `FRONTEND_CODING_STANDARDS.md`.

---

## Daftar Isi

1. [Prinsip Umum](#1-prinsip-umum)
2. [TypeScript — Aturan Global](#2-typescript--aturan-global)
3. [Backend (NestJS) Guidelines](#3-backend-nestjs-guidelines)
4. [Frontend (React) Guidelines](#4-frontend-react-guidelines)
5. [Linter, Formatter, & Automation](#5-linter-formatter--automation)
6. [Konvensi Penamaan](#6-konvensi-penamaan)
7. [Prinsip DRY & Abstraksi](#7-prinsip-dry--abstraksi)
8. [Komentar & Dokumentasi Inline](#8-komentar--dokumentasi-inline)
9. [Import Ordering](#9-import-ordering)
10. [Konvensi File & Folder](#10-konvensi-file--folder)

---

## 1. Prinsip Umum

| Prinsip                          | Deskripsi                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **DRY** (Don't Repeat Yourself)  | Jangan duplikasi logika. Ekstrak ke shared service/hook/utility.                    |
| **KISS** (Keep It Simple)        | Hindari over-engineering. Solusi sederhana lebih baik daripada abstraksi prematur.  |
| **SoC** (Separation of Concerns) | Controller hanya routing, Service hanya bisnis logik, Repository hanya data.        |
| **Single Responsibility**        | Satu file/class/function = satu tanggung jawab.                                     |
| **Fail Fast**                    | Validasi di awal (DTO/Zod), jangan biarkan data invalid menembus ke service layer.  |
| **Defensive Programming**        | Hanya validasi di system boundary (API input). Jangan over-validate internal calls. |

---

## 2. TypeScript — Aturan Global

### 2.1 Strict Mode (Wajib)

Kedua project mengaktifkan `strict: true` di `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true
  }
}
```

### 2.2 Penggunaan Tipe

| Aturan                                     | Level    | Penjelasan                                      |
| ------------------------------------------ | -------- | ----------------------------------------------- |
| Dilarang `any`                             | ⚠️ Warn  | Gunakan `unknown` lalu narrow dengan type guard |
| Dilarang `// @ts-ignore`                   | 🔴 Error | Perbaiki tipe, jangan suppress                  |
| Wajib explicit return type pada service    | ✅ Best  | `async findAll(): Promise<Asset[]>`             |
| Interface > Type alias untuk object shapes | ✅ Best  | `interface User {}` lebih extends-friendly      |
| Enum untuk fixed domain values             | ✅ Best  | `AssetStatus`, `UserRole`, `AssetCondition`     |
| Generics untuk reusable patterns           | ✅ Best  | `PaginatedResult<T>`, `ApiResponse<T>`          |

### 2.3 Path Aliases

**Backend** (`backend/tsconfig.json`):

```typescript
import { PaginationDto } from '@common/dto/pagination.dto';
import { AssetsService } from '@modules/assets/assets.service';
```

**Frontend** (`frontend/tsconfig.json`):

```typescript
import { Button } from '@components/ui/button';
import { useAuthStore } from '@stores/useAuthStore';
import { apiClient } from '@services/api/client';
```

---

## 3. Backend (NestJS) Guidelines

### 3.1 Separation of Concerns

```
Controller              → Routing, parameter extraction, response serialization
  ↓ calls
Service                 → Business logic, validation bisnis, orchestration
  ↓ calls
Prisma Client           → Database queries, transactions
```

**Aturan ketat:**

| Layer          | BOLEH                                               | DILARANG                                     |
| -------------- | --------------------------------------------------- | -------------------------------------------- |
| **Controller** | `@Body()`, `@Param()`, `@Query()`, `@CurrentUser()` | Akses `PrismaClient` langsung, logika bisnis |
| **Service**    | Prisma queries, business logic, throw exceptions    | Akses `Request`/`Response` objek Express     |
| **DTO**        | `class-validator` decorators, type definition       | Logika bisnis, database query                |

### 3.2 DTO & Validasi

Setiap endpoint **wajib** menggunakan DTO dengan `class-validator`:

```typescript
// ✅ Benar — DTO dengan validasi eksplisit
export class CreateAssetDto {
  @IsNotEmpty({ message: 'Nama aset wajib diisi' })
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;

  @IsEnum(AssetCondition)
  condition: AssetCondition;
}

// ❌ Salah — Langsung pakai plain object
create(@Body() body: { name: string }) { ... }
```

**Aturan DTO:**

- Satu DTO per operasi: `CreateXDto`, `UpdateXDto`, `FilterXDto`.
- `UpdateXDto` extends `PartialType(CreateXDto)` — otomatis semua field jadi opsional.
- Pesan error dalam Bahasa Indonesia untuk user-facing validation.
- Gunakan `@Transform()` untuk sanitization.

### 3.3 Service Pattern

```typescript
@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Explicit return type
  async findAll(query: AssetFilterDto): Promise<PaginatedResult<Asset>> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ✅ Business rules di service, bukan di controller
  async create(dto: CreateAssetDto, userId: number): Promise<Asset> {
    // Validasi bisnis
    const model = await this.prisma.assetModel.findUnique({
      where: { id: dto.modelId },
    });
    if (!model) throw new NotFoundException('Model aset tidak ditemukan');

    return this.prisma.asset.create({
      data: { ...dto, recordedById: userId },
    });
  }
}
```

### 3.4 Controller Pattern

```typescript
@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_CREATE)
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: { id: number }) {
    return this.assetsService.create(dto, user.id);
  }

  @Get()
  @AuthPermissions(PERMISSIONS.ASSETS_READ)
  findAll(@Query() query: AssetFilterDto) {
    return this.assetsService.findAll(query);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.assetsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_DELETE)
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
```

### 3.5 Error Throwing

```typescript
// ✅ Benar — Throw NestJS exception di service
throw new NotFoundException('Aset tidak ditemukan');
throw new ConflictException('Serial number sudah terdaftar');
throw new UnprocessableEntityException('Stok tidak mencukupi');
throw new ForbiddenException('Anda tidak memiliki izin');

// ❌ Salah — Return error object
return { success: false, message: 'Not found' };

// ❌ Salah — Throw generic Error
throw new Error('Something went wrong');
```

### 3.6 Database Transactions

Gunakan `prisma.$transaction()` untuk operasi atomik:

```typescript
// ✅ Benar — Gunakan interactive transaction untuk operasi multi-step
async approveRequest(requestId: string, approverId: number) {
  return this.prisma.$transaction(async (tx) => {
    const request = await tx.request.findUniqueOrThrow({ where: { id: requestId } });

    // Update status
    const updated = await tx.request.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    // Create audit log
    await tx.activityLog.create({
      data: { userId: approverId, action: 'APPROVE_REQUEST', details: { requestId } },
    });

    // Update stock
    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'IN_USE' },
    });

    return updated;
  });
}
```

---

## 4. Frontend (React) Guidelines

### 4.1 State Management Matrix

| Jenis Data       | Solusi                | Contoh                                    |
| ---------------- | --------------------- | ----------------------------------------- |
| **Server Data**  | TanStack Query        | List aset, detail user, notifikasi        |
| **Auth/Session** | Zustand + persist     | `useAuthStore` (token, user, permissions) |
| **UI Global**    | Zustand               | `useUIStore` (sidebar, theme, modal)      |
| **Form State**   | React Hook Form + Zod | `useForm<CreateAssetSchema>()`            |
| **Ephemeral UI** | `useState`            | Loading spinner, toggle, selected row     |
| **URL State**    | `useSearchParams`     | Filter, pagination, tab aktif             |

**Aturan ketat:**

- ❌ Jangan pakai `useState` untuk data dari API — selalu TanStack Query.
- ❌ Jangan pakai Redux (sudah diganti Zustand).
- ❌ Jangan pakai Context API untuk state management — gunakan Zustand.

### 4.2 Komponen

```typescript
// ✅ Benar — Function component dengan TypeScript props
interface AssetCardProps {
  asset: Asset;
  onEdit: (id: string) => void;
  isCompact?: boolean;
}

export function AssetCard({ asset, onEdit, isCompact = false }: AssetCardProps) {
  return (
    <Card className={cn('p-4', isCompact && 'p-2')}>
      <h3>{asset.name}</h3>
      <Button onClick={() => onEdit(asset.id)}>Edit</Button>
    </Card>
  );
}

// ❌ Salah — Class component
class AssetCard extends React.Component { ... }

// ❌ Salah — Default export
export default function AssetCard() { ... }
```

**Aturan komponen:**

- Named export (bukan default export) — kecuali lazy-loaded pages.
- Props interface dengan suffix `Props`.
- Destructure props di parameter (bukan `props.xxx`).
- `React.memo()` hanya jika ada masalah performa terukur.

### 4.3 Custom Hooks

Ekstrak logika yang berulang menjadi custom hooks:

```typescript
// ✅ Benar — Reusable hook
export function useAssetList(filters: AssetFilterParams) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetApi.getAll(filters),
    staleTime: 30_000, // 30 seconds
  });
}

// ✅ Benar — Mutation hook dengan invalidation
export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assetApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Aset berhasil dibuat');
    },
  });
}
```

### 4.4 Form Pattern (React Hook Form + Zod)

```typescript
// 1. Zod schema (validation/)
const createAssetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(200),
  categoryId: z.number().positive('Kategori wajib dipilih'),
  condition: z.nativeEnum(AssetCondition),
});
type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

// 2. Form component
export function CreateAssetForm() {
  const form = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: { name: '', condition: 'BRAND_NEW' },
  });
  const createMutation = useCreateAsset();

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <FormField control={form.control} name="name" render={({ field }) => (
        <Input {...field} label="Nama Aset" />
      )} />
      {/* ... */}
    </form>
  );
}
```

### 4.5 API Layer

```typescript
// services/api/assets.api.ts
export const assetApi = {
  getAll: (params: AssetFilterParams) =>
    apiClient.get<PaginatedResult<Asset>>('/assets', { params }),

  getById: (id: string) => apiClient.get<Asset>(`/assets/${id}`),

  create: (data: CreateAssetDto) => apiClient.post<Asset>('/assets', data),

  update: (id: string, data: UpdateAssetDto) => apiClient.patch<Asset>(`/assets/${id}`, data),

  remove: (id: string) => apiClient.delete(`/assets/${id}`),
};
```

---

## 5. Linter, Formatter, & Automation

### 5.1 ESLint Configuration

**Backend** (`backend/eslint.config.mjs`):

| Rule                                      | Level   | Alasan                                     |
| ----------------------------------------- | ------- | ------------------------------------------ |
| `@typescript-eslint/no-explicit-any`      | `warn`  | Hindari `any`, gunakan `unknown`           |
| `@typescript-eslint/no-floating-promises` | `error` | Semua promise wajib di-await               |
| `@typescript-eslint/await-thenable`       | `error` | Jangan await non-promise                   |
| `no-console`                              | `warn`  | Gunakan NestJS `Logger` (allow warn/error) |
| `eqeqeq`                                  | `error` | Selalu `===`, tidak pernah `==`            |

**Frontend** (`frontend/eslint.config.js`):

| Rule                                   | Level   | Alasan                           |
| -------------------------------------- | ------- | -------------------------------- |
| `react-hooks/rules-of-hooks`           | `error` | Hooks harus di top level         |
| `react-hooks/exhaustive-deps`          | `warn`  | Dependencies array harus lengkap |
| `jsx-a11y/*` (multiple rules)          | `warn`  | WCAG 2.1 AA compliance           |
| `@typescript-eslint/no-explicit-any`   | `warn`  | Hindari `any`                    |
| `react-refresh/only-export-components` | `warn`  | HMR compatibility                |

### 5.2 Prettier

Konfigurasi Prettier terintegrasi melalui ESLint:

- Single quotes
- Trailing commas (ES5)
- Semicolons
- 2 space indentation
- Print width 100

### 5.3 Validation Pipeline

```bash
# Backend
pnpm --filter backend lint          # ESLint
pnpm --filter backend exec tsc --noEmit   # TypeScript check

# Frontend
pnpm validate                       # lint + typecheck + test (sequential)
pnpm --filter frontend lint
pnpm --filter frontend typecheck    # tsc --noEmit
pnpm --filter frontend test         # vitest run
```

### 5.4 Pre-commit (Target)

```bash
# Target: Husky + lint-staged
# Pada setiap commit, otomatis jalankan:
# 1. ESLint --fix pada staged files
# 2. Prettier --write pada staged files
# 3. tsc --noEmit (full project check)
```

---

## 6. Konvensi Penamaan

### 6.1 File Naming

| Tipe File              | Pattern                              | Contoh                                         |
| ---------------------- | ------------------------------------ | ---------------------------------------------- |
| NestJS Controller      | `{name}.controller.ts`               | `assets.controller.ts`                         |
| NestJS Service         | `{name}.service.ts`                  | `assets.service.ts`                            |
| NestJS Module          | `{name}.module.ts`                   | `assets.module.ts`                             |
| NestJS DTO             | `{action}-{name}.dto.ts`             | `create-asset.dto.ts`                          |
| React Component        | `PascalCase.tsx`                     | `AssetCard.tsx`, `CreateAssetForm.tsx`         |
| React Page             | `PascalCase.tsx` (with `Page`)       | `AssetListPage.tsx`                            |
| Custom Hook            | `use{Name}.ts`                       | `useAssetList.ts`, `useDebounce.ts`            |
| Zod Schema             | `{name}.schema.ts`                   | `asset.schema.ts`, `auth.schema.ts`            |
| Test File              | `{name}.spec.ts` / `{name}.test.tsx` | `assets.service.spec.ts`, `AssetCard.test.tsx` |
| Prisma Schema          | `{domain}.prisma`                    | `asset.prisma`, `auth.prisma`                  |
| API Service (Frontend) | `{name}.api.ts`                      | `assets.api.ts`, `auth.api.ts`                 |
| Zustand Store          | `use{Name}Store.ts`                  | `useAuthStore.ts`, `useUIStore.ts`             |

### 6.2 Variable & Function Naming

| Konteks               | Konvensi           | Contoh                                     |
| --------------------- | ------------------ | ------------------------------------------ |
| Variable & Function   | `camelCase`        | `assetCount`, `findAll()`, `isActive`      |
| Class & Interface     | `PascalCase`       | `AssetsService`, `CreateAssetDto`, `Asset` |
| Enum                  | `PascalCase`       | `AssetStatus`, `UserRole`                  |
| Enum value            | `UPPER_SNAKE_CASE` | `IN_STORAGE`, `SUPER_ADMIN`                |
| Constant              | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `DEFAULT_PAGE_LIMIT`      |
| Database table/column | `camelCase`        | `assetModel`, `createdAt` (Prisma default) |
| CSS class (Tailwind)  | kebab-case         | `btn-primary`, `text-muted-foreground`     |
| URL path              | `kebab-case`       | `/asset-transfers`, `/change-password`     |
| Query parameter       | `camelCase`        | `sortBy`, `sortOrder`, `categoryId`        |

### 6.3 Convention untuk Boolean

```typescript
// ✅ Prefix: is, has, can, should
(isActive, hasPermission, canApprove, shouldNotify);

// ❌ Tanpa prefix — ambigu
(active, permission, approve);
```

---

## 7. Prinsip DRY & Abstraksi

### 7.1 Kapan Mengekstrak

| Jumlah Duplikasi | Aksi                                             |
| :--------------: | ------------------------------------------------ |
|        1         | Biarkan inline                                   |
|        2         | Evaluasi — jika logika identik, pertimbangkan    |
|        3+        | **Wajib** ekstrak ke utility/hook/shared service |

### 7.2 Shared Code Locations

| Layer    | Shared Location            | Isi                                                |
| -------- | -------------------------- | -------------------------------------------------- |
| Backend  | `src/common/dto/`          | `PaginationDto`, `DateRangeDto`                    |
| Backend  | `src/common/decorators/`   | `@CurrentUser()`, `@AuthPermissions()`             |
| Backend  | `src/common/filters/`      | `AllExceptionsFilter`                              |
| Backend  | `src/common/interceptors/` | `TransformInterceptor`, `LoggingInterceptor`       |
| Backend  | `src/common/guards/`       | `JwtAuthGuard`, `PermissionsGuard`                 |
| Backend  | `src/common/constants/`    | `permissions.constants.ts`                         |
| Frontend | `src/components/ui/`       | Shadcn UI primitives                               |
| Frontend | `src/components/form/`     | Form wrapper components                            |
| Frontend | `src/hooks/`               | `useDebounce`, `useWindowSize`, `useReducedMotion` |
| Frontend | `src/lib/utils.ts`         | `cn()`, formatters, type guards                    |
| Frontend | `src/validation/`          | Shared Zod schemas                                 |
| Frontend | `src/types/`               | Global TypeScript interfaces                       |

### 7.3 Pola DRY Transaksi (Backend)

Semua modul transaksi berbagi:

- **Approval Engine** (`modules/transactions/approval/`) — satu implementasi, dikonfigurasi per modul.
- **Pola Endpoint** (GET list, GET detail, POST, PATCH, approve, reject, execute, cancel).
- **State Machine** transitions (PENDING → APPROVED → COMPLETED / REJECTED).

---

## 8. Komentar & Dokumentasi Inline

### 8.1 Kapan Menulis Komentar

| Harus                              | Tidak Perlu                        |
| ---------------------------------- | ---------------------------------- |
| Logika bisnis kompleks (approval)  | Kode yang self-explanatory         |
| Pembuatan keputusan arsitektural   | Getter/setter sederhana            |
| Bug workaround (dengan link issue) | Setiap function/method             |
| Regex pattern yang tidak jelas     | Re-state kode dalam bahasa natural |

### 8.2 Format

```typescript
// ✅ Benar — Menjelaskan MENGAPA, bukan APA
// Prisma Decimal tidak bisa di-serialize otomatis oleh JSON.stringify
// Konversi manual diperlukan sebelum response dikirim
function convertDecimalsToNumbers<T>(obj: T): T { ... }

// ❌ Salah — Re-state kode
// Mengecek apakah user aktif
if (user.isActive) { ... }
```

### 8.3 TODO Format

```typescript
// TODO(username): Deskripsi singkat — Issue #123
// TODO(angga): Implementasi delegasi approval — Future Enhancement
```

---

## 9. Import Ordering

### Backend (NestJS)

```typescript
// 1. Node built-in modules
import { readFileSync } from 'fs';

// 2. NestJS framework
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// 3. Third-party libraries
import { Prisma } from '@prisma/client';

// 4. Internal — common (via path alias)
import { AuthPermissions } from '@common/decorators/auth.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constants';

// 5. Internal — same module
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
```

### Frontend (React)

```typescript
// 1. React/framework
import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// 2. Third-party
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

// 3. Internal — components, hooks, stores
import { Button } from '@components/ui/button';
import { useAssetList } from '@hooks/queries/useAssetQueries';
import { useAuthStore } from '@stores/useAuthStore';

// 4. Internal — types, utils, validation
import type { Asset } from '@types/asset';
import { cn } from '@/lib/utils';

// 5. Styles (if any)
import './AssetCard.css';
```

---

## 10. Konvensi File & Folder

### 10.1 Struktur Domain-Driven

```
modules/
└── assets/                    # Satu domain = satu folder
    ├── assets.module.ts       # NestJS module registration
    ├── assets.controller.ts   # HTTP routing
    ├── assets.service.ts      # Business logic
    ├── dto/                   # Data Transfer Objects
    │   ├── create-asset.dto.ts
    │   ├── update-asset.dto.ts
    │   └── filter-asset.dto.ts
    ├── categories/            # Sub-domain
    │   ├── categories.controller.ts
    │   ├── categories.service.ts
    │   └── dto/
    └── types/                 # Sub-domain
        ├── types.controller.ts
        ├── types.service.ts
        └── dto/
```

### 10.2 Frontend Feature-Based

```
features/
└── assets/                    # Satu feature = satu folder
    ├── api/                   # API calls for this feature
    ├── components/            # Feature-specific components
    ├── pages/                 # Route-level pages
    │   ├── list/
    │   ├── stock/
    │   └── categories/
    ├── schemas/               # Zod validation schemas
    ├── types/                 # Feature-specific types
    └── store/                 # Local Zustand slice (jika perlu)
```

### 10.3 Aturan

- Satu file per class/component (kecuali helper types yang terkait erat).
- File test berdampingan dengan file yang ditest (frontend) atau di folder `test/unit/` (backend).
- Maksimum kedalaman folder: 4 level dari `src/`.
- Jangan buat folder untuk 1 file — buat file langsung di parent.
