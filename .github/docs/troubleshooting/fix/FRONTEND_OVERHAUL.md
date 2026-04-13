# Frontend Overhaul Documentation

## Overview

This document covers the comprehensive frontend overhaul performed on Trinity Inventory Apps. Changes span design system, performance, accessibility, testing, and state management.

---

## 1. Design System v2.0

### CSS Custom Properties (`index.css`)

The global design tokens were rewritten to support a modern SaaS enterprise look:

| Token Category | Variables                                                                                   | Purpose                                                     |
| -------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Shadows**    | `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-float` | Layered elevation system (xs for cards, float for overlays) |
| **Surfaces**   | `--bg-surface`, `--bg-surface-hover`, `--bg-surface-raised`, `--bg-subtle`                  | Raised surface for cards, subtle for section backgrounds    |
| **Borders**    | `--border-default`, `--border-strong`, `--border-focus`, `--border-line-subtle`             | Focus ring and subtle separator support                     |
| **Radius**     | `--radius-sm` through `--radius-full`                                                       | Consistent 6/8/12/16/20px scale                             |
| **Layout**     | `--header-height`, `--sidebar-width`, `--content-max-width`                                 | Centralized layout dimensions                               |
| **Z-Index**    | `--z-dropdown`, `--z-sticky`, `--z-modal`, `--z-overlay`, `--z-toast`                       | Layering system                                             |

### Dark Mode

All tokens have dark mode variants under `.dark` class. Theme toggle persists to `localStorage` via `useUIStore`.

### Tailwind Configuration (`tailwind.config.js`)

- **Colors**: Updated `secondary` to gray scale, `success` to emerald, `info` to sky
- **Shadows**: Now reference CSS custom properties (`var(--shadow-xs)`, etc.)
- **Border Radius**: Expanded scale with `xl: 0.75rem`, `2xl: 1rem`, `3xl: 1.25rem`
- **Animations**: Refined fade-in and slide-in timing curves

### Design System Utilities (`designSystem.ts`)

- **Text styles**: Added responsive sizes with `sm:` breakpoint prefix and `tracking-tight` on headings
- **Card styles**: Added `flush` variant for zero-padding cards
- **Badge styles**: Uses `ring-1` instead of `border` for cleaner appearance
- **Status colors**: Updated to use emerald and sky palettes

---

## 2. Component Redesigns

### Button (`Button.tsx`)

- Uses `cn()` for variant composition instead of string concatenation
- `focus-visible` instead of `focus` for keyboard-only focus indicators
- Micro-interaction: `hover:-translate-y-px` for subtle lift effect
- Proper loading spinner with SVG circle+path animation
- `disabled:pointer-events-none` and `select-none` for robustness

### Modal (`Modal.tsx`)

- Focus management: saves and restores previous focus element
- `tabIndex={-1}` on modal panel for proper focus trapping
- Backdrop: `blur-[3px]` with `bg-black/40` (was generic overlay)
- Faster animations: `200ms` (was `300ms`), `scale-[0.98]` (was `scale-95`)
- Footer: `bg-gray-50/80` with rounded corners

### MainLayout Header

- Glassmorphism: `bg-surface/80 backdrop-blur-lg` with `border-line-subtle`
- Faster transitions: `duration-200` (was `duration-300`)

---

## 3. Performance Optimizations

### Vite Build (`vite.config.ts`)

Manual chunk splitting for optimal caching:

| Chunk           | Contents                                 | Size (gzip)   |
| --------------- | ---------------------------------------- | ------------- |
| `vendor-react`  | React, React DOM, Scheduler              | ~46KB         |
| `vendor-router` | React Router                             | ~13KB         |
| `vendor-data`   | TanStack Query, Zustand                  | ~13KB         |
| `vendor-forms`  | React Hook Form, Zod                     | Lazy          |
| `vendor-charts` | Recharts, D3                             | ~117KB (lazy) |
| `vendor-ui`     | Framer Motion, Headless UI, React Select | Mixed         |
| `vendor-export` | jsPDF, html2canvas, xlsx                 | ~316KB (lazy) |
| `vendor-icons`  | React Icons                              | ~23KB         |

