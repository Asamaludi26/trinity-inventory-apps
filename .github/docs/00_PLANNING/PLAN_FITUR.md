Dokumen : Plan penyempurnaan fitur
Ditulis oleh : Angga Samaludi
Tanggal : 14 April 2026 03:33 WIB

Deskripsi : Dokumen ini ditujukan untuk merencanakan penyempurnaan fitur pada proyek yang sedang dikembangkan. Rencana ini mencakup identifikasi fitur yang akan ditingkatkan, tujuan peningkatan, langkah-langkah implementasi, dan estimasi waktu yang diperlukan untuk menyelesaikan peningkatan tersebut.

# Rencana Perubahan Struktur

## 1. Manajemen

## 1.1 Pusat Aset diganti menjadi Manajemen Aset

Berisikan halaman berikut :

## 1.1.1 Catat Aset diganti menjadi Pencatatan Aset

## 1.1.2 Stok Aset

## 1.1.3 Lokasi Aset (baru)

## 1.1.4 Kategori & Model diganti menjadi Kategori Aset

## 1.1.5 Data Pembelian Aset

## 1.1.6 Data Depresiasi Aset

## 1.2 Manajemen Pelanggan

## 1.2.1

# Rencana Peningkatan Fitur

## 1. Identifikasi Fitur yang Akan Ditingkatkan

### 1.1 Dashboard

