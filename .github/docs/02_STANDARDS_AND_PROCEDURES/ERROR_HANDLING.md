# Standar Penanganan Error (Error Handling & Response Format) — Trinity Inventory Apps

**Versi**: 1.0.0
**Tanggal**: 10 April 2026
**Referensi Utama**: SDD v3.1 Bagian 5.1 (Format Respons), PRD v3.1 NFR-03 (Security)
**Status**: FINAL — Standar ini adalah kontrak baku untuk seluruh API response.

---

## Daftar Isi

1. [Prinsip Error Handling](#1-prinsip-error-handling)
2. [Kontrak Response Format (Success vs Error)](#2-kontrak-response-format-success-vs-error)
3. [Implementasi Backend (NestJS)](#3-implementasi-backend-nestjs)
4. [Penanganan Error Frontend (React)](#4-penanganan-error-frontend-react)
5. [Katalog Status Code & Error Type](#5-katalog-status-code--error-type)
6. [Error Logging & Observability](#6-error-logging--observability)
7. [Panduan Developer](#7-panduan-developer)

---

## 1. Prinsip Error Handling

| Prinsip                        | Penerapan                                                                  |
| ------------------------------ | -------------------------------------------------------------------------- |
| **Fail Fast**                  | Validasi di boundary (DTO/Zod) — jangan biarkan data invalid masuk service |
| **Single Format**              | Semua response (success & error) mengikuti satu schema konsisten           |
| **Never Expose Internals**     | Stack trace, query SQL, path file server TIDAK PERNAH dikirim ke client    |
| **Log Everything Server-Side** | Semua error >= 500 di-log dengan full stack trace di server                |
| **User-Friendly Messages**     | Pesan error dalam Bahasa Indonesia yang actionable                         |
| **Graceful Degradation**       | Frontend menampilkan fallback UI, bukan crash                              |

---

## 2. Kontrak Response Format (Success vs Error)

### 2.1 Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string; // Opsional — pesan deskriptif
  meta?: PaginationMeta; // Hanya untuk list/paginated
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**Contoh — Single Item:**

```json
{
  "success": true,
  "data": {
    "id": "cm5x_abc123",
    "name": "MikroTik RB750Gr3",
    "status": "IN_STORAGE"
  }
}
```

**Contoh — Paginated List:**

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

**Contoh — Delete:**

```json
{
  "success": true,
  "data": null
}
```

### 2.2 Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  statusCode: number; // HTTP status code
  message: string; // Deskripsi error (Bahasa Indonesia)
  error: string; // Error type identifier (PascalCase)
  timestamp: string; // ISO 8601
  path: string; // Request URL
  details?: unknown; // Detail tambahan (opsional)
}
```

**Contoh — Validation Error (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bad Request Exception",
  "error": "Bad Request",
  "timestamp": "2026-04-10T08:15:00.000Z",
  "path": "/api/v1/assets"
}
```

**Contoh — Duplikasi Data (409):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Duplikasi data: serialNumber sudah digunakan",
  "error": "ConflictError",
  "timestamp": "2026-04-10T08:15:00.000Z",
  "path": "/api/v1/assets"
}
```

**Contoh — Business Rule Violation (422):**

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Stok tidak mencukupi untuk permintaan ini",
  "error": "UnprocessableEntity",
  "timestamp": "2026-04-10T08:20:00.000Z",
  "path": "/api/v1/requests"
}
```

---

## 3. Implementasi Backend (NestJS)

### 3.1 Arsitektur Error Handling

```
Request → Guards → Pipes (Validation) → Controller → Service → Response
                     ↓                                  ↓
                ValidationPipe                    Business Exceptions
                     ↓                                  ↓
              ┌──────────────────────────────────────────┐
              │       AllExceptionsFilter (Global)        │
              │  Catches ALL exceptions → Formats into   │
              │  standard ErrorResponse → Sends to client │
              └──────────────────────────────────────────┘
                                  ↓
                          LoggingInterceptor
                     (Log request/response timing)
```

### 3.2 Global Exception Filter (`AllExceptionsFilter`)

**Lokasi**: `backend/src/common/filters/all-exceptions.filter.ts`

Filter ini menangkap **semua** exception tanpa terkecuali dan memformat ke `ErrorResponse`:

| Exception Type                  | Penanganan                                           |
| ------------------------------- | ---------------------------------------------------- |
| `HttpException` (NestJS)        | Gunakan status code & message dari exception         |
| `PrismaClientKnownRequestError` | Map Prisma error code → HTTP status (lihat 3.3)      |
| `PrismaClientValidationError`   | 400 Bad Request — "Database validation error"        |
| Standard `Error`                | 500 Internal Server Error — pesan dari error.message |
| Unknown                         | 500 Internal Server Error — "Internal server error"  |

**Behavior:**

- **Status >= 500**: Log dengan `logger.error()` termasuk stack trace.
- **Status < 500**: Log dengan `logger.warn()` tanpa stack trace (client error, bukan server error).
- **Timestamp**: Setiap error response menyertakan `timestamp` ISO 8601.
- **Path**: Request URL disertakan untuk debugging.

### 3.3 Pemetaan Prisma Error

| Prisma Code | Deskripsi              | HTTP Status | message (Bahasa Indonesia)                |
| ----------- | ---------------------- | :---------: | ----------------------------------------- |
| `P2002`     | Unique constraint      |    `409`    | `Duplikasi data: {field} sudah digunakan` |
| `P2003`     | Foreign key constraint |    `400`    | `Referensi data tidak valid`              |
| `P2025`     | Record not found       |    `404`    | `Data tidak ditemukan`                    |
| `P2014`     | Required relation      |    `400`    | `Relasi data diperlukan`                  |
| Lainnya     | Unknown Prisma error   |    `500`    | `Database error`                          |

### 3.4 Response Transform Interceptor (`TransformInterceptor`)

**Lokasi**: `backend/src/common/interceptors/transform.interceptor.ts`

Interceptor ini membungkus **semua** response sukses ke format `ApiSuccessResponse`:

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const convertedData = convertDecimalsToNumbers(data);

        // Jika sudah berformat { success }, return as-is
        if (convertedData?.success !== undefined) return convertedData;

        // Jika paginated { items, meta }, wrap dengan success
        if (convertedData?.items && convertedData?.meta) {
          return { success: true, data: convertedData };
        }

        // Default wrap
        return { success: true, data: convertedData };
      }),
    );
  }
}
```

**Konversi otomatis:**

- `Prisma.Decimal` → `number` (rekursif)
- `BigInt` → `string` (via global `toJSON` override)

### 3.5 Timeout Interceptor

**Lokasi**: `backend/src/common/interceptors/timeout.interceptor.ts`

- Default timeout: **30 detik**
- Jika request melebihi 30 detik → `408 Request Timeout`
- Mencegah request yang hang akibat query berat atau deadlock

### 3.6 Logging Interceptor

**Lokasi**: `backend/src/common/interceptors/logging.interceptor.ts`

Setiap request di-log:

```
[GET] /api/v1/assets - User: admin@trinitimedia.com - 42ms
```

Informasi yang di-log:

- HTTP method & URL
- User email (jika authenticated)
- Response time (ms)
- Status code

### 3.7 Validation Pipe — Input Validation

**Registrasi**: `backend/src/main.ts`

```typescript
app.useGlobalPipes(
  new TrimStringPipe(), // 1. Trim whitespace dari semua input string
  new ValidationPipe({
    // 2. Validasi DTO
    whitelist: true, //    Strip properti asing
    forbidNonWhitelisted: true, // Tolak jika ada properti asing → 400
    transform: true, //    Auto-convert tipe ("10" → 10)
    transformOptions: {
      enableImplicitConversion: true,
    },
    stopAtFirstError: true, //    Hentikan pada error pertama
  }),
);
```

**Urutan Eksekusi**:

1. `TrimStringPipe` — Bersihkan whitespace.
2. `ValidationPipe` — Validasi DTO via `class-validator` decorators.
3. Jika gagal → throw `BadRequestException` → ditangkap `AllExceptionsFilter`.

---

## 4. Penanganan Error Frontend (React)

### 4.1 API Client Error Handling

**Lokasi**: `frontend/src/services/api/client.ts`

```typescript
// Custom error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Interceptor behavior:**