- Target: `es2020` for better tree-shaking
- `cssCodeSplit: true` for per-page CSS chunks
- Warning limit: `500KB` per chunk

### React Query (`QueryProvider.tsx`)

- `staleTime`: `60s` (was `30s`) — reduces redundant refetches
- `gcTime`: `10min` (was `5min`) — keeps cache longer for back-navigation
- `refetchOnWindowFocus`: `"always"` — ensures data freshness on tab return
- `refetchOnReconnect`: `"always"` — handles offline→online transitions
- `refetchOnMount`: `true` — consistent behavior

### HTML Meta Tags (`index.html`)

- Font preloading for Inter (weights 400, 500, 600, 700)
- DNS prefetch for API domain
- `viewport-fit=cover` for modern mobile devices
- `color-scheme` meta tag for native dark mode hinting

---

## 4. Accessibility Improvements

### Global

- Touch targets: `min-height: 44px` for `@media (pointer: coarse)`
- `-webkit-tap-highlight-color: transparent` on all elements
- `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` (Inter font features)
- `text-rendering: optimizeLegibility` and `-webkit-font-smoothing: antialiased`
- `prefers-reduced-motion` media query: disables all animations

### Components

- **Modal**: `role="dialog"`, `aria-modal="true"`, focus restoration, keyboard escape
- **Button**: `aria-busy="true"` during loading, `aria-disabled` on disabled state
- **Forms**: `focus-visible` ring for keyboard navigation (3px ring offset)
- **Screen reader utility**: `.sr-only` class for hidden-but-accessible content

---

## 5. Zustand & React Query Optimization

### Fixed: Double Login API Call

**Before**: `useLogin()` → `authApi.login()` → `authStoreLogin()` → `authApi.login()` (2 API calls)
**After**: `useLogin()` → `authApi.login()` → `useAuthStore.setState()` (1 API call)

### Fixed: Sledgehammer Cache Invalidation

**Before**: Every transaction mutation called `queryClient.invalidateQueries()` with no arguments, invalidating the ENTIRE query cache.

**After**: Scoped invalidation per mutation type:

- Handover create/delete → invalidates `handoverKeys.all` + `["assets"]`
- Installation create/delete → invalidates `installationKeys.all` + `["assets"]` + `["customers"]`
- Maintenance CRUD → invalidates `maintenanceKeys.all` + `["assets"]`
- Dismantle CRUD → invalidates `dismantleKeys.all` + `["assets"]` + `["customers"]`

### Store Architecture (Current State)

| Store                  | Type              | Status                           |
| ---------------------- | ----------------- | -------------------------------- |
| `useAuthStore`         | Client state      | ✅ Correct use                   |
| `useUIStore`           | Client state      | ✅ Correct use                   |
| `useSessionStore`      | Client state      | ✅ Correct use                   |
| `useAssetStore`        | Server state      | ⚠️ Should migrate to React Query |
| `useRequestStore`      | Server state      | ⚠️ Should migrate to React Query |
| `useTransactionStore`  | Server state      | ⚠️ Should migrate to React Query |
| `useMasterDataStore`   | Server state      | ⚠️ Should migrate to React Query |
| `useNotificationStore` | Hybrid            | ⚠️ Server part should migrate    |
| `useRepairStore`       | localStorage only | ⚠️ Needs backend API             |

### Recommended Migration Path

1. Stop hydrating server-state stores from `RouterApp.tsx` unified fetch
2. Replace `useAssetStore.fetchAssets()` calls with `useAssets()` query hook
3. Remove manual array updates in stores; use `queryClient.invalidateQueries()` after mutations
4. Keep `useAuthStore`, `useUIStore`, `useSessionStore` as-is (legitimate client state)
5. Add backend API for repairs (currently `localStorage`-only)

---

## 6. Cypress E2E Test Suite

### Test Files (18 spec files)

