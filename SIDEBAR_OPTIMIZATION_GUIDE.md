# Sidebar Performance Optimization Guide

## Masalah yang Ditemukan

Sidebar di-render **berkali-kali** pada setiap navigasi AJAX, menyebabkan slowness. Penyebabnya:

1. **Double Rendering**: Sidebar dirender di `app.js` → `initHeader()` dan JUGA di setiap module
2. **Multiple API Calls**: Setiap render melakukan 4 fetch API:
   - `/api/settings`
   - `/api/invoices/unpaid-count`
   - `/api/attendance/alert-count`
   - `/api/invoices/unpaid-users-count`
3. **No Caching**: Badge counts di-fetch ulang setiap kali, padahal jarang berubah

## Solusi Implementasi

### ✅ Sudah Diimplementasikan di sidebar.js:

- ✅ **Caching System**: 
  - Settings di-cache 5 menit
  - Badge counts di-cache 30 detik
- ✅ **Selective Badge Update**: 
  - Method `Sidebar.updateBadges()` → update badges TANPA re-render HTML
  - Method `Sidebar.invalidateCache()` → force refresh badge counts

### ⚠️ Perlu Dilakukan - Hapus Sidebar.render() dari Modules:

**Jalankan find & replace di semua modules** untuk menghilangkan double render:

```javascript
// SEBELUM (❌ lambat):
await Sidebar.render(user ? user.role : null);

// SESUDAH (✅ cepat):
// Hapus baris ini sepenuhnya
// Sidebar sudah di-render dari app.js
```

### 📋 Daftar Files yang Perlu Diubah:

1. `public/assets/js/modules/cctv.js` - line 8
2. `public/assets/js/modules/dashboard.js` - line 18
3. `public/assets/js/modules/checkpoint-admin.js` - line 8
4. `public/assets/js/modules/finance.js` - line 8 & 542
5. `public/assets/js/modules/attendance.js` - line 9 & 476
6. `public/assets/js/modules/leaderboard.js` - line 8
7. `public/assets/js/modules/patrol-status.js` - line 8
8. `public/assets/js/modules/profile.js` - line 11
9. `public/assets/js/modules/scan.js` - line 9 & 224
10. `public/assets/js/modules/roles.js` - line 8 & 219
11. `public/assets/js/modules/settings.js` - line 8
12. `public/assets/js/modules/security-analytics.js` - line 8
13. `public/assets/js/modules/warga.js` - line 8
14. `public/assets/js/modules/users.js` - line 8 & 138
15. `public/assets/js/modules/visitors.js` - line 9

## Penggunaan updateBadges()

**Ketika ada aksi yang mengubah data** (buat invoice, update attendance, dll):

```javascript
// Invalidate cache & update badges
await Sidebar.invalidateCache();
await Sidebar.updateBadges(true);
```

Contoh: Di module yang membuat invoice baru:
```javascript
// Setelah sukses membuat invoice
await Sidebar.invalidateCache();
await Sidebar.updateBadges(true);
```

## Performance Improvement Expected:

| Sebelum | Sesudah |
|--------|--------|
| 4+ API calls per navigasi | 0 API calls (cached) |
| Full sidebar HTML re-render setiap kali | Hanya badge update |
| ~2-3 detik loading | <200ms loading |

---

**Last Updated**: April 10, 2026