- **401 Unauthorized**: Otomatis attempt refresh token → jika gagal, redirect ke `/login`.
- **403 Forbidden**: Tampilkan toast "Anda tidak memiliki izin".
- **429 Too Many Requests**: Tampilkan toast "Terlalu banyak permintaan, coba lagi nanti".
- **500+**: Tampilkan toast generic "Terjadi kesalahan pada server".
- **Network Error**: Tampilkan toast "Koneksi ke server gagal".

### 4.2 TanStack Query Error Handling

```typescript
// Global error handler di QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Jangan retry untuk 401/403/404
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 3; // Retry 3x untuk error lain
      },
      staleTime: 30_000, // 30 detik — kurangi refetch
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error('Terjadi kesalahan yang tidak diketahui');
        }
      },
    },
  },
});
```

### 4.3 Error Boundary

```typescript
// React Error Boundary untuk fallback UI
<ErrorBoundary fallback={<ErrorFallbackPage />}>
  <App />
</ErrorBoundary>
```

Jika komponen crash (unhandled exception), Error Boundary menampilkan halaman fallback dengan tombol "Kembali ke Dashboard" — bukan blank screen.

### 4.4 Form Validation Error

Validasi form menggunakan **Zod** + **React Hook Form**:

```typescript
// Zod schema — validasi sebelum submit
const createAssetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(200, 'Maksimal 200 karakter'),
  categoryId: z.number({ invalid_type_error: 'Kategori wajib dipilih' }).positive(),
});

// Pesan error ditampilkan inline di bawah field
<Input {...field} error={form.formState.errors.name?.message} />
```

