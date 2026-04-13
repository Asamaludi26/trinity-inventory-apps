# Audit Separation of Concerns: Zustand Stores & TanStack Query Hooks

> **Tanggal Audit:** 3 April 2026
> **Status:** ✅ CLEAN — 0 Pelanggaran Ditemukan
> **Build:** `tsc --noEmit` PASS (0 errors)
> **Tests:** 58/58 store tests pass

---

## 1. Prinsip Separation of Concerns

| Layer                    | Tanggung Jawab                                              | Dilarang                                                            |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| **Zustand Store**        | Client-state: data arrays, UI state, pure computed helpers  | Import API/services, panggil HTTP, gunakan `useQuery`/`useMutation` |
| **TanStack Query Hook**  | Server-state: fetch, cache, mutasi via API services         | Import `useXxxStore` sebagai hook, panggil `getState().setXxx()`    |
| **Component (Consumer)** | Orkestrasi: panggil TQ hook, sync hasil ke store jika perlu | Business logic berat, direct API calls                              |

---

## 2. Hasil Audit Zustand Stores

### 2.1 Ringkasan

| #   | Store                  | Status     | Catatan                                                                                  |
| --- | ---------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | `useAuthStore`         | ✅ CLEAN   | Thin state: `currentUser`, `token`, `setAuth`, `logout`, `checkSession`                  |
| 2   | `useMasterDataStore`   | ✅ CLEAN   | Data container murni: `users[]`, `divisions[]`, `customers[]`                            |
| 3   | `useAssetStore`        | ✅ CLEAN   | Data + pure computed helpers (checkAvailability, validateStock)                          |
| 4   | `useTransactionStore`  | ✅ CLEAN   | Data container murni: `handovers[]`, `dismantles[]`, `maintenances[]`, `installations[]` |
| 5   | `useRequestStore`      | ✅ CLEAN   | Data container murni: `requests[]`, `loanRequests[]`, `returns[]`                        |
| 6   | `useNotificationStore` | ✅ CLEAN   | Client-side toast + local filtering helpers                                              |
| 7   | `useUIStore`           | ✅ CLEAN   | UI state: theme, sidebar, page, WA modal. `import type` untuk `WAMessagePayload`         |
| 8   | `useSessionStore`      | ✅ CLEAN   | Session-expired state untuk modal                                                        |
| 9   | `useRepairStore`       | ✅ CLEAN\* | \*CRUD lokal via `persist` — belum migrasi ke server. Kandidat migrasi ke depan          |

### 2.2 Detail Per Store

#### `useAuthStore.ts`

```
State: currentUser | token
Methods: setAuth() | logout() | updateCurrentUser() | checkSession()
API imports: NONE
Persist: ✅ (auth-storage)
```

**Sebelum refactor:** Store memiliki `login()`, `isLoading`, `error`, `requestPasswordReset()` yang langsung memanggil `authApi`.
**Setelah refactor:** Semua API call dipindah ke `useAuthQueries.ts`. Store hanya menyimpan state dan method sinkron.

#### `useMasterDataStore.ts`

```
State: users[] | divisions[] | customers[] | isLoading
Methods: NONE
API imports: NONE
```

**Sebelum refactor:** Memiliki `fetchUsers()`, `fetchDivisions()`, `addUser()`, dll.
**Setelah refactor:** Data container murni, dihydrate oleh `RouterApp` dan `useRealtimeSync`.

#### `useAssetStore.ts`

```
State: assets[] | categories[] | stockMovements[] | thresholds{} | isLoading
Methods: checkAvailability() | validateStockForRequest() | getStockHistory() | getTechnicianStock() | updateThresholds()
Exported Utils: normalizeCategories() | sanitizeBulkAsset() | toInt()
API imports: NONE
Persist: ✅ (categories + thresholds)
```

**Sebelum refactor:** ~1400 baris dengan ~25 method API (fetchAssets, addAsset, updateAsset, dll).
**Setelah refactor:** ~200 baris. Hanya menyimpan data + pure computed helpers yang membaca state yang sudah ada di memory.

#### `useTransactionStore.ts`

```
State: handovers[] | dismantles[] | maintenances[] | installations[] | isLoading
Methods: NONE
API imports: NONE
```

**Sebelum refactor:** ~450 baris dengan CRUD methods untuk semua transaksi.
**Setelah refactor:** ~30 baris. Data container murni.

#### `useRequestStore.ts`

```
State: requests[] | loanRequests[] | returns[] | isLoading | lastUpdated
Methods: NONE
API imports: NONE
```

**Sebelum refactor:** ~700 baris dengan ~13 API methods.
**Setelah refactor:** ~30 baris. Data container murni.

