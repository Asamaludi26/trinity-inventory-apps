Dokumen : Plan penyempurnaan fitur
Ditulis oleh : Angga Samaludi
Tanggal : 14 April 2026 03:33 WIB

Deskripsi : Dokumen ini ditujukan untuk merencanakan penyempurnaan fitur pada proyek yang sedang dikembangkan. Rencana ini mencakup identifikasi fitur yang akan ditingkatkan, tujuan peningkatan, langkah-langkah implementasi, dan estimasi waktu yang diperlukan untuk menyelesaikan peningkatan tersebut.

# Rencana Peningkatan dan Melengkapkan Fitur

## 1. Identifikasi Fitur yang Akan Ditingkatkan

### 1.1 Dashboard

## 1.2 Pusat Aset

### 1.2.1 Catat Aset

- pada table daftar aset harus memiliki 2 tampilan yaitu grup dan daftar, grup untuk menampilkan aset berdasarkan pencatatan (1 pencatatan memiliki banyak aset dikelompokan dalam 1 grup) sedangkan daftar untuk menampilkan aset secara keseluruhan tanpa dikelompokan berdasarkan pencatatan.
- pada form pencatatan aset harus memiliki beberapa card yaitu card dokumen (berisikan dokumen terkait pencatatan aset seperti tanggal pencatatan, dicatat oleh, nomor dokumen. semua field otomatis terisi berdasarkan waktu tanggal, user yang mencatat, dan nomor dokumen yang di generate otomatis).
- card informasi aset (berisikan informasi umum tentang aset seperti kategori, tipe dan model dan field ini merupakan field dropdown yang mengambil data dari Kategori & Model), card detail aset dibagi berdasarkan individual (berisikan informasi detail tentang aset seperti SN, MAC), dan material. material dibagi berdasarkan habis langsung dan habis perlahan, habis langsung berisikan jumlah aset dan satuan ukurnya sedangkan habis perlahan berisikan informasi tentang jumlah aset dan satuan kontainer (misal : hasbal. 1 hasbal = 1000 meter data ini diambil dari Kategori & Model).
- card informasi pembelian khusu untuk super admin dan admin purchase, yang isinya diambil dari data pembelian aset yang sudah diinputkan pada menu Data Pembelian Aset, atau dari detail realisasi pembelian aset pada request baru. data ini terisi otomatis.
- card informasi depresiasi khusus untuk super admin dan admin finance, yang isinya diambil dari data depresiasi aset yang sudah diinputkan pada menu Data Depresiasi Aset dan khusus aset individual, data ini terisi otomatis.
- card informasi lokasi berisikan field lokasi fisik aset, detail lokasi, catatan, pencatatan dari (request, manual).
- card lampiran berisikan field untuk mengupload file lampiran terkait pencatatan aset seperti foto aset, dokumen pendukung, dll.
- pada halaman detail aset, terdapat tab informasi umum yang berisikan informasi umum tentang aset seperti kategori, tipe dan model, tab informasi detail yang berisikan informasi detail tentang aset seperti SN, MAC, tab material yang berisikan informasi tentang jumlah aset dan satuan ukurnya dan barcode serta qrcode yang dirender dalam 1 bentuk hingga menjadi label digital yang dapat langsung ditempel ketika diprint, tab pembelian yang berisikan informasi tentang pembelian aset, tab depresiasi yang berisikan informasi tentang depresiasi aset, tab lokasi yang berisikan informasi tentang lokasi fisik aset, detail lokasi, catatan, pencatatan dari (request, manual), dan tab lampiran yang berisikan file lampiran terkait pencatatan aset seperti foto aset, dokumen pendukung, dll. dan tab riwayat yang berisikan informasi tentang riwayat perubahan data aset seperti perubahan lokasi, perubahan status, dll.
- buat halaman edit dari aset yang sudah dicatat, pastikan api nya sesuai dengan data untuk edit aset tersebut.
- amankan fitur hapus aset, buat modal konfirmasi hapus aset dan jika aset sudah digunakan atau ada data maka tidak bisa dihapus dan muncul notifikasi bahwa aset tidak bisa dihapus karena sudah digunakan atau ada data yang terkait dengan aset tersebut.

### 1.2.2 Stok Aset

- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), pada kolom total buat modal untuk menampilkan total stok aset yang tersedia secara detail dan juga jumlah dari setiap aset yang tersedia.
- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), pada kolom digudang menampilkan jumlah stok total yang tersedia.
- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), pada kolom digunakan menampilkan jumlah stok yang sedang digunakan secara detail dan juga jumlah dari setiap aset yang sedang digunakan.
- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), tambahkan kolom harga aset (total dari jumlah harga satuan dan khusus untuk super admin dan admin purchase).
- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), tambahkan kolom aksi yang berisikan tombol untuk restock, riwayat, lapor kerusakan (khusu individual), dan lapor hilang.
- pada table stok aset disemua tab (gudang utama, gudang divisi dan gudang pribadi), pindahkan kolom treshold ke luar dari table dan jadikan button ketika diklik akan menampilkan modal untuk mengatur treshold aset yang memiliki tab atur semuanya sekaligus dan per item.

## 1.3 Manajemen Pelanggan

## 1.4 Proyek

## 1.5 Pengaturan