**Prioritas validasi:**

1. **Client-side** (Zod) — validasi sebelum request dikirim.
2. **Server-side** (class-validator) — validasi kedua sebagai safety net.
3. Server error yang lolos client validation ditampilkan sebagai toast.

---

## 5. Katalog Status Code & Error Type

### 5.1 HTTP Status Code Mapping

| Code  | Nama                  | Kapan Digunakan                                            |
| :---: | --------------------- | ---------------------------------------------------------- |
| `200` | OK                    | GET, PATCH, DELETE berhasil                                |
| `201` | Created               | POST berhasil membuat resource                             |
| `400` | Bad Request           | Validasi gagal, foreign key invalid, relasi error          |
| `401` | Unauthorized          | Token tidak ada, expired, atau invalid                     |
| `403` | Forbidden             | User tidak punya permission yang dibutuhkan                |
| `404` | Not Found             | Resource tidak ditemukan (termasuk Prisma P2025)           |
| `408` | Request Timeout       | Request melebihi 30 detik                                  |
| `409` | Conflict              | Unique constraint violation (Prisma P2002)                 |
| `422` | Unprocessable Entity  | Business rule violation (stok tidak cukup, status invalid) |
| `429` | Too Many Requests     | Rate limit terlampaui                                      |
| `500` | Internal Server Error | Unexpected server error                                    |

### 5.2 Error Type Identifier

| error (field)         | statusCode | Penyebab Spesifik                                   |
| --------------------- | :--------: | --------------------------------------------------- |
| `Bad Request`         |    400     | Validasi DTO gagal, input tidak sesuai schema       |
| `ForeignKeyError`     |    400     | Referensi ke data yang tidak ada (Prisma P2003)     |
| `RelationError`       |    400     | Required relation tidak terpenuhi (Prisma P2014)    |
| `Unauthorized`        |    401     | Token JWT tidak valid atau expired                  |
| `Forbidden`           |    403     | Permission insufficient                             |
| `NotFoundError`       |    404     | Resource tidak ditemukan di database (Prisma P2025) |
| `ConflictError`       |    409     | Duplikasi data / unique constraint (Prisma P2002)   |
| `UnprocessableEntity` |    422     | Business rule tidak terpenuhi                       |
| `TooManyRequests`     |    429     | Rate limiting                                       |
| `InternalServerError` |    500     | Unhandled exception — bug                           |
| `DatabaseError`       |    500     | Prisma error tidak dikenal                          |

### 5.3 Business Rule Error Scenarios

| Skenario                                        | statusCode | message                                                        |
| ----------------------------------------------- | :--------: | -------------------------------------------------------------- |
| Stok tidak cukup saat permintaan                |    422     | "Stok tidak mencukupi untuk permintaan ini"                    |
| Self-approval attempt                           |    422     | "Anda tidak dapat menyetujui transaksi yang Anda buat sendiri" |
| Transisi status tidak valid                     |    422     | "Tidak dapat mengubah status dari {from} ke {to}"              |
| Aset sedang dipinjam saat diajukan pinjam       |    422     | "Aset sedang dalam status IN_USE dan tidak tersedia"           |
| Hapus kategori yang masih memiliki aset         |    409     | "Tidak dapat menghapus kategori yang masih memiliki aset"      |
| Login gagal (kredensial salah)                  |    401     | "Email atau password salah"                                    |
| Refresh token reuse (security breach detection) |    401     | "Token telah digunakan — semua sesi Anda telah di-logout"      |
| Akses halaman admin oleh Staff                  |    403     | "Anda tidak memiliki izin untuk mengakses resource ini"        |

---

## 6. Error Logging & Observability

### 6.1 Server-Side Logging

