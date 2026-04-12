# Changelog Entry Template

Gunakan format ini saat menambahkan entry ke `changelog/ReadMe.md`:

```markdown
### [YYYY-MM-DD] — Deskripsi Singkat Session/Perubahan

#### Added

- Fitur atau file baru yang ditambahkan

#### Changed

- Perubahan pada behavior, config, atau fitur yang sudah ada

#### Fixed

- Bug fixes: [ISSUE-NNN] Deskripsi bug yang diperbaiki

#### Security

- Perbaikan keamanan

#### Deprecated

- Fitur yang akan dihapus

#### Removed

- Fitur yang dihapus

#### Files Modified

- `path/to/file1.ts` — Deskripsi singkat
- `path/to/file2.ts` — Deskripsi singkat

#### Agents Involved

- `agent-name-1`, `agent-name-2`
```

## Aturan Penulisan

1. **Tanggal**: Gunakan format ISO `YYYY-MM-DD`
2. **Entry terbaru di atas** — Reverse chronological order
3. **Setiap sesi kerja** WAJIB ada minimal 1 changelog entry
4. **Ref issue/fix** — Link ke troubleshooting jika relevan
5. **Files Modified** — List semua file yang berubah
6. **Agents Involved** — Catat agent mana yang terlibat
