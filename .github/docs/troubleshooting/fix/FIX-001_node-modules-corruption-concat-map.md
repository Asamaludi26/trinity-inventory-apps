# FIX-001: node_modules Corruption — Missing `concat-map` Module

**Date**: 2026-04-02  
**Severity**: CRITICAL (blocks backend startup)  
**Agent**: DevOps Agent  
**Status**: ✅ RESOLVED

---

## Symptom

```
Error: Cannot find module 'concat-map'
Require stack:
- node_modules\minimatch\node_modules\brace-expansion\index.js
- node_modules\minimatch\dist\commonjs\index.js
- node_modules\@nestjs\cli\node_modules\glob\...
```

`pnpm dev:backend` gagal total. NestJS CLI tidak bisa start karena `brace-expansion@1.1.12` (nested inside `minimatch/node_modules/`) membutuhkan `concat-map@0.0.1` yang tidak terinstall.

## Root Cause

1. **pnpm overrides** di `package.json` memaksa `brace-expansion@<1.1.13` → `>=1.1.13`
2. Override ini seharusnya meng-upgrade brace-expansion ke v5.0.5 (yang tidak perlu `concat-map`)
3. Namun ada **stale nested `brace-expansion@1.1.12`** di `minimatch/node_modules/` yang tidak ter-upgrade
4. `concat-map` tidak ada di lockfile maupun node_modules karena versi besar (5.x) tidak membutuhkannya
5. Hasilnya: v1.1.12 tetap ter-require oleh minimatch tapi `concat-map` dependency-nya tidak ada

## Resolution

```bash
# Step 1: Hapus node_modules yang corrupt
Remove-Item -Path "node_modules" -Recurse -Force

# Step 2: Clean install dari lockfile
pnpm install

# Step 3: Verifikasi stale nested package sudah hilang
# node_modules\minimatch\node_modules\brace-expansion\ seharusnya tidak ada lagi
```

**Catatan**: `pnpm install` biasa (tanpa hapus node_modules) TIDAK cukup — pnpm mendeteksi lockfile sudah up-to-date dan skip resolution, sehingga stale files tetap ada.

## Prevention

- Selalu gunakan `pnpm install --force` atau hapus `node_modules` jika menambah/mengubah `pnpm.overrides`
- Pertimbangkan menambahkan script: `"reinstall": "rm -rf node_modules && pnpm install"`
- Jangan update overrides tanpa testing `pnpm install` dari clean state

## Related Files

- [package.json](../../../../package.json) — `pnpm.overrides` section
- [.npmrc](../../../../.npmrc) — `node-linker=hoisted`