| Severity | Kondisi                 | Yang Di-log                                              |
| -------- | ----------------------- | -------------------------------------------------------- |
| `ERROR`  | statusCode >= 500       | Full stack trace, request method, URL, user ID           |
| `WARN`   | statusCode 400-499      | Error message, request method, URL (tanpa stack trace)   |
| `LOG`    | Request/response normal | Method, URL, user email, response time (ms)              |
| `DEBUG`  | Development only        | Query parameters, request body (sensitive data redacted) |

### 6.2 Yang TIDAK BOLEH Di-log

- Password (raw maupun hashed)
- JWT token (access maupun refresh)
- Data kartu kredit / pembayaran (N/A untuk Trinity, tapi prinsip tetap berlaku)
- Stack trace ke client response

### 6.3 Log Format

```
[Nest] 12345  - 04/10/2026, 8:15:00 AM  ERROR [AllExceptionsFilter] POST /api/v1/assets - 500
PrismaClientUnknownRequestError: Can't reach database server at `db:5432`
    at PrismaClient._request (...)
    at async AssetsService.create (...)
```

### 6.4 Monitoring Integration

- **Health endpoint**: `GET /api/v1/health` — returns service status.
- **Prometheus metrics**: Exposed untuk scraping (request count, latency, error rate).
- **Alerting target**: Notify via WhatsApp jika error rate > 5% dalam 5 menit.

---

## 7. Panduan Developer

### 7.1 Checklist Error Handling (Backend)

- [ ] Setiap service method throw NestJS exception (`NotFoundException`, `ConflictException`, dll) — bukan return error object.
- [ ] DTO selalu menggunakan `class-validator` decorators dengan pesan Bahasa Indonesia.
- [ ] Business rule violation → `UnprocessableEntityException` (422).
- [ ] Tidak ada `try/catch` di controller — biarkan `AllExceptionsFilter` menangani.
- [ ] Database transaction untuk operasi multi-step → `prisma.$transaction()`.
- [ ] Jangan pernah return raw Prisma error ke client.

### 7.2 Checklist Error Handling (Frontend)

- [ ] Semua API call via TanStack Query (bukan fetch/axios langsung).
- [ ] Form validation via Zod schema (client-side) — server error sebagai fallback.
- [ ] Toast notification untuk mutation errors (create, update, delete).
- [ ] Error boundary di root level untuk crash protection.
- [ ] Loading state selama request berlangsung (skeleton/spinner).
- [ ] Empty state untuk list kosong (bukan error).
- [ ] 401 → redirect ke login. 403 → tampilkan "tidak memiliki izin".

### 7.3 Anti-Patterns (JANGAN Lakukan)

```typescript
// ❌ Return error object — susah dideteksi oleh caller
async create(dto) {
  try { ... }
  catch (e) {
    return { success: false, message: e.message }; // SALAH
  }
}

// ✅ Throw exception — AllExceptionsFilter akan menangani
async create(dto) {
  const existing = await this.prisma.asset.findFirst({ where: { serialNumber: dto.serialNumber } });
  if (existing) throw new ConflictException('Serial number sudah terdaftar');
  return this.prisma.asset.create({ data: dto });
}
```

```typescript
// ❌ Generic try/catch di controller — masking error
@Post()
async create(@Body() dto) {
  try {
    return await this.service.create(dto);
  } catch (e) {
    return { error: 'Something went wrong' }; // SALAH — hide real error
  }
}

// ✅ Biarkan exception propagate — filter menangani formatting
@Post()
async create(@Body() dto: CreateAssetDto) {
  return this.service.create(dto); // Exception auto-caught by filter
}
```

```typescript
// ❌ Throw generic Error
throw new Error('Not found'); // SALAH — jadi 500 di AllExceptionsFilter

// ✅ Throw NestJS HttpException
throw new NotFoundException('Aset tidak ditemukan'); // Benar → 404
```

### 7.4 Urutan Eksekusi Pipeline

```
Request masuk
  → TrimStringPipe          (bersihkan whitespace)
  → ValidationPipe           (validasi DTO — bisa 400)
  → JwtAuthGuard             (verifikasi token — bisa 401)
  → PermissionsGuard         (cek permission — bisa 403)
  → LoggingInterceptor       (mulai timer)
  → TimeoutInterceptor       (set 30s limit)
  → Controller method
  → Service logic            (bisa throw 404/409/422)
  → TransformInterceptor     (wrap response { success: true, data })
  → LoggingInterceptor       (log response time)
Response keluar

┌────────────────────────────────┐
│   AllExceptionsFilter catches  │
│   ANY exception from ANY step  │
│   → format to ErrorResponse    │
│   → send to client             │
└────────────────────────────────┘
```
