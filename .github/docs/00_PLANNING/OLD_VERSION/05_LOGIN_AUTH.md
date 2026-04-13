# 05 — Login & Authentication Flow

> Dokumentasi lengkap alur login, autentikasi JWT, force change password,
> token management, dan security measures pada versi lama.

---

## 1. Overview Autentikasi

Sistem menggunakan **JWT (JSON Web Token)** dengan strategi Local + JWT.
Security measures meliputi timing-safe comparison, no user enumeration,
token versioning, dan forced password change.

---

## 2. Data Model Auth

```
User (auth-relevant fields)
├── email: unique, case-insensitive
├── password: bcrypt hashed
├── role: UserRole
├── permissions: String[]
├── mustChangePassword: Boolean
├── tokenVersion: Int (increment = invalidate)
├── lastLoginAt?: DateTime
├── refreshToken?: String
├── isActive: Boolean
└── division → Division

JWT Payload
├── sub: userId
├── email
├── role
├── name
└── tokenVersion
```

---

## 3. Alur Login

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ALUR LOGIN                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐                                                         │
│  │ Login Page │ (/login)                                                │
│  │            │                                                         │
│  │ ┌────────────────────┐                                               │
│  │ │ Email input        │                                               │
│  │ │ Password input     │                                               │
│  │ │ [Login] button     │                                               │
│  │ │ DemoAccounts panel │ (dev only)                                    │
│  │ └────────┬───────────┘                                               │
│  └──────────┼──────────┘                                                │
│             │                                                            │
│             ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ POST /api/v1/auth/login (Throttled: default rate limit)        │    │
│  │                                                                  │    │
│  │  1. Normalize email (lowercase, trim)                           │    │
│  │  2. Find user by email                                          │    │
│  │  3. Timing-safe password comparison:                            │    │
│  │     ├── User found: bcrypt.compare(input, user.password)        │    │
│  │     └── User NOT found: bcrypt.compare(input, DUMMY_HASH)       │    │
│  │         → Prevents timing attack (consistent response time)     │    │
│  │  4. Check user.isActive                                         │    │
│  │  5. If fail: generic error "Invalid credentials"                │    │
│  │     └── No user enumeration (same error for wrong email/pwd)    │    │
│  │  6. Generate JWT token with payload                             │    │
│  │  7. Log login: IP + user-agent (activity log)                   │    │
│  └──────────────────────────────────┬──────────────────────────────┘    │
│                                     │                                    │
│                                     ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Response: { user, token }                                       │    │
│  │                                                                  │    │
│  │ user: {                                                          │    │
│  │   id, email, name, role,                                        │    │
│  │   division: { id, name },                                       │    │
│  │   permissions: [...],                                            │    │
│  │   mustChangePassword: boolean                                   │    │
│  │ }                                                                │    │
│  │ token: "eyJhbG..." (JWT)                                       │    │
│  └──────────────────────────────────┬──────────────────────────────┘    │
│                                     │                                    │
│                                     ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Frontend: useAuthStore                                          │    │
│  │                                                                  │    │
│  │  1. Store user + token in Zustand                               │    │
│  │  2. Persist to localStorage (partialize: only safe fields)      │    │
│  │  3. Set Authorization header for all API calls                  │    │
│  │  4. Check mustChangePassword                                    │    │
│  │     ├── true → Show ForceChangePasswordModal                    │    │
│  │     └── false → Navigate to Dashboard (/)                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Force Change Password Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              FORCE CHANGE PASSWORD FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger: mustChangePassword = true                             │
│  Conditions:                                                    │
│  ├── User baru dibuat dengan default password                   │
│  ├── Admin reset password user                                  │
│  └── Security policy requires change                            │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ForceChangePasswordModal (undismissable)     │               │
│  │                                               │               │
│  │  ┌──────────────────────────────────┐        │               │
│  │  │ "Anda harus mengganti password"  │        │               │
│  │  │                                   │        │               │
│  │  │ New Password:     [________]     │        │               │
│  │  │ [PasswordStrengthMeter]          │        │               │
│  │  │ Confirm Password: [________]     │        │               │
│  │  │                                   │        │               │
│  │  │ [Ganti Password]                 │        │               │
│  │  └──────────────────────────────────┘        │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  Flow:                                                          │
│  1. Modal muncul — TIDAK bisa ditutup                           │
│  2. User masukkan password baru                                 │
│  3. PATCH /users/:id/change-password                            │
│  4. Server: hash password, set mustChangePassword = false       │
│  5. Increment tokenVersion (invalidate current token)           │
│  6. Show ReloginSuccessModal                                    │
│  7. User harus login ulang dengan password baru                 │
│  8. Redirect ke /login                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Token Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN MANAGEMENT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Token Heartbeat (Frontend):                                    │
│  ├── Every 30 seconds: verify token is still valid              │
│  ├── POST /api/v1/auth/verify → { valid: true/false }          │
│  ├── If invalid:                                                │
│  │   ├── Clear auth store                                       │
│  │   ├── Show session expired notification                      │
│  │   └── Redirect to /login                                     │
│  └── Prevents stale sessions                                    │
│                                                                  │
│  Token Versioning:                                              │
│  ├── User.tokenVersion starts at 0                              │
│  ├── JWT payload includes tokenVersion                          │
│  ├── On verify: check payload.tokenVersion === user.tokenVersion│
│  ├── Mismatch → token rejected (session invalidated)           │
│  └── Increment triggers:                                        │
│      ├── Admin reset password                                   │
│      └── Permission changes                                     │
│                                                                  │
│  Token Verification (Backend):                                  │
│  1. Decode JWT                                                  │
│  2. Find user by sub (userId)                                   │
│  3. Check user.isActive                                         │
│  4. Check tokenVersion match                                    │
│  5. Return user if all pass                                     │
│                                                                  │
│  JWT Strategy (Passport):                                       │
│  ├── Extract from: Authorization: Bearer <token>                │
│  ├── Validate signature                                         │
│  └── Attach user to request (req.user)                          │
│                                                                  │
│  User Cache:                                                    │
│  ├── In-memory cache (user-cache.ts)                            │
│  ├── Invalidated on permission/role changes                     │
│  └── Prevents DB hit on every authenticated request             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Password Reset Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                PASSWORD RESET REQUEST                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User meminta reset (lupa password)                          │
│     POST /api/v1/auth/request-password-reset                    │
│     Body: { email }                                             │
│     Rate limit: 3 per 60 seconds                                │
│                                                                  │
│  2. Backend:                                                    │
│     ├── Find user by email                                      │
│     ├── If found: create notification for Super Admins          │
│     │   └── "User X meminta reset password"                     │
│     ├── Mark user: passwordResetRequested = true                │
│     └── Always return success (no enumeration)                  │
│                                                                  │
│  3. Super Admin receives notification                           │
│     ├── Via bell notification + WhatsApp                        │
│     └── Review & execute reset if valid                         │
│                                                                  │
│  4. Admin executes reset                                        │
│     PATCH /api/v1/users/:id/reset-password                     │
│     ├── Set new password (hashed)                               │
│     ├── Increment tokenVersion                                  │
│     ├── Set mustChangePassword = true                           │
│     └── Notify user (password has been reset)                   │
│                                                                  │
│  Note: Tidak ada self-service reset via email link              │
│  → Reset harus melalui admin (security by design)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Measures

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY MEASURES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Timing-Safe Comparison                                      │
│     └── bcrypt.compare() even when user not found               │
│         → Consistent response time (prevents timing attacks)    │
│                                                                  │
│  2. No User Enumeration                                         │
│     └── Same error message for:                                 │
│         ├── Wrong email                                         │
│         ├── Wrong password                                      │
│         └── Inactive account                                    │
│                                                                  │
│  3. Rate Limiting (Throttle)                                    │
│     ├── Login: default rate limit                               │
│     ├── Register: 3 per 60 seconds                              │
│     └── Password reset: 3 per 60 seconds                       │
│                                                                  │
│  4. Password Hashing                                            │
│     ├── bcrypt with configurable salt rounds                    │
│     └── Never stored in plain text                              │
│                                                                  │
│  5. Token Versioning                                            │
│     └── Force logout all sessions on password reset             │
│                                                                  │
│  6. RBAC (Role-Based Access Control)                            │
│     ├── JwtAuthGuard on all protected routes                    │
│     ├── RolesGuard for role-based access                        │
│     └── @AuthPermissions decorator for fine-grained control     │
│                                                                  │
│  7. Activity Logging                                            │
│     └── Login attempts logged with IP + user-agent              │
│                                                                  │
│  8. Forced Password Change                                      │
│     └── mustChangePassword blocks all other actions             │
│                                                                  │
│  9. Session Persistence                                         │
│     ├── Auth store persisted in localStorage (minimal data)     │
│     └── Token heartbeat validates every 30s                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Komponen Frontend Auth

