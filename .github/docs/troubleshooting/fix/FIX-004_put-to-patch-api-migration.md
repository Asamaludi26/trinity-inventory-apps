# FIX-004: PUT Endpoint Returns 404/405 — API Method Migration

**Date**: 2026-04-02 (Commit `ec4916f`)  
**Severity**: HIGH (breaking API change)  
**Agent**: Backend Agent  
**Status**: ✅ RESOLVED

---

## Symptom

```
PUT /api/loans/:id/approve     → 404 Not Found / 405 Method Not Allowed
PUT /api/projects/:id          → 404 Not Found / 405 Method Not Allowed
PUT /api/requests/:id/approve  → 404 Not Found / 405 Method Not Allowed
PUT /api/returns/:id           → 404 Not Found / 405 Method Not Allowed
```

Frontend gagal melakukan update/approve/reject pada loans, projects, requests, dan returns.

## Root Cause

Commit `ec4916f` memigrasikan semua partial update endpoint dari `PUT` ke `PATCH` untuk mengikuti REST semantics yang benar:

- **PUT** = Replace entire resource (full body required)
- **PATCH** = Partial update (hanya field yang berubah)

Karena semua operation ini adalah partial update (approve, reject, status change), PATCH lebih tepat secara semantik.

## Resolution

Frontend API services sudah diupdate di commit yang sama (`ec4916f`):

```typescript
// ❌ Sebelum
api.put(`/loans/${id}/approve`, data);
api.put(`/projects/${id}`, data);
api.put(`/requests/${id}/approve`, data);

// ✅ Sesudah
api.patch(`/loans/${id}/approve`, data);
api.patch(`/projects/${id}`, data);
api.patch(`/requests/${id}/approve`, data);
```

### File Frontend yang Sudah Diupdate

| File                                        | Method Changed |
| ------------------------------------------- | -------------- |
| `frontend/src/services/api/loans.api.ts`    | PUT → PATCH    |
| `frontend/src/services/api/projects.api.ts` | PUT → PATCH    |
| `frontend/src/services/api/requests.api.ts` | PUT → PATCH    |

### File Backend yang Berubah

| File                                                  | Decorator Changed     |
| ----------------------------------------------------- | --------------------- |
| `backend/src/modules/loans/loans.controller.ts`       | `@Put()` → `@Patch()` |
| `backend/src/modules/loans/returns.controller.ts`     | `@Put()` → `@Patch()` |
| `backend/src/modules/projects/projects.controller.ts` | `@Put()` → `@Patch()` |
| `backend/src/modules/requests/requests.controller.ts` | `@Put()` → `@Patch()` |

## Prevention

- Jika ada custom API calls di luar service files (misalnya di komponen langsung), pastikan method sudah `PATCH`
- Gunakan selalu API service layer (`services/api/*.api.ts`), jangan panggil `axios`/`fetch` langsung
- Tambahkan API contract test untuk memvalidasi HTTP method

## Related Files

- [backend/src/modules/loans/loans.controller.ts](../../../../backend/src/modules/loans/loans.controller.ts)
- [backend/src/modules/projects/projects.controller.ts](../../../../backend/src/modules/projects/projects.controller.ts)
- [backend/src/modules/requests/requests.controller.ts](../../../../backend/src/modules/requests/requests.controller.ts)
- [frontend/src/services/api/loans.api.ts](../../../../frontend/src/services/api/loans.api.ts)
- [frontend/src/services/api/projects.api.ts](../../../../frontend/src/services/api/projects.api.ts)
- [frontend/src/services/api/requests.api.ts](../../../../frontend/src/services/api/requests.api.ts)
