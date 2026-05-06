# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

## [2.0.3] - 2026-05-06
### Changed
- Relokasi fitur **Cek Pembaruan Sistem** ke halaman Changelog agar dapat diakses oleh semua peran (termasuk Satpam/Security) melalui tautan versi di sidebar.

## [2.0.2] - 2026-05-06

## [2.0.1] - 2026-05-06

## [2.0.0] - 2026-05-06

## [1.4.1] - 2026-05-06
### Added
- Dukungan format **Bold** dan *Italic* pada isi log changelog.
- Desain changelog yang lebih *compact* dan bersih untuk keterbacaan yang lebih baik.

### Fixed
- Perbaikan jarak kosong berlebih (*excessive space*) pada bagian atas sidebar.
- Optimasi margin dan padding pada baris log agar tidak terlalu renggang.


## [1.4.0] - 2026-05-06
### Added
- Integrasi **Redis High-Performance Caching** di seluruh modul utama (Finance, Warga, Security, Invoices, Visitors).
- Sistem **Unified Cache Manager** dengan fitur *Auto-Invalidation* berbasis grup logis.
- Fitur **Redis Monitoring Dashboard** untuk memantau status dan kesehatan memori server secara real-time.
- Redesain halaman **Changelog** dengan layout *Professional Collapsible Card* dan timeline animasi.

### Changed
- Peningkatan kecepatan akses data laporan hingga 500% menggunakan memori Redis.
- Optimasi query database berat (Leaderboard & Demographics) ke dalam cache cerdas.
- Upgrade sistem invalidation cache untuk memastikan data tetap akurat dan sinkron di seluruh perangkat.


## [1.3.0] - 2026-05-06
### Added
- Fitur "Initializing" pada splash screen untuk pengecekan sistem sebelum aplikasi siap digunakan.
- Sistem auto-update PWA yang mendeteksi versi baru secara otomatis dan memberikan notifikasi progres download.
- Peningkatan pengalaman pengguna (UX) dengan animasi status pada saat boot aplikasi.

### Changed
- Sentralisasi registrasi Service Worker ke dalam modul utama aplikasi untuk kontrol update yang lebih baik.


## [1.2.0] - 2026-04-10
### Added
- Sistem smart sidebar yang lebih cepat - aplikasi sekarang lebih responsif saat berpindah halaman
- Informasi badge (notifikasi) yang update real-time tanpa perlu refresh halaman

### Fixed
- Perbaikan kecepatan loading aplikasi - navigasi antar halaman sekarang jauh lebih cepat
- Optimasi penggunaan server untuk mengurangi beban pada sistem

### Changed
- Proses sidebar ditingkatkan untuk memberikan pengalaman yang lebih smooth dan cepat
- Sistem notifikasi invoice dan kehadiran dioptimalkan untuk update lebih responsif

## [1.1.0] - 2024-03-20
### Added
- Halaman Changelog baru berbasis Markdown.
- Tampilan versi aplikasi di bawah judul aplikasi (Login & Sidebar).
- Route API baru `/api/changelog` untuk melayani data changelog.

### Fixed
- Perbaikan error 404 pada endpoint `/api/public/stats` di server produksi.
- Optimalisasi pemuatan menu JSON.

## [1.0.0] - 2024-03-15
### Added
- Rilis awal Sistem Informasi RT Digital.
- Fitur manajemen warga dan keuangan dasar.
- Integrasi Google OAuth.