#### `useNotificationStore.ts`

```
State: notifications[] | isLoading | unreadCount
Methods: addToast() | removeNotification() | getNotificationsByType() | getHighPriorityUnread()
API imports: NONE
```

**Sebelum refactor:** Memiliki `addSystemNotification()`, `markAsRead()`, `markAllAsRead()`, `fetchNotifications()` yang memanggil `notificationsApi`.
**Setelah refactor:** Hanya menangani toast (ephemeral, client-side) dan filtering lokal.

#### `useUIStore.ts`

```
State: activePage | isPageLoading | sidebarOpen | theme | pageInitialState | highlightedItemId | waModal*
Methods: 11 setter/toggler methods
API imports: NONE (import type WAMessagePayload — type-only, no runtime)
Persist: ✅ (theme + sidebar)
```

#### `useSessionStore.ts`

```
State: isSessionExpired | sessionExpiredMessage | sessionExpiredReason
Methods: setSessionExpired() | clearSessionExpired()
API imports: NONE
```

#### `useRepairStore.ts`

```
State: repairs[]
Methods: createRepair() | startRepair() | addProgress() | completeRepair() | receiveFromRepair() | decommissionRepair() | findActiveRepair() | findRepairsByAsset()
API imports: NONE
Persist: ✅
```

> **Catatan:** CRUD lokal menggunakan `persist`. Ini BUKAN pelanggaran SoC karena tidak ada backend API untuk repair saat ini. Saat API repair tersedia, method CRUD harus dipindahkan ke TQ hook.

---

## 3. Hasil Audit TanStack Query Hooks

### 3.1 Ringkasan

| #   | Hook File                    | Hooks | API Service                                                            | Store Import | Status   |
| --- | ---------------------------- | ----- | ---------------------------------------------------------------------- | ------------ | -------- |
| 1   | `useAuthQueries.ts`          | 4     | `authApi`                                                              | NONE         | ✅ CLEAN |
| 2   | `useAssetQueries.ts`         | 7     | `assetsApi`                                                            | NONE         | ✅ CLEAN |
| 3   | `useRequestQueries.ts`       | 20    | `requestsApi`, `loansApi`, `returnsApi`                                | NONE         | ✅ CLEAN |
| 4   | `useTransactionQueries.ts`   | 21    | `handoversApi`, `installationsApi`, `maintenancesApi`, `dismantlesApi` | NONE         | ✅ CLEAN |
| 5   | `useMasterDataQueries.ts`    | 27    | `usersApi`, `customersApi`, `divisionsApi`, `categoriesApi`            | NONE         | ✅ CLEAN |
| 6   | `useNotificationQueries.ts`  | 8     | `notificationsApi`                                                     | NONE         | ✅ CLEAN |
| 7   | `useStockQueries.ts`         | 5     | `stockApi`                                                             | NONE         | ✅ CLEAN |
| 8   | `useAssetTransferQueries.ts` | 6     | `assetTransfersApi`                                                    | NONE         | ✅ CLEAN |

**Total: 98 TQ hooks, 0 pelanggaran.**

### 3.2 Detail Per Hook File

#### `useAuthQueries.ts`

| Hook                      | Tipe     | Deskripsi                                                          |
| ------------------------- | -------- | ------------------------------------------------------------------ |
| `useLogin`                | mutation | Login, return `{ user, token }` — consumer sync ke Zustand         |
| `useLogout`               | mutation | Logout + `queryClient.clear()` — consumer panggil `store.logout()` |
| `useRequestPasswordReset` | mutation | Request reset password via email                                   |
| `useUpdatePassword`       | mutation | Update password user yang sedang login                             |

> **Pola Auth:** `useLogin` mengembalikan response data. **LoginPage** (consumer) bertanggung jawab memanggil `useAuthStore.getState().setAuth()`. Ini memastikan TQ hook tidak tight-coupled ke Zustand.

#### `useAssetQueries.ts`

| Hook                   | Tipe                         |
| ---------------------- | ---------------------------- |
| `useAssets`            | query                        |
| `useAsset`             | query                        |
| `useCreateAsset`       | mutation + invalidate        |
| `useUpdateAsset`       | mutation + optimistic update |
| `useBatchUpdateAssets` | mutation + invalidate        |
| `useDeleteAsset`       | mutation + invalidate        |
| `useConsumeMaterial`   | mutation + invalidate        |

#### `useRequestQueries.ts`