| File                    | Tests | Coverage                                                                            |
| ----------------------- | ----- | ----------------------------------------------------------------------------------- |
| `auth.cy.ts`            | 6     | Login, validation, redirect, logout                                                 |
| `dashboard.cy.ts`       | 18    | Stats, navigation, responsive, roles, API data                                      |
| `assets.cy.ts`          | 17    | Table, search, create modal, validation, details, API, RBAC                         |
| `design-system.cy.ts`   | 16    | Theme toggle, CSS vars, responsive, a11y, performance                               |
| `workflows.cy.ts`       | 22    | Purchase→approval, loan lifecycle, project lifecycle, customer flows, user journeys |
| `customers.cy.ts`       | 18    | List, search, CRUD, detail, API                                                     |
| `handover.cy.ts`        | 16    | List, filters, create, API                                                          |
| `repair.cy.ts`          | 12    | List, filters, create, API                                                          |
| `requests.cy.ts`        | 7     | Page, filters, API                                                                  |
| `stock.cy.ts`           | 16    | Overview, filters, API, alerts                                                      |
| `users.cy.ts`           | 14    | Table, CRUD, roles, divisions                                                       |
| `projects.cy.ts`        | 18    | List, CRUD, workflow states, API                                                    |
| `categories.cy.ts`      | 17    | Tabs, CRUD, hierarchy                                                               |
| `purchase-master.cy.ts` | 10    | List, CRUD, purchase flow                                                           |
| `loans.cy.ts`           | 15    | Request, approval, return                                                           |
| `notifications.cy.ts`   | 10    | API, mark read, filters                                                             |
| `api-integration.cy.ts` | 27    | All API endpoints, error handling                                                   |
| `asset-transfers.cy.ts` | 10    | List, create modal, validation                                                      |

### Key Improvements

- **Removed `expect(true).to.be.true`** anti-pattern from dashboard, assets, and workflow tests
- **Real assertions**: URL verification, DOM element existence, API response validation
- **API data assertions**: Verify `response.body.data` property existence, status codes `eq(200)` instead of `oneOf([200, 401])`
- **New design-system test**: Theme system, responsive viewports, CSS variables, accessibility checks, performance indicators

### Running Tests

```bash
# From project root
cd e2e

# Interactive mode
npx cypress open

# Headless CI mode
npx cypress run

# Run specific spec
npx cypress run --spec "cypress/e2e/dashboard.cy.ts"
```

---

## 7. Files Modified

### Frontend Core

- `frontend/index.html` — Meta tags, font preloading
- `frontend/src/index.css` — Complete v2.0 rewrite (19 sections)
- `frontend/tailwind.config.js` — Color scales, shadows, radius, animations
- `frontend/src/utils/designSystem.ts` — Typography, card, badge, status utilities
- `frontend/vite.config.ts` — Manual chunks (9 vendor bundles)

### Components

- `frontend/src/components/ui/Button.tsx` — Complete rewrite
- `frontend/src/components/ui/Modal.tsx` — Complete rewrite with focus management
- `frontend/src/layouts/MainLayout.tsx` — Header glassmorphism

### State Management

- `frontend/src/providers/QueryProvider.tsx` — Optimized defaults
- `frontend/src/hooks/queries/useAuthQueries.ts` — Fixed double login bug
- `frontend/src/hooks/queries/useTransactionQueries.ts` — Scoped cache invalidation

### Tests

- `e2e/cypress/e2e/design-system.cy.ts` — **NEW** (16 tests)
- `e2e/cypress/e2e/dashboard.cy.ts` — Rewritten with real assertions
- `e2e/cypress/e2e/assets.cy.ts` — Rewritten with real assertions
- `e2e/cypress/e2e/workflows.cy.ts` — Rewritten with proper API assertions

---

## 8. Build Output

Production build succeeds with optimized chunks:

```
vendor-react       142KB (46KB gzip)
vendor-router       36KB (13KB gzip)
vendor-data         43KB (13KB gzip)
vendor-icons        99KB (23KB gzip)
vendor-charts      398KB (117KB gzip) — lazy loaded
vendor-export    1,014KB (316KB gzip) — lazy loaded
```

Total initial JS: ~320KB gzipped (excluding lazy-loaded chunks)
