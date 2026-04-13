# FIX-005: Permission Stale After Admin Update — Sync Delay

**Date**: 2026-04-03 (Commits `9923c9a`, `92897b2`, `8013af2`)  
**Severity**: MEDIUM (UX delay, not security issue)  
**Agent**: Frontend Agent + Backend Agent  
**Status**: ✅ RESOLVED (multi-layer mitigation)

---

## Symptom

Setelah admin mengubah permission user, user tersebut masih bisa/tidak bisa mengakses fitur yang seharusnya sudah berubah. Delay bisa sampai 60 detik sebelum perubahan terasa.

## Root Cause

Ada 3 layer caching yang menyebabkan delay:

1. **Backend JWT Cache** (TTL 30s) — `backend/src/modules/auth/user-cache.ts`
   - `JwtStrategy` meng-cache user data dari DB selama 30 detik
   - Perubahan permission di DB tidak langsung terbaca

2. **Frontend Token Heartbeat** (interval 30s) — `frontend/src/hooks/useTokenHeartbeat.ts`
   - Heartbeat memverifikasi token dan sync user data setiap 30 detik
   - Worst case: 30 detik delay sebelum heartbeat berikutnya

3. **Frontend Zustand Store** — `frontend/src/stores/useAuthStore.ts`
   - User data di-cache di client-side store
   - Tidak auto-refresh kecuali ada trigger

## Resolution (Multi-Layer)

### Layer 1: SSE Real-Time Event (Instant)

```
Admin changes permission → Backend emits SSE "permission:updated"
→ Frontend useRealtimeSync catches event
→ Checks if targetUserId matches currentUser.id
→ Triggers authApi.verifyToken() immediately
→ Updates auth store with fresh permissions
```

**File**: `frontend/src/hooks/useRealtimeSync.ts`

```typescript
// Fix: cek payload.data?.targetUserId selain payload.entityId
const targetUserId = payload.data?.targetUserId ?? payload.entityId;
if (
  currentUser &&
  (String(currentUser.id) === String(payload.entityId) ||
    String(currentUser.id) === String(targetUserId))
) {
  const result = await authApi.verifyToken();
  // Update with sanitized permissions
}
```

### Layer 2: Token Heartbeat (30s Fallback)

```
Every 30s → verifyToken() → sanitizePermissions() → updateCurrentUser()
```

**File**: `frontend/src/hooks/useTokenHeartbeat.ts`

```typescript
if (result.user) {
  const sanitizedUser = {
    ...result.user,
    permissions: sanitizePermissions(result.user.permissions || [], result.user.role),
  };
  updateCurrentUser(sanitizedUser);
}
```

### Layer 3: Fresh Fetch on Page Visit

```
Open UserDetailPage → useEffect fetches fresh user from API → Updates store
```

**File**: `frontend/src/pages/users/UserDetailPage.tsx` & `frontend/src/routes/RouterApp.tsx`

### Timeline Resolusi

| Skenario                    | Delay               |
| --------------------------- | ------------------- |
| SSE connected (normal)      | **< 1 detik**       |
| SSE disconnected, heartbeat | **≤ 30 detik**      |
| SSE + heartbeat gagal       | **Next page visit** |

## Prevention

- Pastikan SSE connection stable (monitor reconnect di browser DevTools → Network → EventSource)
- Backend harus emit `permission:updated` event setiap kali permission diubah
- Jangan bypass `sanitizePermissions()` saat update user data

## Related Files

- [backend/src/modules/auth/user-cache.ts](../../../../backend/src/modules/auth/user-cache.ts) — JWT LRU cache
- [frontend/src/hooks/useRealtimeSync.ts](../../../../frontend/src/hooks/useRealtimeSync.ts) — SSE listener
- [frontend/src/hooks/useTokenHeartbeat.ts](../../../../frontend/src/hooks/useTokenHeartbeat.ts) — Heartbeat sync
- [frontend/src/pages/users/UserDetailPage.tsx](../../../../frontend/src/pages/users/UserDetailPage.tsx) — Fresh fetch
- [backend/src/common/constants/permissions.constants.ts](../../../../backend/src/common/constants/permissions.constants.ts) — Permission SSoT