| Hook                     | Tipe     | Catatan                        |
| ------------------------ | -------- | ------------------------------ |
| `useRequests`            | query    |                                |
| `useRequest`             | query    |                                |
| `useCreateRequest`       | mutation | + `triggerRefresh("REQUESTS")` |
| `useUpdateRequest`       | mutation | + `triggerRefresh("REQUESTS")` |
| `useApproveRequest`      | mutation |                                |
| `useRejectRequest`       | mutation |                                |
| `useCancelRequest`       | mutation |                                |
| `useFillPurchaseDetails` | mutation |                                |
| `useDeleteRequest`       | mutation | + `triggerRefresh("REQUESTS")` |
| `useLoanRequests`        | query    |                                |
| `useLoanRequest`         | query    |                                |
| `useCreateLoanRequest`   | mutation |                                |
| `useApproveLoanRequest`  | mutation |                                |
| `useRejectLoanRequest`   | mutation |                                |
| `useUpdateLoanRequest`   | mutation |                                |
| `useDeleteLoanRequest`   | mutation |                                |
| `useReturns`             | query    |                                |
| `useReturn`              | query    |                                |
| `useSubmitReturn`        | mutation |                                |
| `useVerifyReturn`        | mutation |                                |

#### `useTransactionQueries.ts`

| Hook                                                                                                | Tipe     |
| --------------------------------------------------------------------------------------------------- | -------- |
| `useHandovers` / `useHandover`                                                                      | query    |
| `useCreateHandover` / `useDeleteHandover`                                                           | mutation |
| `useInstallations` / `useInstallation`                                                              | query    |
| `useCreateInstallation` / `useUpdateInstallation` / `useDeleteInstallation`                         | mutation |
| `useMaintenances` / `useMaintenance`                                                                | query    |
| `useCreateMaintenance` / `useUpdateMaintenance` / `useCompleteMaintenance` / `useDeleteMaintenance` | mutation |
| `useDismantles` / `useDismantle`                                                                    | query    |
| `useCreateDismantle` / `useUpdateDismantle` / `useCompleteDismantle` / `useDeleteDismantle`         | mutation |

#### `useMasterDataQueries.ts`

| Hook                                                                                        | Tipe           |
| ------------------------------------------------------------------------------------------- | -------------- |
| `useUsers` / `useUser`                                                                      | query          |
| `useCreateUser` / `useUpdateUser` / `useDeleteUser` / `useResetUserPassword`                | mutation       |
| `useCustomers` / `useCustomer`                                                              | query          |
| `useCreateCustomer` / `useUpdateCustomer` / `useDeleteCustomer` / `useUpdateCustomerStatus` | mutation       |
| `useDivisions`                                                                              | query          |
| `useCreateDivision` / `useUpdateDivision` / `useDeleteDivision`                             | mutation       |
| `useCategories` / `useUpdateCategories`                                                     | query/mutation |
| `useCreateCategory` / `useUpdateCategory` / `useDeleteCategory`                             | mutation       |
| `useCreateType` / `useUpdateType` / `useDeleteType`                                         | mutation       |
| `useCreateModel` / `useUpdateModel` / `useDeleteModel`                                      | mutation       |

#### `useNotificationQueries.ts`

| Hook                        | Tipe     |
| --------------------------- | -------- |
| `useNotifications`          | query    |
| `useUnreadCount`            | query    |
| `useNotificationSummary`    | query    |
| `useCreateNotification`     | mutation |
| `useMarkAsRead`             | mutation |
| `useMarkAllAsRead`          | mutation |
| `useDeleteNotification`     | mutation |
| `useClearReadNotifications` | mutation |

#### `useStockQueries.ts`

| Hook                     | Tipe     |
| ------------------------ | -------- |
| `useStockMovements`      | query    |
| `useStockLedger`         | query    |
| `useStockItemHistory`    | query    |
| `useStockAvailability`   | query    |
| `useRecordStockMovement` | mutation |

#### `useAssetTransferQueries.ts`

| Hook                       | Tipe                                  |
| -------------------------- | ------------------------------------- |
| `useAssetTransfers`        | query                                 |
| `useAssetTransfer`         | query                                 |
| `useAssetTransfersByAsset` | query                                 |
| `useCreateAssetTransfer`   | mutation + `triggerRefresh("ASSETS")` |
| `useApproveAssetTransfer`  | mutation + `triggerRefresh("ASSETS")` |
| `useRejectAssetTransfer`   | mutation                              |

### 3.3 Barrel Export (`hooks/queries/index.ts`)

✅ Semua 8 module hook di-export dengan benar melalui barrel file, termasuk `useAssetTransferQueries` yang baru ditambahkan.

---

## 4. Koordinasi Antar Layer

