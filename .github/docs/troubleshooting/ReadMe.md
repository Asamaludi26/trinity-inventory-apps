# 🔧 Troubleshooting Knowledge Base

> Kumpulan masalah yang pernah ditemui dan solusinya.
> Dikelola oleh **Documentation Agent** secara WAJIB setiap kali ada fix/troubleshoot.

---

## Cara Menggunakan

1. Cari masalah di **Index** di bawah
2. Jika belum ada, cek folder `issue/` dan `fix/`
3. Jika masalah baru, buat entry baru menggunakan template

---

## Index Issue & Fix

| ID    | Issue                                              | Status | Fix                       | Date       |
| ----- | -------------------------------------------------- | ------ | ------------------------- | ---------- |
| ISS-2 | Change password policy mismatch (frontend vs API)  | Fixed  | [FIX-002](fix/FIX-002.md) | 2026-04-13 |
| ISS-1 | Detail pages return 400 (undefined UUID in params) | Fixed  | [FIX-001](fix/FIX-001.md) | 2026-04-12 |

<!-- Entry baru ditambahkan di atas baris ini -->

---

## Folder Structure

```
troubleshooting/
├── ReadMe.md          ← 📍 You are here (index)
├── issue/             ← Deskripsi masalah yang ditemui
│   └── ISSUE-NNN.md   ← Per-issue detail
└── fix/               ← Solusi yang sudah terbukti berhasil
    └── FIX-NNN.md     ← Per-fix detail
```

---

## Template Referensi

- Issue template: `troubleshooting/issue/_TEMPLATE.md`
- Fix template: `troubleshooting/fix/_TEMPLATE.md`
