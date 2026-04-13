# FIX-003: CSS Variables Simplification — Missing Design Tokens

**Date**: 2026-04-02 (Commit `b40f60c`)  
**Severity**: MEDIUM (visual regression pada komponen custom)  
**Agent**: Frontend Agent  
**Status**: ✅ RESOLVED

---

## Symptom

Beberapa komponen kehilangan styling (shadow, border-radius, background) setelah update CSS variables di commit `b40f60c`.

Contoh error di console:

```
// Tidak ada error eksplisit, tetapi visual regression:
// - Card tanpa shadow
// - Border-radius hilang
// - Background raised surface menjadi transparent
```

## Root Cause

Commit `b40f60c` menyederhanakan design system CSS dari v2.0 ke v1.1 dengan menghapus variabel yang dianggap redundan:

| Variabel Dihapus            | Pengguna Potensial                 |
| --------------------------- | ---------------------------------- |
| `--bg-surface-raised`       | Card components, modal backgrounds |
| `--bg-subtle`               | Section backgrounds, table headers |
| `--shadow-xs/md/lg/xl`      | Various elevation levels           |
| `--shadow-float`            | Dropdown menus, popovers           |
| `--border-focus`            | Form input focus states            |
| `--radius-sm/md/lg/xl/2xl`  | Button, card, modal corners        |
| `--z-overlay`               | Overlay backdrops                  |
| `--header-height`           | Layout calculations                |
| `--sidebar-width`           | Sidebar positioning                |
| `--sidebar-collapsed-width` | Collapsed sidebar                  |
| `--gray-25`                 | Subtle backgrounds                 |
| `--color-primary-200`       | Hover states, light accents        |

## Resolution

Ganti penggunaan variabel yang dihapus dengan Tailwind utility classes:

```tsx
// ❌ Sebelum (CSS variable langsung)
<div style={{ background: 'var(--bg-surface-raised)' }}>
<div style={{ boxShadow: 'var(--shadow-lg)' }}>
<div style={{ borderRadius: 'var(--radius-lg)' }}>

// ✅ Sesudah (Tailwind classes)
<div className="bg-white dark:bg-gray-800">
<div className="shadow-lg">
<div className="rounded-lg">
```

| Variabel Lama               | Pengganti Tailwind                     |
| --------------------------- | -------------------------------------- |
| `--bg-surface-raised`       | `bg-white dark:bg-gray-800`            |
| `--bg-subtle`               | `bg-gray-50 dark:bg-gray-800/50`       |
| `--shadow-xs`               | `shadow-sm`                            |
| `--shadow-md`               | `shadow-md`                            |
| `--shadow-lg`               | `shadow-lg`                            |
| `--shadow-xl`               | `shadow-xl`                            |
| `--shadow-float`            | `shadow-lg` atau `shadow-xl`           |
| `--border-focus`            | `ring-2 ring-blue-500`                 |
| `--radius-sm`               | `rounded-md` (0.375rem)                |
| `--radius-md`               | `rounded-lg` (0.5rem)                  |
| `--radius-lg`               | `rounded-xl` (0.75rem)                 |
| `--z-overlay`               | `z-[1040]` atau `z-modal` (≡ z-[1050]) |
| `--header-height`           | `h-14` (3.5rem)                        |
| `--sidebar-width`           | `w-[264px]`                            |
| `--sidebar-collapsed-width` | `w-[72px]`                             |

## Prevention

- Sebelum menghapus CSS variable, grep seluruh codebase: `grep -r "var(--nama-variabel)" frontend/src/`
- Gunakan Tailwind utility classes sebagai default, CSS variables hanya untuk semantic tokens yang benar-benar cross-cutting
- Maintain daftar variabel aktif di `FRONTEND_OVERHAUL.md`

## Related Files

- [frontend/src/index.css](../../../../frontend/src/index.css) — Design system variables
- [frontend/tailwind.config.js](../../../../frontend/tailwind.config.js) — Tailwind tokens
- [frontend/FRONTEND_OVERHAUL.md](../../../../frontend/FRONTEND_OVERHAUL.md) — Frontend changelog