### 4.1 Pola Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENT (Consumer)                      │
│                                                                  │
│  1. Panggil TQ hook (useCreateAsset, useUpdateRequest, dll)      │
│  2. Baca data dari Zustand store (useAssetStore, dll)            │
│  3. Sync hasil mutasi ke store jika perlu (setState)             │
│                                                                  │
│  Contoh LoginPage:                                               │
│    const loginMutation = useLogin();                             │
│    const response = await loginMutation.mutateAsync({...});      │
│    useAuthStore.getState().setAuth(response.user, response.token)│
└──────────────┬───────────────────────────┬───────────────────────┘
               │                           │
       ┌───────▼───────┐          ┌────────▼────────┐
       │  TanStack Query │          │  Zustand Store   │
       │                │          │                  │
       │  • API calls   │          │  • Data arrays   │
       │  • Cache       │          │  • UI state      │
       │  • Mutations   │          │  • Pure helpers   │
       │  • Invalidation│          │  • Persist       │
       │                │          │                  │
       │  ✗ No store    │          │  ✗ No API calls  │
       │    imports      │          │  ✗ No TQ imports │
       └───────┬────────┘          └─────────────────┘
               │
       ┌───────▼────────┐
       │  API Services   │
       │  (services/api) │
       └─────────────────┘
```

### 4.2 Hydration & Real-time Sync

| Mekanisme            | Deskripsi                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| **RouterApp**        | Saat app load, panggil `unifiedApi.fetchAllData()` → `useXxxStore.setState()`  |
| **useRealtimeSync**  | SSE events → `unifiedApi.refreshXxx()` → `useXxxStore.setState()`              |
| **Polling Fallback** | Saat SSE disconnect → `storeRefreshers.all()` + `queryClient.refetchQueries()` |
| **triggerRefresh()** | TQ mutation hooks emit event → `useRealtimeSync` listener → refresh store      |

### 4.3 Pola Koordinasi yang Diperbolehkan

| ✅ Diperbolehkan                                                | ❌ Dilarang                                    |
| --------------------------------------------------------------- | ---------------------------------------------- |
| TQ hook: `queryClient.invalidateQueries()`                      | TQ hook: `useXxxStore.getState().setXxx()`     |
| TQ hook: `triggerRefresh("REQUESTS")`                           | TQ hook: `useXxxStore((s) => s.xxx)`           |
| Component: `useXxxStore.getState().setAuth()`                   | Store: `import { api } from "../services/api"` |
| Store: pure utility export (`normalizeCategories`)              | Store: `useQuery()` / `useMutation()`          |
| Store: cross-store read (`useRequestStore.getState().requests`) | TQ hook: direct store mutation                 |

---

## 5. Test Coverage

| Test File                      | Tests  | Status          |
| ------------------------------ | ------ | --------------- |
| `useAuthStore.test.ts`         | 14     | ✅ Pass         |
| `useNotificationStore.test.ts` | 23     | ✅ Pass         |
| `useUIStore.test.ts`           | 21     | ✅ Pass         |
| **Total**                      | **58** | **✅ All Pass** |

---

## 6. Catatan & Rekomendasi

### 6.1 Action Items (Minor)

| #   | Item                                                                 | Prioritas | Status    |
| --- | -------------------------------------------------------------------- | --------- | --------- |
| 1   | `useRepairStore` — Migrasi CRUD ke TQ hooks saat API repair tersedia | Low       | ⏳ Future |
| 2   | Tambah unit test untuk TQ hooks (`useAuthQueries`, dll)              | Medium    | ⏳ TODO   |

### 6.2 Perubahan yang Dilakukan Selama Audit

| File                     | Perubahan                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| `useAuthQueries.ts`      | Hapus `import useAuthStore` — pindahkan sync ke consumer (LoginPage) |
| `useUIStore.ts`          | `import { WAMessagePayload }` → `import type { WAMessagePayload }`   |
| `hooks/queries/index.ts` | Tambah barrel export untuk `useAssetTransferQueries` (7 exports)     |
| `LoginPage.tsx`          | Tambah `useAuthStore.getState().setAuth()` setelah login sukses      |

---

## 7. Kesimpulan

| Metric                   | Hasil                        |
| ------------------------ | ---------------------------- |
| **Zustand Stores**       | 9/9 CLEAN (0 pelanggaran)    |
| **TanStack Query Hooks** | 8/8 CLEAN (0 pelanggaran)    |
| **Total TQ Hooks**       | 98 hooks                     |
| **TypeScript Build**     | ✅ `tsc --noEmit` — 0 errors |
| **Unit Tests**           | ✅ 58/58 pass                |
| **Barrel Exports**       | ✅ Semua hook di-export      |

**Separation of Concerns antara Zustand dan TanStack Query telah diterapkan sepenuhnya.** Setiap layer hanya menjalankan tanggung jawab masing-masing tanpa pelanggaran batas.
