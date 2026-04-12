# API Contract & Documentation — Trinity Inventory Apps

**Versi**: 1.0.0
**Tanggal**: 10 April 2026
**Referensi Utama**: SDD v3.1 Bagian 5 (API Endpoints), PRD v3.1 Bagian 5.1 (Fitur Fungsional)
**Status**: FINAL — Setiap perubahan kontrak API harus melalui proses Change Request formal.

---

## Daftar Isi

1. [Ikhtisar & Prinsip Desain](#1-ikhtisar--prinsip-desain)
2. [Base URL & Versioning](#2-base-url--versioning)
3. [Autentikasi & Otorisasi](#3-autentikasi--otorisasi)
4. [Format Request](#4-format-request)
5. [Format Response — Kontrak Baku](#5-format-response--kontrak-baku)
6. [Katalog Error Code](#6-katalog-error-code)
7. [Pagination, Filter, & Sorting](#7-pagination-filter--sorting)
8. [Endpoint Catalog (per Domain)](#8-endpoint-catalog-per-domain)
9. [Swagger / OpenAPI](#9-swagger--openapi)
10. [Aturan Evolusi API (Versioning Strategy)](#10-aturan-evolusi-api-versioning-strategy)

---

## 1. Ikhtisar & Prinsip Desain

API Trinity menggunakan arsitektur **RESTful** dengan prinsip-prinsip berikut:

| Prinsip                       | Penerapan                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Resource-Oriented**         | URL merepresentasikan resource (`/assets`, `/loans`), bukan aksi                                           |
| **Stateless**                 | Setiap request membawa JWT — server tidak menyimpan session                                                |
| **Consistent Response Shape** | Semua endpoint mengembalikan format `{ success, data, meta? }` / `{ success, statusCode, message, error }` |
| **Idempotent Methods**        | `GET`, `PUT`, `DELETE` idempotent; `POST` tidak                                                            |
| **HATEOAS-lite**              | Response menyertakan `meta.totalPages` untuk navigasi — tanpa full HATEOAS                                 |
| **DRY Endpoints**             | Modul transaksi berbagi pola URL identik (→ SDD 5.2)                                                       |

---

## 2. Base URL & Versioning

### Struktur URL

```
https://{host}/api/v{version}/{resource}
```

| Environment | Base URL                                  |
| ----------- | ----------------------------------------- |
| Development | `http://localhost:3001/api/v1`            |
| Staging     | `https://staging.trinitimedia.com/api/v1` |
| Production  | `https://app.trinitimedia.com/api/v1`     |

### Versioning Strategy

- **Tipe**: URI-based (`/api/v1/`, `/api/v2/`)
- **Default Version**: `v1`
- **Implementasi NestJS**:

```typescript
app.setGlobalPrefix('api/');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
  prefix: 'v',
});
```

### CORS Configuration

```typescript
{
  origin: isProduction ? corsOrigin.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  maxAge: 86400, // 24 hours preflight cache
}
```

---

## 3. Autentikasi & Otorisasi

### 3.1 Skema Autentikasi

| Header          | Format                   | Keterangan                                |
| --------------- | ------------------------ | ----------------------------------------- |
| `Authorization` | `Bearer <access_token>`  | JWT access token (masa berlaku: 15 menit) |
| —               | Body: `{ refreshToken }` | JWT refresh token (masa berlaku: 7 hari)  |

### 3.2 Alur Token

```
POST /auth/login        → { accessToken, refreshToken, user }
POST /auth/refresh       → { accessToken, refreshToken }  (rotasi otomatis)
POST /auth/logout        → invalidate refresh token
```

### 3.3 Permission-Based Authorization

Setiap endpoint dilindungi oleh decorator komposit `@AuthPermissions()`:

```typescript
@AuthPermissions(PERMISSIONS.ASSETS_CREATE)
// Menggabungkan: JwtAuthGuard + PermissionsGuard + RequirePermissions
```

Referensi lengkap permission keys: `backend/src/common/constants/permissions.constants.ts`

### 3.4 Public Endpoints

Endpoint yang tidak memerlukan autentikasi ditandai `@Public()`:

| Endpoint        | Method | Keterangan    |
| --------------- | ------ | ------------- |
| `/auth/login`   | POST   | Login         |
| `/auth/refresh` | POST   | Refresh token |
| `/health`       | GET    | Health check  |

---

## 4. Format Request

### 4.1 Content Type

| Tipe Request     | Content-Type                        |
| ---------------- | ----------------------------------- |
| JSON Body        | `application/json`                  |
| File Upload      | `multipart/form-data`               |
| Query Parameters | URL-encoded (otomatis oleh browser) |

### 4.2 Validasi Input (Global ValidationPipe)

Semua request body divalidasi melalui DTO dengan `class-validator`:

```typescript
new ValidationPipe({
  whitelist: true, // Strip properti yang tidak ada di DTO
  forbidNonWhitelisted: true, // Tolak properti yang tidak dikenal → 400
  transform: true, // Auto-transform tipe (string→number, dll)
  transformOptions: {
    enableImplicitConversion: true,
  },
  stopAtFirstError: true, // Hentikan pada error validasi pertama
});
```

**Efek**:

- Properti di luar DTO otomatis dibuang (`whitelist`) atau ditolak (`forbidNonWhitelisted`).
- Tipe data otomatis dikonversi (`"10"` → `10` untuk `@IsNumber()`).
- Whitespace otomatis di-trim via `TrimStringPipe`.

### 4.3 Contoh Request Body (Create Asset)

```json
POST /api/v1/assets
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "name": "MikroTik RB750Gr3",
  "categoryId": 1,
  "typeId": 3,
  "modelId": 7,
  "serialNumber": "SN-2026-001",
  "brand": "MikroTik",
  "condition": "BRAND_NEW",
  "notes": "Pembelian batch Q1 2026"
}
```

---

## 5. Format Response — Kontrak Baku

### 5.1 Success Response

Semua response sukses melewati `TransformInterceptor` dan dibungkus dalam format:

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}
```

#### Single Item (GET /:id, POST, PATCH)

```json
{
  "success": true,
  "data": {
    "id": "cuid_abc123",
    "name": "MikroTik RB750Gr3",
    "status": "IN_STORAGE",
    "condition": "BRAND_NEW",
    "createdAt": "2026-04-10T08:00:00.000Z",
    "updatedAt": "2026-04-10T08:00:00.000Z"
  }
}
```

#### List dengan Pagination (GET /)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cuid_abc123",
        "name": "MikroTik RB750Gr3",
        "status": "IN_STORAGE"
      },
      { "id": "cuid_abc456", "name": "TP-Link Archer C6", "status": "IN_USE" }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

#### Delete (Soft Delete)

```json
{
  "success": true,
  "data": null
}
```

### 5.2 Error Response

Semua error melewati `AllExceptionsFilter` dan menghasilkan format:

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string; // ISO 8601
  path: string; // Request URL
  details?: unknown; // Detail tambahan (opsional)
}
```

#### Contoh Error — Validasi Gagal (400)

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

#### Contoh Error — Duplikasi Data (409)

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

### 5.3 Konversi Otomatis

`TransformInterceptor` melakukan konversi otomatis berikut:

| Tipe Asal        | Tipe Hasil | Keterangan                                               |
| ---------------- | ---------- | -------------------------------------------------------- |
| Prisma `Decimal` | `number`   | Semua field decimal dikonversi otomatis via `toNumber()` |
| `BigInt`         | `string`   | Serialized via `BigInt.prototype.toJSON` override        |
| Nested objects   | Recursive  | Konversi berlaku hingga kedalaman tak terbatas           |

---

## 6. Katalog Error Code

### 6.1 HTTP Status Code

| Status Code | Nama                  | Kapan Digunakan                                       |
| :---------: | --------------------- | ----------------------------------------------------- |
|    `200`    | OK                    | GET, PATCH, DELETE berhasil                           |
|    `201`    | Created               | POST berhasil membuat resource baru                   |
|    `400`    | Bad Request           | Validasi gagal, foreign key tidak valid, relasi error |
|    `401`    | Unauthorized          | Token tidak valid, expired, atau tidak ada            |
|    `403`    | Forbidden             | User tidak memiliki permission yang diperlukan        |
|    `404`    | Not Found             | Resource tidak ditemukan                              |
|    `409`    | Conflict              | Unique constraint violation (duplikasi data)          |
|    `422`    | Unprocessable Entity  | Business rule violation (stok tidak cukup, dll)       |
|    `429`    | Too Many Requests     | Rate limiting terlampaui                              |
|    `500`    | Internal Server Error | Error tidak terduga di server                         |

### 6.2 Pemetaan Prisma Error → HTTP Status

| Prisma Code | HTTP Status | Pesan Bahasa Indonesia                    |
| ----------- | :---------: | ----------------------------------------- |
| `P2002`     |    `409`    | Duplikasi data: `{field}` sudah digunakan |
| `P2003`     |    `400`    | Referensi data tidak valid                |
| `P2025`     |    `404`    | Data tidak ditemukan                      |
| `P2014`     |    `400`    | Relasi data diperlukan                    |
| Lainnya     |    `500`    | Database error                            |

### 6.3 Error Code Bisnis (422 Unprocessable Entity)

| Error Code                  | Konteks                                                  |
| --------------------------- | -------------------------------------------------------- |
| `BUSINESS_RULE_VIOLATION`   | Stok tidak mencukupi, approval chain invalid             |
| `SELF_APPROVAL_PREVENTED`   | User tidak boleh approve transaksi yang dia buat sendiri |
| `INVALID_STATUS_TRANSITION` | Transisi status tidak valid (misal: COMPLETED→PENDING)   |
| `ASSET_NOT_AVAILABLE`       | Aset sedang dalam status IN_USE/LOANED                   |
| `THRESHOLD_EXCEEDED`        | Stok di bawah ambang batas minimum                       |

---

## 7. Pagination, Filter, & Sorting

### 7.1 Query Parameters Standar

| Parameter   | Tipe   | Default | Range     | Deskripsi                          |
| ----------- | ------ | :-----: | --------- | ---------------------------------- |
| `page`      | number |   `1`   | min: 1    | Nomor halaman                      |
| `limit`     | number |  `10`   | 1 – 100   | Jumlah item per halaman            |
| `search`    | string |    —    | —         | Full-text search (nama, kode, dll) |
| `sortBy`    | string |    —    | —         | Nama field untuk sorting           |
| `sortOrder` | enum   | `DESC`  | ASC, DESC | Arah pengurutan                    |

### 7.2 Filter Spesifik per Domain

| Domain       | Filter Tambahan                                                        |
| ------------ | ---------------------------------------------------------------------- |
| Assets       | `status`, `condition`, `categoryId`, `typeId`, `modelId`, `divisionId` |
| Transactions | `status`, `module`, `createdBy`, `dateFrom`, `dateTo`                  |
| Customers    | `search`, `isActive`                                                   |
| Users        | `role`, `divisionId`, `isActive`                                       |

### 7.3 Contoh Request

```
GET /api/v1/assets?page=2&limit=20&search=mikrotik&status=IN_STORAGE&sortBy=createdAt&sortOrder=DESC
```

### 7.4 Response Meta

```json
{
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 8. Endpoint Catalog (per Domain)

> Dokumentasi lengkap setiap endpoint tersedia di Swagger UI (`/api/docs` pada development).
> Bagian ini adalah ringkasan kontrak sebagai referensi cepat.

### 8.1 Authentication

| Method  | Endpoint                | Deskripsi                         | Auth | Request Body                                        |
| ------- | ----------------------- | --------------------------------- | :--: | --------------------------------------------------- |
| `POST`  | `/auth/login`           | Login user                        |  ❌  | `{ email, password }`                               |
| `POST`  | `/auth/refresh`         | Refresh access token              |  ❌  | `{ refreshToken }`                                  |
| `POST`  | `/auth/logout`          | Logout (invalidate refresh token) |  ✅  | —                                                   |
| `PATCH` | `/auth/change-password` | Ganti password                    |  ✅  | `{ currentPassword, newPassword, confirmPassword }` |

**Response Login:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@trinitimedia.com",
      "role": "ADMIN_LOGISTIK",
      "division": { "id": 2, "name": "Logistik" },
      "permissions": ["assets:read", "assets:create", "assets:edit"]
    }
  }
}
```

### 8.2 Assets (F-02 + F-03)

| Method   | Endpoint                     | Deskripsi                               | Permission            |
| -------- | ---------------------------- | --------------------------------------- | --------------------- |
| `GET`    | `/assets`                    | List aset + pagination                  | `assets:read`         |
| `GET`    | `/assets/:id`                | Detail aset                             | `assets:read`         |
| `POST`   | `/assets`                    | Buat aset baru                          | `assets:create`       |
| `PATCH`  | `/assets/:id`                | Update aset                             | `assets:edit`         |
| `DELETE` | `/assets/:id`                | Soft delete aset                        | `assets:delete`       |
| `GET`    | `/assets/stock`              | Stok (`?view=main\|division\|personal`) | `stock:read`          |
| `PATCH`  | `/assets/stock/threshold`    | Set threshold per model                 | `stock:edit`          |
| `GET`    | `/assets/scan/:qrData`       | Scan QR code aset                       | `assets:read`         |
| `GET`    | `/assets/:id/qr-code`        | Generate QR code                        | `assets:read`         |
| `GET`    | `/assets/categories`         | List kategori                           | `categories:read`     |
| `POST`   | `/assets/categories`         | Buat kategori                           | `categories:create`   |
| `PATCH`  | `/assets/categories/:id`     | Update kategori                         | `categories:edit`     |
| `DELETE` | `/assets/categories/:id`     | Hapus kategori                          | `categories:delete`   |
| `GET`    | `/assets/types`              | List tipe                               | `types:read`          |
| `POST`   | `/assets/types`              | Buat tipe                               | `types:create`        |
| `GET`    | `/assets/models`             | List model                              | `models:read`         |
| `POST`   | `/assets/models`             | Buat model                              | `models:create`       |
| `GET`    | `/assets/purchases`          | List data pembelian                     | `purchases:read`      |
| `POST`   | `/assets/purchases`          | Buat data pembelian                     | `purchases:create`    |
| `PATCH`  | `/assets/purchases/:uuid`    | Update data pembelian                   | `purchases:edit`      |
| `GET`    | `/assets/depreciation`       | List data depresiasi                    | `depreciation:read`   |
| `POST`   | `/assets/depreciation`       | Buat data depresiasi                    | `depreciation:create` |
| `GET`    | `/assets/depreciation/:uuid` | Detail depresiasi                       | `depreciation:read`   |
| `PATCH`  | `/assets/depreciation/:uuid` | Update data depresiasi                  | `depreciation:edit`   |

### 8.3 Transactions (F-04) — Pola DRY

Setiap modul transaksi (`requests`, `loans`, `returns`, `handovers`, `repairs`, `projects`) memiliki endpoint identik:

| Method  | Endpoint Pattern          | Deskripsi                          | Permission                               |
| ------- | ------------------------- | ---------------------------------- | ---------------------------------------- |
| `GET`   | `/{module}`               | List + pagination + filter         | `{module}:read`                          |
| `GET`   | `/{module}/:uuid`         | Detail + approval timeline         | `{module}:read`                          |
| `POST`  | `/{module}`               | Buat transaksi (status: `PENDING`) | `{module}:create`                        |
| `PATCH` | `/{module}/:uuid`         | Update data transaksi              | `{module}:edit` + status masih `PENDING` |
| `PATCH` | `/{module}/:uuid/approve` | Approve step saat ini              | `{module}:approve`                       |
| `PATCH` | `/{module}/:uuid/reject`  | Reject (body: `{ reason }`)        | `{module}:approve`                       |
| `PATCH` | `/{module}/:uuid/execute` | Eksekusi final oleh eksekutor      | `{module}:execute`                       |
| `PATCH` | `/{module}/:uuid/cancel`  | Cancel oleh creator (jika PENDING) | `{module}:create`                        |

> `{module}` = `requests` | `loans` | `returns` | `handovers` | `repairs` | `projects`

### 8.4 Customers (F-05)

| Method  | Endpoint            | Deskripsi                      | Permission            |
| ------- | ------------------- | ------------------------------ | --------------------- |
| `GET`   | `/customers`        | List pelanggan                 | `customers:read`      |
| `POST`  | `/customers`        | Buat pelanggan                 | `customers:create`    |
| `GET`   | `/customers/:uuid`  | Detail pelanggan + tab terkait | `customers:read`      |
| `PATCH` | `/customers/:uuid`  | Update pelanggan               | `customers:edit`      |
| `GET`   | `/installation`     | List instalasi                 | `installation:read`   |
| `POST`  | `/installation`     | Buat instalasi                 | `installation:create` |
| `GET`   | `/installation/:id` | Detail instalasi               | `installation:read`   |
| `PATCH` | `/installation/:id` | Update instalasi               | `installation:edit`   |
| `GET`   | `/maintenance`      | List maintenance               | `maintenance:read`    |
| `POST`  | `/maintenance`      | Buat maintenance               | `maintenance:create`  |
| `GET`   | `/dismantle`        | List dismantle                 | `dismantle:read`      |
| `POST`  | `/dismantle`        | Buat dismantle                 | `dismantle:create`    |

### 8.5 Settings (F-06)

| Method  | Endpoint                    | Deskripsi             | Permission         |
| ------- | --------------------------- | --------------------- | ------------------ |
| `GET`   | `/settings/profile`         | Get profil sendiri    | (semua user)       |
| `PATCH` | `/settings/profile`         | Update profil sendiri | (semua user)       |
| `GET`   | `/settings/users`           | List users            | `users:read`       |
| `POST`  | `/settings/users`           | Buat user baru        | `users:create`     |
| `PATCH` | `/settings/users/:uuid`     | Update user           | `users:edit`       |
| `GET`   | `/settings/divisions`       | List divisi           | `divisions:read`   |
| `POST`  | `/settings/divisions`       | Buat divisi           | `divisions:create` |
| `PATCH` | `/settings/divisions/:uuid` | Update divisi         | `divisions:edit`   |

### 8.6 Dashboard (F-01)

| Method | Endpoint                | Deskripsi             | Role           |
| ------ | ----------------------- | --------------------- | -------------- |
| `GET`  | `/dashboard/main`       | Statistik utama       | Superadmin     |
| `GET`  | `/dashboard/finance`    | Statistik keuangan    | Admin Purchase |
| `GET`  | `/dashboard/operations` | Statistik operasional | Admin Logistik |
| `GET`  | `/dashboard/division`   | Statistik divisi      | Leader         |
| `GET`  | `/dashboard/personal`   | Statistik pribadi     | Staff          |

### 8.7 Cross-Cutting

| Method  | Endpoint                  | Deskripsi                | Permission      |
| ------- | ------------------------- | ------------------------ | --------------- |
| `GET`   | `/notifications`          | List notifikasi user     | (semua user)    |
| `PATCH` | `/notifications/:id/read` | Tandai notifikasi dibaca | (semua user)    |
| `PATCH` | `/notifications/read-all` | Tandai semua dibaca      | (semua user)    |
| `POST`  | `/upload`                 | Upload file attachment   | (semua user)    |
| `GET`   | `/export/:module`         | Export data ke Excel/PDF | `{module}:read` |

---

## 9. Swagger / OpenAPI

### 9.1 Akses

| Environment | URL         | Status                 |
| ----------- | ----------- | ---------------------- |
| Development | `/api/docs` | ✅ Aktif               |
| Staging     | `/api/docs` | ✅ Aktif               |
| Production  | —           | ❌ Nonaktif (keamanan) |

### 9.2 Konfigurasi

```typescript
const swaggerConfig = new DocumentBuilder()
  .setTitle('Trinity Asset Management API')
  .setDescription('Backend API untuk sistem manajemen inventori aset')
  .setVersion('1.0.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
  .build();
```

### 9.3 Menguji via Swagger UI

1. Buka `/api/docs` pada browser.
2. Klik tombol **Authorize** di kanan atas.
3. Masukkan access token JWT (tanpa prefix `Bearer`).
4. Swagger akan menyertakan token pada semua request.

### 9.4 Auto-Generated Schema

DTO class secara otomatis menghasilkan schema OpenAPI via plugin `@nestjs/swagger`:

```typescript
@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
export class AssetController {

  @Get()
  @ApiOperation({ summary: 'List aset dengan pagination dan filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: AssetStatus })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data aset' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  findAll(@Query() query: AssetFilterDto) { ... }
}
```

---

## 10. Aturan Evolusi API (Versioning Strategy)

### 10.1 Backward Compatibility

| Perubahan                         | Breaking? | Aksi                                            |
| --------------------------------- | :-------: | ----------------------------------------------- |
| Menambah field baru ke response   |   Tidak   | Langsung deploy — client mengabaikan field baru |
| Menambah query parameter opsional |   Tidak   | Langsung deploy — default value disediakan      |
| Menghapus field dari response     |  **Ya**   | Buat versi baru (`v2`) atau deprecation period  |
| Mengubah tipe field               |  **Ya**   | Buat versi baru                                 |
| Mengubah URL pattern              |  **Ya**   | Buat versi baru + redirect dari URL lama        |

### 10.2 Deprecation Process

1. **Tandai deprecated** di Swagger: `@ApiOperation({ deprecated: true })`.
2. **Header warning**: Response menyertakan `Deprecation: true` dan `Sunset: {date}`.
3. **Grace period**: Minimum 30 hari sebelum endpoint dihapus.
4. **Komunikasi**: Buat changelog entry dan notifikasi ke consumer.

### 10.3 Rate Limiting

| Endpoint Group  | Limit       | Window  |
| --------------- | ----------- | ------- |
| `/auth/login`   | 5 request   | 1 menit |
| `/auth/refresh` | 10 request  | 1 menit |
| General API     | 100 request | 1 menit |
| `/upload`       | 10 request  | 1 menit |
| `/export/*`     | 5 request   | 1 menit |

---

## Lampiran: Contoh Interaksi Lengkap

### Login → Buat Aset → List Aset

```bash
# 1. Login
POST /api/v1/auth/login
{ "email": "admin@trinitimedia.com", "password": "SecureP@ss123" }

# Response:
# { "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": {...} } }

# 2. Buat Aset Baru
POST /api/v1/assets
Authorization: Bearer eyJ...
{ "name": "MikroTik hAP ac2", "categoryId": 1, "typeId": 3, "modelId": 7, "serialNumber": "SN-2026-002", "brand": "MikroTik", "condition": "BRAND_NEW" }

# Response:
# { "success": true, "data": { "id": "cm5x...", "name": "MikroTik hAP ac2", "status": "IN_STORAGE", ... } }

# 3. List Aset dengan Filter
GET /api/v1/assets?page=1&limit=10&status=IN_STORAGE&search=mikrotik
Authorization: Bearer eyJ...

# Response:
# { "success": true, "data": { "items": [...], "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 } } }
```