| Komponen                   | File                                                    | Fungsi                        |
| -------------------------- | ------------------------------------------------------- | ----------------------------- |
| `LoginPage`                | `pages/LoginPage.tsx`                                   | Halaman login utama           |
| `DemoAccounts`             | `features/auth/components/DemoAccounts.tsx`             | Panel demo account (dev mode) |
| `ForceChangePasswordModal` | `features/auth/components/ForceChangePasswordModal.tsx` | Modal paksa ganti password    |
| `PasswordStrengthMeter`    | `features/users/components/PasswordStrengthMeter.tsx`   | Indikator kekuatan password   |
| `PasswordAlert`            | `features/users/components/PasswordAlert.tsx`           | Alert terkait password        |
| `ReloginSuccessModal`      | `features/users/components/ReloginSuccessModal.tsx`     | Modal sukses, perlu re-login  |

---

## 9. API Endpoints

| Method | Endpoint                              | Rate Limit | Deskripsi                       |
| ------ | ------------------------------------- | ---------- | ------------------------------- |
| `POST` | `/api/v1/auth/login`                  | Default    | Login, return user + token      |
| `POST` | `/api/v1/auth/register`               | 3/60s      | Register user baru              |
| `GET`  | `/api/v1/auth/me`                     | -          | Get current user (JWT required) |
| `POST` | `/api/v1/auth/verify`                 | -          | Verify token validity           |
| `POST` | `/api/v1/auth/request-password-reset` | 3/60s      | Request reset ke admin          |

---

## 10. Catatan untuk Rebuild

1. **Timing-safe comparison** — WAJIB dipertahankan di rebuild
2. **No user enumeration** — generic error messages untuk auth failures
3. **Token heartbeat 30s** — pertimbangkan interval optimal (battery/performance)
4. **Password reset via admin** — bukan self-service via email (design choice)
5. **mustChangePassword** — block ALL routes sampai password diganti
6. **tokenVersion increment** — mechanism untuk force logout all sessions
7. **DemoAccounts** — hanya untuk development, jangan masuk production
8. **User cache** — pertimbangkan Redis untuk production scale
9. **Rate limiting** — per-IP basis, pertimbangkan per-user juga
10. **Session persistence** — hanya safe fields ke localStorage, bukan token langsung
