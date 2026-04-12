# User Manual & Standard Operating Procedure (SOP) — TrinityApps v1.0

| Metadata           | Detail                                                               |
| ------------------ | -------------------------------------------------------------------- |
| **Versi**          | 1.0 Final                                                            |
| **Tanggal**        | 10 April 2026                                                        |
| **Status**         | Ready for Training & Onboarding                                      |
| **Target Pembaca** | End-User: Super Admin, Admin Logistik, Admin Purchase, Leader, Staff |
| **Referensi**      | PRD v3.1, SDD v3.1, UI/UX Design Document v1.0                       |
| **Go-Live**        | 1 Mei 2026                                                           |

> **Tujuan**: Dokumen ini adalah panduan langkah-demi-langkah untuk menggunakan TrinityApps. Disusun agar mudah dipahami oleh pengguna non-teknis dan menjadi materi utama Training & Onboarding sebelum Go-Live.

---

## Daftar Isi

1. [Pengantar Sistem](#1-pengantar-sistem)
2. [Login & Keamanan Akun](#2-login--keamanan-akun)
3. [Navigasi Utama](#3-navigasi-utama)
4. [Dashboard](#4-dashboard)
5. [Manajemen Aset](#5-manajemen-aset)
6. [Modul Transaksi](#6-modul-transaksi)
7. [Manajemen Pelanggan](#7-manajemen-pelanggan)
8. [Proyek Infrastruktur](#8-proyek-infrastruktur)
9. [Pengaturan & Kelola Akun](#9-pengaturan--kelola-akun)
10. [SOP: Prosedur Operasional Standar](#10-sop-prosedur-operasional-standar)
11. [FAQ & Troubleshooting](#11-faq--troubleshooting)

---

## 1. Pengantar Sistem

### 1.1 Apa itu TrinityApps?

TrinityApps adalah aplikasi berbasis web untuk mengelola **inventori aset** milik PT. Triniti Media. Aplikasi ini menggantikan pencatatan manual menggunakan kertas/spreadsheet dengan sistem digital yang:

- **Mencatat** seluruh aset perusahaan (perangkat jaringan, kabel, alat kerja, dll.)
- **Melacak** perpindahan aset: dari gudang ke pengguna, peminjaman, pengembalian, hingga penghapusan
- **Mengotomasi** alur persetujuan (approval) untuk setiap transaksi
- **Mengirim notifikasi** real-time kepada pihak terkait
- **Menghasilkan laporan** untuk pengambilan keputusan

### 1.2 Siapa yang Menggunakan?

| Role               | Deskripsi Singkat                                  | Jumlah Estimasi |
| ------------------ | -------------------------------------------------- | --------------- |
| **Super Admin**    | Akses penuh. Pemilik keputusan tertinggi           | 1–2 orang       |
| **Admin Logistik** | Mengelola aset fisik, stok, dan eksekusi transaksi | 2–3 orang       |
| **Admin Purchase** | Mengelola data pembelian dan validasi anggaran     | 1–2 orang       |
| **Leader**         | Memimpin divisi, menyetujui permintaan tim         | 3–5 orang       |
| **Staff**          | Membuat permintaan dan melihat aset pribadi        | 20–50 orang     |

### 1.3 Cara Mengakses

| Environment | URL                            | Catatan                    |
| ----------- | ------------------------------ | -------------------------- |
| Production  | `https://app.trinitimedia.com` | Setelah Go-Live 1 Mei 2026 |
| UAT/Staging | `https://uat.trinitimedia.com` | Fase testing April 2026    |

**Browser yang Didukung**: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (2 versi terakhir).

---

## 2. Login & Keamanan Akun

### 2.1 Login Pertama Kali

1. Buka URL aplikasi menggunakan browser.
2. Masukkan **Email** dan **Password** yang diberikan oleh Super Admin.
3. Klik tombol **Login**.
4. Jika ini login pertama, sistem akan meminta Anda untuk **mengganti password**.

> **⚠ Penting**: Password awal bersifat sementara. Anda **wajib** mengganti password saat pertama kali login.

### 2.2 Persyaratan Password

| Kriteria     | Ketentuan                       |
| ------------ | ------------------------------- |
| Panjang      | Minimal 8 karakter              |
| Kombinasi    | Huruf besar, huruf kecil, angka |
| Masa Berlaku | Tidak ada kadaluarsa otomatis   |

### 2.3 Lupa Password

1. Pada halaman Login, klik **"Lupa Password?"**.
2. Hubungi Super Admin untuk **reset password** melalui panel admin.
3. Super Admin akan mengatur password sementara.
4. Login kembali dan ganti password sementara tersebut.

### 2.4 Logout

1. Klik **ikon profil** (avatar) di pojok kanan atas.
2. Pilih **Logout** dari dropdown menu.
3. Anda akan diarahkan ke halaman Login.

> **⚠ Keamanan**: Selalu logout setelah selesai menggunakan aplikasi, terutama di perangkat bersama.

---

## 3. Navigasi Utama

### 3.1 Struktur Layar

Setelah login, Anda akan melihat tiga area utama:

| Area             | Posisi | Fungsi                                      |
| ---------------- | ------ | ------------------------------------------- |
| **Sidebar**      | Kiri   | Menu navigasi utama. Berisi semua modul.    |
| **Header**       | Atas   | Breadcrumb, pencarian, notifikasi, profil.  |
| **Konten Utama** | Tengah | Area kerja: tabel, form, dashboard, detail. |

### 3.2 Sidebar

- Menu yang tampil **sesuai dengan role dan permission** Anda.
- Klik nama menu untuk membukanya. Menu dengan tanda **▾** memiliki sub-menu.
- Pada layar kecil (tablet/HP), sidebar dapat ditutup dengan tombol hamburger (☰).

### 3.3 Notifikasi

- Klik ikon **🔔** di header untuk melihat notifikasi terbaru.
- Notifikasi muncul saat ada:
  - Request baru yang memerlukan approval Anda
  - Request Anda di-approve atau ditolak
  - Stok di bawah batas minimum (hanya Admin Logistik & Super Admin)
  - Aset yang harus dikembalikan mendekati jatuh tempo

### 3.4 Pencarian Global

- Klik kolom pencarian atau tekan **⌘+K** (Mac) / **Ctrl+K** (Windows).
- Ketik nama aset, nomor dokumen, atau nama halaman untuk navigasi cepat.

---

## 4. Dashboard

Setiap role memiliki dashboard yang berbeda, menampilkan informasi yang relevan.

### 4.1 Dashboard Super Admin

**Apa yang ditampilkan:**

- Total aset terdaftar
- Jumlah request yang pending
- Jumlah pinjaman aktif
- Aset dalam perbaikan
- Alert stok rendah
- Grafik tren aset (6 bulan terakhir)
- Grafik distribusi aset per kategori
- Tabel aktivitas terbaru

**Cara membaca:**

- Angka berwarna **merah** = memerlukan perhatian segera
- Klik angka pada kartu ringkasan untuk langsung ke halaman terkait

### 4.2 Dashboard Admin Logistik

**Fokus**: Operasional harian — stok, pinjaman belum kembali, aset rusak.

- **Stok Kritis (⚠)**: Daftar model aset yang stoknya di bawah threshold. Klik untuk mengambil tindakan.
- **Pinjaman Belum Kembali**: Daftar pinjaman yang sudah jatuh tempo.

### 4.3 Dashboard Admin Purchase

**Fokus**: Keuangan — total pembelian, depresiasi, budget.

- **Tren Depresiasi**: Grafik nilai penyusutan aset per bulan.
- **Pengeluaran per Kategori**: Stacked bar chart untuk melihat alokasi budget.

### 4.4 Dashboard Leader

**Fokus**: Divisi — aset divisi, anggota tim, transaksi tim.

- **Anggota Divisi**: Tabel anggota beserta jumlah aset yang dipegang.
- **Request Pending**: Request dari anggota tim yang menunggu approval Anda.

### 4.5 Dashboard Staff

**Fokus**: Personal — aset saya, pinjaman aktif, checklist pengembalian.

- **Aset yang Saya Pegang**: Daftar aset yang saat ini menjadi tanggung jawab Anda.
- **Checklist Pengembalian**: Aset pinjaman yang harus dikembalikan beserta tanggal jatuh tempo.

---

## 5. Manajemen Aset

### 5.1 Melihat Daftar Aset

**Siapa**: Super Admin, Admin Logistik, Admin Purchase (view only)

1. Klik **Pusat Aset > Catat Aset** di sidebar.
2. Gunakan **filter** (kategori, tipe, status, kondisi) untuk menyaring data.
3. Gunakan **kolom pencarian** untuk mencari berdasarkan nama, serial number, atau brand.

### 5.2 Menambah Aset Baru

**Siapa**: Super Admin, Admin Logistik

1. Di halaman Daftar Aset, klik tombol **[+ Tambah Aset]**.
2. Isi form:

   | Field            | Wajib? | Keterangan                                     |
   | ---------------- | ------ | ---------------------------------------------- |
   | Nama Aset        | ✅     | Nama deskriptif aset                           |
   | Kategori         | ✅     | Pilih dari dropdown (e.g., Perangkat Jaringan) |
   | Tipe             | ❌     | Otomatis filter berdasarkan kategori           |
   | Model            | ❌     | Otomatis filter berdasarkan tipe               |
   | Brand            | ✅     | Merk aset                                      |
   | Serial Number    | ❌     | Nomor seri unik (jika ada)                     |
   | MAC Address      | ❌     | Untuk perangkat jaringan                       |
   | Harga Beli       | ❌     | Harga pembelian (Rupiah)                       |
   | Tanggal Beli     | ❌     | Tanggal pembelian                              |
   | Garansi Berakhir | ❌     | Tanggal akhir garansi                          |
   | Lokasi           | ❌     | Lokasi fisik saat ini                          |
   | Lampiran         | ❌     | Foto/dokumen (JPG, PNG, PDF; max 5MB)          |

3. Klik **[Simpan]**.
4. Sistem akan menampilkan toast hijau: _"Aset berhasil ditambahkan"_.
5. Aset baru otomatis mendapat status **In Storage** dan QR code unik.

### 5.3 Melihat Detail & QR Code Aset

1. Pada daftar aset, klik **nama aset** atau ikon **👁**.
2. Halaman detail menampilkan:
   - Informasi dasar aset
   - QR Code (dapat dicetak)
   - Tab: **Umum**, **Pembelian**, **Depresiasi**, **Riwayat**, **Transaksi**
3. Klik QR code untuk memperbesar dan mencetak.

### 5.4 Mengedit Aset

1. Pada detail aset, klik tombol **[Edit]**.
2. Ubah field yang diperlukan.
3. Klik **[Simpan Perubahan]**.

> **⚠ Catatan**: Perubahan dicatat di audit trail. Setiap edit tersimpan beserta siapa yang mengubah dan kapan.

### 5.5 Melihat Stok Aset

**Siapa**: Semua role (dengan perspektif berbeda)

1. Klik **Pusat Aset > Stok Aset** di sidebar.
2. Pilih perspektif:
   - **Gudang Utama**: Semua stok di gudang pusat (SA, AL, AP)
   - **Gudang Divisi**: Stok per divisi (SA, AL, Leader)
   - **Stok Pribadi**: Aset yang dipegang user (semua role)
3. Aset dengan stok di bawah threshold ditandai **🔴 KRITIS**.

### 5.6 Mengatur Threshold Stok

**Siapa**: Super Admin, Admin Logistik

1. Di halaman Stok Aset, klik **[⚙ Atur Threshold]**.
2. Pilih model aset.
3. Masukkan nilai minimum stok.
4. Aktifkan toggle **Alert**.
5. Klik **[Simpan]**.
6. Sistem akan mengirim notifikasi otomatis jika stok model tersebut di bawah threshold.

### 5.7 Mengelola Kategori, Tipe, dan Model

**Siapa**: Super Admin, Admin Logistik

1. Klik **Pengaturan > Kategori & Model** di sidebar.
2. Hierarki: **Kategori → Tipe → Model** (3 tingkat).
3. Untuk menambah:
   - Klik **[+ Tambah Kategori]**, isi nama, klik **[Simpan]**.
   - Di dalam kategori, klik **[+ Tambah Tipe]**, isi nama, klik **[Simpan]**.
   - Di dalam tipe, klik **[+ Tambah Model]**, isi nama, klik **[Simpan]**.
4. Kategori/Tipe/Model tidak dapat dihapus jika masih memiliki aset aktif.

---

## 6. Modul Transaksi

Semua transaksi mengikuti pola yang konsisten: **Buat → Approval → Eksekusi → Selesai**.

### 6.1 Permintaan Baru (Pengadaan Aset)

#### 6.1.1 Membuat Permintaan

**Siapa**: Semua role

1. Klik **Pusat Aset > Request Aset > Request Baru** di sidebar.
2. Klik **[+ Buat Request Baru]**.
3. Isi form:

   | Field        | Wajib? | Keterangan                              |
   | ------------ | ------ | --------------------------------------- |
   | Tipe Order   | ✅     | Regular / Urgent / Project-Based        |
   | Alokasi      | ❌     | Penggunaan langsung / Inventaris gudang |
   | Justifikasi  | ❌     | Alasan permintaan                       |
   | Item Request | ✅     | Min. 1 item, max 50 item per request    |
   | — Nama Item  | ✅     | Nama barang yang diminta                |
   | — Tipe/Brand | ✅     | Spesifikasi tipe dan brand              |
   | — Jumlah     | ✅     | Kuantitas yang diminta                  |
   | — Satuan     | ❌     | pcs, meter, unit, dll.                  |
   | Lampiran     | ❌     | Dokumen pendukung                       |
   | Catatan      | ❌     | Catatan tambahan                        |

4. Klik **[Kirim Request]**.
5. Status awal: **⏳ Pending**.

#### 6.1.2 Alur Approval

Setelah dikirim, request masuk ke rantai persetujuan. Rantai **berbeda** tergantung role pembuat:

**Jika dibuat oleh Staff:**

```
Staff → Leader Divisi → Admin Logistik → Admin Purchase → Super Admin
```

**Jika dibuat oleh Leader:**

```
Leader → Admin Logistik → Admin Purchase → Super Admin
```

**Jika dibuat oleh Admin Logistik:**

```
Admin Logistik → Admin Purchase → Super Admin
```

**Jika dibuat oleh Admin Purchase:**

```
Admin Purchase → Admin Logistik → Super Admin
```

**Jika dibuat oleh Super Admin:**

```
Super Admin → Admin Logistik → Admin Purchase
```

> **ℹ Setiap approver** mendapat notifikasi in-app dan (jika dikonfigurasi) WhatsApp.

#### 6.1.3 Menyetujui / Menolak Request

**Siapa**: Sesuai posisi dalam rantai approval

1. Anda mendapat **notifikasi** bahwa ada request yang menunggu persetujuan.
2. Klik notifikasi atau buka **Request Baru** > cari request dengan status **⏳ Pending**.
3. Klik request untuk membuka detail.
4. Review item yang diminta, kuantitas, dan justifikasi.
5. Pilih aksi:

   **Approve:**
   - Klik **[✓ Approve]**.
   - Anda dapat **menyesuaikan kuantitas** per item (misalnya: diminta 100, disetujui 50 karena stok terbatas). Ini menghasilkan status **⚠ Partial**.
   - Request diteruskan ke approver berikutnya.

   **Reject:**
   - Klik **[✗ Reject]**.
   - Isi **alasan penolakan** (wajib).
   - Status berubah menjadi **✗ Rejected**. Proses berhenti.
   - Pembuat request mendapat notifikasi beserta alasan.

#### 6.1.4 Melacak Status Request

1. Buka halaman **Request Baru**.
2. Filter berdasarkan status (Pending, Approved, Rejected, dll.).
3. Pada detail request, lihat **Approval Timeline** untuk mengetahui posisi di rantai approval.

### 6.2 Peminjaman Aset

#### 6.2.1 Membuat Pinjaman

**Siapa**: Semua role

1. Klik **Pusat Aset > Request Aset > Request Pinjam** di sidebar.
2. Klik **[+ Buat Pinjaman Baru]**.
3. Isi form:

   | Field           | Wajib? | Keterangan                    |
   | --------------- | ------ | ----------------------------- |
   | Item Pinjam     | ✅     | Nama item + Brand + Jumlah    |
   | Tanggal Kembali | ❌     | Estimasi tanggal pengembalian |
   | Tujuan          | ❌     | Alasan peminjaman             |

4. Klik **[Kirim]**. Status: **⏳ Pending**.

#### 6.2.2 Approval Pinjaman

**Alur approval (lebih sederhana dari request pengadaan):**

| Pembuat        | Approval 1     | Approval 2     |
| -------------- | -------------- | -------------- |
| Staff          | Leader Divisi  | Admin Logistik |
| Leader         | Admin Logistik | —              |
| Admin Logistik | Super Admin    | —              |

Saat meng-approve, **Admin Logistik harus meng-assign aset spesifik** (misalnya: memilih Laptop dengan serial number tertentu dari gudang) ke setiap item pinjaman.

#### 6.2.3 Pengembalian Aset Pinjaman

1. Buka detail pinjaman yang statusnya **On Loan**.
2. Klik **[Ajukan Pengembalian]**.
3. Isi kondisi aset saat dikembalikan.
4. Admin Logistik memverifikasi pengembalian.
5. Status pinjaman berubah menjadi **Returned**.

> **⚠ Pinjaman Overdue**: Jika melewati tanggal kembali, status berubah menjadi **Overdue** dan notifikasi dikirim ke peminjam + Leader.

### 6.3 Serah Terima (Handover)

**Siapa**: Super Admin, Admin Logistik

1. Klik **Pusat Aset > Handover Aset** di sidebar.
2. Klik **[+ Buat Handover]**.
3. Isi form:

   | Field                | Wajib? | Keterangan                      |
   | -------------------- | ------ | ------------------------------- |
   | Tanggal Serah Terima | ✅     | Tanggal pelaksanaan             |
   | Pihak Menyerahkan    | ✅     | Pilih user (otomatis jika self) |
   | Pihak Menerima       | ✅     | Pilih user penerima             |
   | Pihak Mengetahui     | ✅     | Atasan / saksi                  |
   | Item Serah Terima    | ✅     | Pilih aset dari daftar          |
   | No. WO/RO/INT        | ❌     | Referensi work order            |

4. Klik **[Simpan]**.
5. Status aset yang diserahterimakan otomatis berubah (misalnya: `IN_STORAGE` → `IN_USE`).

### 6.4 Lapor Aset Rusak (Repair)

**Siapa**: Semua role (pelaporan), Admin Logistik (pengelolaan)

1. Klik **Pusat Aset > Perbaikan Aset** di sidebar.
2. Klik **[+ Lapor Kerusakan]**.
3. Isi form:

   | Field               | Wajib? | Keterangan                 |
   | ------------------- | ------ | -------------------------- |
   | Aset                | ✅     | Cari aset (nama/serial/QR) |
   | Deskripsi Kerusakan | ✅     | Detail masalah             |
   | Foto Kerusakan      | ❌     | Upload gambar (max 5MB)    |

4. Status aset berubah menjadi **Under Repair**.
5. Admin Logistik menindaklanjuti: perbaikan internal, kirim ke service center, atau decommission.

### 6.5 Scan QR Code

1. Di halaman Daftar Aset, klik **[📱 Scan QR]** (jika menggunakan perangkat dengan kamera).
2. Arahkan kamera ke QR code aset.
3. Sistem langsung menampilkan detail aset tersebut.

---

## 7. Manajemen Pelanggan

### 7.1 Melihat Daftar Pelanggan

**Siapa**: Super Admin, Admin Logistik, Leader (divisi sendiri), Staff (divisi sendiri)

1. Klik **Manajemen Pelanggan > Daftar Pelanggan** di sidebar.
2. Gunakan pencarian untuk mencari nama atau kode pelanggan.

### 7.2 Menambah Pelanggan Baru

**Siapa**: Super Admin, Admin Logistik

1. Klik **[+ Tambah Pelanggan]**.
2. Isi form: Nama, Alamat, Kontak, dll.
3. Klik **[Simpan]**.

### 7.3 Mencatat Instalasi

**Siapa**: Super Admin, Admin Logistik (eksekutor: Teknisi)

1. Buka detail pelanggan > Tab **Instalasi**.
2. Klik **[+ Tambah Instalasi]**.
3. Isi form:

   | Field             | Wajib? | Keterangan             |
   | ----------------- | ------ | ---------------------- |
   | Tanggal Instalasi | ✅     | Tanggal pelaksanaan    |
   | Teknisi           | ✅     | Pilih teknisi          |
   | Aset Diinstall    | ✅     | Pilih aset dari gudang |
   | Material Terpakai | ❌     | Material habis pakai   |

4. Klik **[Simpan]**. Status aset berubah dari gudang ke lokasi pelanggan.

### 7.4 Mencatat Maintenance

1. Buka detail pelanggan > Tab **Maintenance**.
2. Klik **[+ Tambah Maintenance]**.
3. Isi: Deskripsi masalah, tindakan, material yang digunakan, penggantian.
4. Jika ada **material pengganti**, stok otomatis berkurang.

### 7.5 Mencatat Dismantle

1. Buka detail pelanggan > Tab **Dismantle**.
2. Klik **[+ Tambah Dismantle]**.
3. Pilih aset yang dibongkar, isi kondisi aset saat diambil.
4. Aset dikembalikan ke gudang dengan status dan kondisi yang sesuai.

---

## 8. Proyek Infrastruktur

### 8.1 Membuat Proyek

**Siapa**: Super Admin, Admin Logistik, Leader

1. Klik **Proyek Infrastruktur** di sidebar.
2. Klik **[+ Buat Proyek]**.
3. Isi form:

   | Field           | Wajib? | Keterangan                            |
   | --------------- | ------ | ------------------------------------- |
   | Nama Proyek     | ✅     | Nama deskriptif proyek                |
   | Tipe            | ✅     | Backbone, OLT Rack, Server Rack, dll. |
   | Prioritas       | ✅     | Low / Medium / High / Critical        |
   | Tanggal Mulai   | ❌     | Rencana tanggal mulai                 |
   | Tanggal Selesai | ❌     | Rencana tanggal selesai               |
   | Budget Estimasi | ❌     | Perkiraan biaya (Rupiah)              |
   | Deskripsi       | ❌     | Detail proyek                         |

4. Klik **[Simpan]**. Status awal: **Draft**.

### 8.2 Mengelola Proyek

Setelah proyek dibuat, Anda dapat mengelola:

- **Tasks**: Tambah task, assign ke anggota tim, update progress.
- **Material**: Daftar material yang dibutuhkan.
- **Tim**: Tambah/hapus anggota tim proyek.

### 8.3 Alur Approval Proyek

```
Draft → Submit for Approval → Approved → In Progress → Completed
                              ↓
                           Rejected
```

---

## 9. Pengaturan & Kelola Akun

### 9.1 Mengelola Profil Sendiri

**Siapa**: Semua role

1. Klik **Pengaturan > Kelola Akun** di sidebar, atau klik avatar > **Kelola Akun** di header.
2. Anda dapat:
   - Mengubah **nama tampilan**
   - Mengganti **password**
   - Melihat daftar **aset yang Anda pegang**

### 9.2 Mengelola User (Super Admin Only)

1. Klik **Pengaturan > Akun & Divisi** > Tab **Daftar Akun**.
2. **Menambah User:**
   - Klik **[+ Tambah Akun]**.
   - Isi: Nama, Email, Role, Divisi.
   - Password awal akan di-generate otomatis.
   - User baru akan diminta ganti password saat login pertama.
3. **Mengedit User:**
   - Klik ikon **Edit** pada row user.
   - Ubah role, divisi, atau nama.
4. **Reset Password:**
   - Klik menu **⋮** > **Reset Password**.
   - Sistem men-generate password sementara.
5. **Mengelola Permission:**
   - Klik menu **⋮** > **Kelola Permission**.
   - Centang/hapus centang permission individual.
   - Setiap role memiliki permission default yang dapat dikustomisasi.
6. **Menonaktifkan User:**
   - Klik menu **⋮** > **Nonaktifkan**.
   - User tidak dapat login tetapi datanya tetap tersimpan.

### 9.3 Mengelola Divisi (Super Admin Only)

1. Klik **Pengaturan > Akun & Divisi** > Tab **Daftar Divisi**.
2. **Menambah Divisi:** Klik **[+ Tambah Divisi]**, isi nama dan deskripsi.
3. **Mengedit Divisi:** Klik ikon Edit.
4. Divisi tidak dapat dihapus jika masih memiliki anggota aktif.

### 9.4 Data Pembelian (Admin Purchase & Super Admin)

1. Klik **Pengaturan > Data Pembelian**.
2. Setiap model aset dapat memiliki **satu data pembelian** yang mencakup:
   - Harga satuan, vendor, periode garansi
   - Metode depresiasi (Straight Line / Declining Balance / None)
   - Umur manfaat (tahun) dan nilai residu

### 9.5 Tema Gelap/Terang

1. Klik **avatar** di header > **Ganti Tema**.
2. Pilih **☀ Terang** atau **🌙 Gelap**.
3. Preferensi tersimpan otomatis.

---

## 10. SOP: Prosedur Operasional Standar

### SOP-01: Penerimaan Aset Baru dari Vendor

| Langkah | Pelaku         | Aksi                                                                                  |
| ------- | -------------- | ------------------------------------------------------------------------------------- |
| 1       | Admin Purchase | Menerima barang dari vendor, cek kesesuaian dengan PO.                                |
| 2       | Admin Logistik | Membuka TrinityApps > **Catat Aset > [+ Tambah Aset]** (atau Bulk Import).            |
| 3       | Admin Logistik | Mengisi detail aset: nama, kategori, tipe, model, serial number, harga beli, tanggal. |
| 4       | Admin Logistik | Upload foto aset (jika ada) dan dokumen pendukung (invoice/PO).                       |
| 5       | Admin Logistik | Klik **[Simpan]**. Aset otomatis mendapat QR code dan status `In Storage`.            |
| 6       | Admin Logistik | Cetak label QR code dan tempelkan pada aset fisik.                                    |
| 7       | Admin Purchase | Membuka **Data Pembelian**, isi data depresiasi untuk model terkait (jika belum ada). |

**Output**: Aset tercatat di sistem, memiliki QR code, dan data pembelian terhubung.

---

### SOP-02: Permintaan Pengadaan Aset (Request Baru)

| Langkah | Pelaku         | Aksi                                                                           |
| ------- | -------------- | ------------------------------------------------------------------------------ |
| 1       | Staff/Leader   | Buka **Request Baru > [+ Buat Request]**. Isi item, jumlah, justifikasi.       |
| 2       | Sistem         | Menentukan rantai approval berdasarkan role pemohon.                           |
| 3       | Approver 1     | Menerima notifikasi > Buka detail request > **[Approve]** atau **[Reject]**.   |
| 4       | Approver 2-N   | Mengulangi langkah 3 sesuai rantai approval.                                   |
| 5       | Admin Purchase | Mengisi detail pembelian (vendor, harga) jika request mencapai tahap purchase. |
| 6       | Admin Logistik | Setelah semua approval selesai, menerima dan mencatat aset (lihat SOP-01).     |
| 7       | Admin Logistik | Menandai request sebagai **Completed** setelah aset diterima dan dicatat.      |

**Waktu Standar**: Seluruh proses approval ≤ 3 hari kerja (untuk request Regular).

**Pengecualian**: Request bertipe **Urgent** harus diproses dalam 1 hari kerja.

---

### SOP-03: Peminjaman & Pengembalian Aset

| Langkah | Pelaku         | Aksi                                                                         |
| ------- | -------------- | ---------------------------------------------------------------------------- |
| 1       | Peminjam       | Buka **Request Pinjam > [+ Buat Pinjaman]**. Pilih item dan tanggal kembali. |
| 2       | Leader         | Approve pinjaman (jika peminjam = Staff).                                    |
| 3       | Admin Logistik | Approve + **assign aset spesifik** dari gudang ke setiap item pinjaman.      |
| 4       | Admin Logistik | Lakukan serah terima fisik. Status aset: `In Custody`.                       |
| 5       | Peminjam       | Saat selesai: Buka detail pinjaman > **[Ajukan Pengembalian]**.              |
| 6       | Admin Logistik | Verifikasi kondisi aset fisik > **[Approve Pengembalian]**.                  |
| 7       | Sistem         | Status aset kembali ke `In Storage`. Pinjaman ditandai `Returned`.           |

**SLA**: Pengembalian harus dilakukan sebelum tanggal yang disepakati. Sistem mengirim reminder H-3 dan H-1.

---

### SOP-04: Serah Terima Aset Antar Pengguna

| Langkah | Pelaku         | Aksi                                                        |
| ------- | -------------- | ----------------------------------------------------------- |
| 1       | Admin Logistik | Buka **Handover > [+ Buat Handover]**.                      |
| 2       | Admin Logistik | Pilih: Pihak Menyerahkan, Pihak Menerima, Pihak Mengetahui. |
| 3       | Admin Logistik | Pilih aset yang akan diserahterimakan dari daftar.          |
| 4       | Admin Logistik | Klik **[Simpan]**. Status aset & PIC otomatis terupdate.    |
| 5       | Sistem         | Notifikasi dikirim ke pihak menerima dan pihak mengetahui.  |

---

### SOP-05: Pelaporan Aset Rusak

| Langkah | Pelaku         | Aksi                                                                             |
| ------- | -------------- | -------------------------------------------------------------------------------- |
| 1       | User (PIC)     | Buka **Perbaikan Aset > [+ Lapor Kerusakan]**. Pilih aset, isi deskripsi.        |
| 2       | Sistem         | Status aset berubah menjadi `Under Repair`. Notifikasi ke Admin Logistik.        |
| 3       | Admin Logistik | Evaluasi kerusakan. Tentukan tindakan: perbaiki internal / kirim service center. |
| 4a      | Admin Logistik | **Jika diperbaiki**: Update status → `In Storage` setelah selesai.               |
| 4b      | Admin Logistik | **Jika dikirim ke service center**: Status → `Out for Repair`.                   |
| 4c      | Admin Logistik | **Jika tidak bisa diperbaiki**: Status → `Decommissioned`.                       |
| 5       | Sistem         | Seluruh proses tercatat di audit trail.                                          |

---

### SOP-06: Stock Opname (Pencocokan Stok)

| Langkah | Pelaku         | Aksi                                                                |
| ------- | -------------- | ------------------------------------------------------------------- |
| 1       | Admin Logistik | Buka **Stok Aset > Gudang Utama**.                                  |
| 2       | Admin Logistik | Export daftar stok ke Excel via tombol **[📥 Export]**.             |
| 3       | Admin Logistik | Lakukan penghitungan fisik, cocokan dengan data di Excel.           |
| 4       | Admin Logistik | Jika ada selisih: catat penyesuaian menggunakan **Stock Movement**. |
| 5       | Admin Logistik | Dokumentasikan hasil di catatan/lampiran.                           |

**Frekuensi**: Minimal 1x per bulan (target KPI: stock opname < 1 hari kerja).

---

### SOP-07: Instalasi di Lokasi Pelanggan

| Langkah | Pelaku         | Aksi                                                                  |
| ------- | -------------- | --------------------------------------------------------------------- |
| 1       | Admin Logistik | Buka detail pelanggan > Tab **Instalasi** > **[+ Tambah Instalasi]**. |
| 2       | Admin Logistik | Pilih teknisi, tanggal, aset yang akan diinstall, material terpakai.  |
| 3       | Teknisi        | Melakukan instalasi fisik di lokasi pelanggan.                        |
| 4       | Teknisi/Admin  | Update status instalasi menjadi completed setelah selesai.            |
| 5       | Sistem         | Stok material otomatis berkurang. Aset tercatat di lokasi pelanggan.  |

---

### SOP-08: Onboarding User Baru

| Langkah | Pelaku      | Aksi                                                                     |
| ------- | ----------- | ------------------------------------------------------------------------ |
| 1       | Super Admin | Buka **Akun & Divisi > [+ Tambah Akun]**. Isi nama, email, role, divisi. |
| 2       | Super Admin | Salin password sementara yang di-generate sistem.                        |
| 3       | Super Admin | Kirim password sementara ke user baru (via WhatsApp/email).              |
| 4       | User Baru   | Login ke TrinityApps. Sistem meminta ganti password.                     |
| 5       | User Baru   | Ganti password, mulai menggunakan sistem sesuai role.                    |
| 6       | Super Admin | (Opsional) Kustomisasi permission user jika diperlukan.                  |

---

## 11. FAQ & Troubleshooting

### Q: Saya lupa password, bagaimana cara reset?

**A:** Hubungi Super Admin. Mereka dapat mereset password Anda dari panel **Akun & Divisi**.

### Q: Mengapa saya tidak melihat menu tertentu di sidebar?

**A:** Menu yang tampil disesuaikan dengan role dan permission Anda. Jika Anda merasa seharusnya memiliki akses, hubungi Super Admin untuk mengecek permission Anda.

### Q: Request saya ditolak, bagaimana cara membuat ulang?

**A:** Request yang ditolak tidak dapat diedit. Buat request baru dengan perbaikan sesuai alasan penolakan yang tercantum di detail request.

### Q: Bagaimana cara mencetak QR code aset?

**A:** Buka detail aset > klik QR Code > klik **[Cetak]**. Gunakan printer label untuk hasil terbaik.

### Q: Notifikasi tidak muncul, apa yang harus dilakukan?

**A:** Pastikan browser mengizinkan notifikasi dari TrinityApps. Cek juga halaman Notifikasi untuk melihat semua notifikasi yang masuk.

### Q: Stok di sistem tidak cocok dengan stok fisik, apa penyebabnya?

**A:** Kemungkinan ada transaksi (handover, instalasi, maintenance) yang belum dicatat di sistem. Lakukan stock opname sesuai SOP-06 dan catat penyesuaian.

### Q: Bagaimana jika aset hilang?

**A:** Laporkan melalui menu **Perbaikan Aset** dengan kategori kerusakan. Admin Logistik dan Super Admin akan menerima notifikasi untuk investigasi. Lihat juga SOP-05.

### Q: Apakah data saya aman?

**A:** Ya. TrinityApps menggunakan:

- Enkripsi password (bcrypt, cost factor ≥ 12)
- Komunikasi terenkripsi (HTTPS/TLS 1.3)
- Kontrol akses berbasis permission (RBAC)
- Audit trail untuk setiap perubahan data
- Backup database otomatis harian

### Q: Bisa diakses dari HP?

**A:** Ya. TrinityApps memiliki desain responsif yang mendukung akses dari smartphone (min. 360px). Data table otomatis berubah menjadi card list pada layar kecil.

---

## Referensi Silang

| Topik                               | Dokumen                          | Section          |
| ----------------------------------- | -------------------------------- | ---------------- |
| Spesifikasi visual & layout         | UIUX_DESIGN_DOCUMENT.md          | Section 7        |
| Matriks approval workflow lengkap   | PRD v3.1                         | Section 7.3      |
| API endpoint reference              | SDD v3.1 / Swagger (`/api/docs`) | —                |
| User flow lengkap (diagram Mermaid) | USER_SYSTEM_FLOW.md              | Dokumen terpisah |
| Matriks RBAC & permission           | PRD v3.1                         | Section 7.2      |

---

**— Akhir Dokumen User Manual & SOP v1.0 —**