- Dashboard saat ini memiliki keterbatasan dalam menampilkan data dan memberikan akses yang sesuai kepada berbagai peran pengguna. Oleh karena itu, perlu dilakukan peningkatan pada dashboard untuk memberikan pengalaman yang lebih baik bagi pengguna dengan peran yang berbeda.
- Perlu menambahkan fitur card notifikasi stok aset habis dan hampir habis disertai button pada masing masing model yang relevan dan button global jika dklik button akan menuju halaman request dengan data model tersebut dan prioritas urgent, alokasi inventaris (ini wajib ada di dashboard super admin dan admin Logistik)
- Perlu ditambahkan fitur untuk menampilkan data pembelian yang sedang diproses, termasuk status pembelian, estimasi waktu kedatangan, dan informasi terkait lainnya. Fitur ini akan membantu admin purchase dalam memantau dan mengelola proses pembelian dengan lebih efektif. Fitur ini juga akan memberikan informasi yang berguna bagi admin logistik untuk merencanakan penerimaan barang dan mengelola stok dengan lebih baik. Fitur ini juga akan memberikan informasi yang berguna bagi leader dan staff untuk memahami status pembelian dan merencanakan pekerjaan mereka sesuai dengan kebutuhan. Fitur ini akan memberikan gambaran yang lebih lengkap tentang proses pembelian dan membantu semua peran dalam organisasi untuk bekerja dengan lebih efisien dan terkoordinasi. Fitur ini akan memberikan manfaat yang signifikan bagi semua peran dalam organisasi, meningkatkan transparansi, dan membantu dalam pengambilan keputusan yang lebih baik terkait dengan proses pembelian dan manajemen stok. Fitur ini akan menjadi bagian penting dari dashboard yang ditingkatkan untuk memberikan pengalaman pengguna yang lebih baik dan mendukung kebutuhan operasional organisasi secara keseluruhan.
- Perlu ditambahkan fitur untuk menampilkan data proyek yang sedang berjalan, termasuk status proyek, tenggat waktu, dan informasi terkait lainnya. Fitur ini akan membantu leader dalam memantau kemajuan proyek dan mengelola sumber daya dengan lebih efektif. Fitur ini juga akan memberikan informasi yang berguna bagi staff untuk memahami status proyek dan merencanakan pekerjaan mereka sesuai dengan kebutuhan. Fitur ini akan memberikan gambaran yang lebih lengkap tentang proyek yang sedang berjalan dan membantu semua peran dalam organisasi untuk bekerja dengan lebih efisien dan terkoordinasi. Fitur ini akan memberikan manfaat yang signifikan bagi semua peran dalam organisasi, meningkatkan transparansi, dan membantu dalam pengambilan keputusan yang lebih baik terkait dengan manajemen proyek. Fitur ini akan menjadi bagian penting dari dashboard yang ditingkatkan untuk memberikan pengalaman pengguna yang lebih baik dan mendukung kebutuhan operasional organisasi secara keseluruhan.
- Perlu ditambahkan fitur untuk menampilkan data pelanggan, termasuk informasi kontak, riwayat pembelian, dan preferensi pelanggan. Fitur ini akan membantu admin purchase dalam memahami kebutuhan pelanggan dan merencanakan pembelian dengan lebih baik. Fitur ini juga akan memberikan informasi yang berguna bagi admin logistik untuk merencanakan pengiriman dan mengelola stok dengan lebih baik. Fitur ini juga akan memberikan informasi yang berguna bagi leader dan staff untuk memahami kebutuhan pelanggan dan merencanakan pekerjaan mereka sesuai dengan kebutuhan. Fitur ini akan memberikan gambaran yang lebih lengkap tentang pelanggan dan membantu semua peran dalam organisasi untuk bekerja dengan lebih efisien dan terkoordinasi. Fitur ini akan memberikan manfaat yang signifikan bagi semua peran dalam organisasi, meningkatkan transparansi, dan membantu dalam pengambilan keputusan yang lebih baik terkait dengan manajemen pelanggan. Fitur ini akan menjadi bagian penting dari dashboard yang ditingkatkan untuk memberikan pengalaman pengguna yang lebih baik dan mendukung kebutuhan operasional organisasi secara keseluruhan.
- Perlu ditambahkan fitur untuk menampilkan data aset, termasuk informasi stok, lokasi, dan status aset. Fitur ini akan membantu admin logistik dalam memantau dan mengelola stok dengan lebih efektif. Fitur ini juga akan memberikan informasi yang berguna bagi admin purchase untuk merencanakan pembelian dengan lebih baik. Fitur ini juga akan memberikan informasi yang berguna bagi leader dan staff untuk memahami status aset dan merencanakan pekerjaan mereka sesuai dengan kebutuhan. Fitur ini akan memberikan gambaran yang lebih lengkap tentang aset dan membantu semua peran dalam organisasi untuk bekerja dengan lebih efisien dan terkoordinasi. Fitur ini akan memberikan manfaat yang signifikan bagi semua peran dalam organisasi, meningkatkan transparansi, dan membantu dalam pengambilan keputusan yang lebih baik terkait dengan manajemen aset. Fitur ini akan menjadi bagian penting dari dashboard yang ditingkatkan untuk memberikan pengalaman pengguna yang lebih baik dan mendukung kebutuhan operasional organisasi secara keseluruhan.
- Perlu ditambahkan fitur untuk menampilkan berbagai statistik dan metrik yang relevan seperti jumlah pembelian, jumlah proyek, jumlah pelanggan, dan jumlah aset lengkap dengan kategori, tipe dan modelnya.
- Khusus Super Admin, perlu ditambahkan fitur untuk memantau jumlah akun, divisi dan role yang ada di dalam organisasi, serta memberikan akses penuh ke semua data dan fitur yang tersedia di dashboard.
- Khusus Super Admin dan Admin Logistik, perlu ditambahkan fitur untuk memantau jumlah aset, stok, dan lokasi penyimpanan, serta memberikan akses penuh ke data terkait manajemen aset. Termasuk fitur kategori & model agar dapat langsung menambah data kategori, tipe dan model langsung dari dashboard.
- Khusus Super Admin dan Admin Purchase, perlu ditambahkan fitur untuk memantau jumlah pembelian, status pembelian, dan informasi terkait lainnya, serta memberikan akses penuh ke data terkait manajemen pembelian.
- Perlu menambahkan filter waktu pada setiap statistik dan matrik yang ditampilkan di dashboard untuk memungkinkan pengguna memantau data dalam rentang waktu tertentu, seperti harian, mingguan, bulanan, atau tahunan. Fitur ini akan memberikan fleksibilitas kepada pengguna untuk menganalisis data dengan lebih mendalam dan membuat keputusan yang lebih baik berdasarkan tren dan pola yang muncul dalam data tersebut.

## 1.2 Pusat Aset

## 1.3 Manajemen Pelanggan

## 1.4 Proyek

## 1.5 Pengaturan
