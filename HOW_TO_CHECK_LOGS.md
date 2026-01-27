# Panduan Memeriksa Log Error

Berikut adalah cara-cara untuk memeriksa log error, baik di Server (Backend) maupun di Aplikasi HP (Frontend).

## 1. Memeriksa Log Server (Backend) via SSH

Jika backend Anda berjalan di server cloud (VPS), Anda perlu masuk menggunakan SSH.

### A. Jika Anda login menggunakan Password
Jalankan perintah ini di terminal Anda:
```bash
ssh root@34.126.121.250
```
*(Masukkan password saat diminta)*

Setelah masuk, jalankan:
```bash
pm2 logs
```
Atau untuk melihat 50 baris error terakhir saja:
```bash
pm2 logs --err --lines 50
```

### B. Jika Anda menggunakan File Kunci (.pem)
Jika Anda memiliki file kunci (misalnya `key.pem`), gunakan perintah ini:
```bash
ssh -i "path/ke/file/key.pem" root@34.126.121.250 "pm2 logs --err --lines 50"
```

---

## 2. Memeriksa Log Aplikasi Android (APK)

Jika error terjadi di HP (Frontend) dan aplikasi sudah dalam bentuk APK, Anda bisa melihat log menggunakan **ADB (Android Debug Bridge)**.

### Persiapan:
1. Aktifkan **USB Debugging** di HP Android Anda (di Developer Options).
2. Hubungkan HP ke Laptop/PC dengan kabel USB.

### Cara Cek Log:
Jalankan perintah berikut di terminal VS Code:
```bash
adb logcat *:E
```
*(Perintah ini akan menampilkan semua Error yang terjadi di HP).*

Untuk memfilter log khusus aplikasi Anda (React Native/Expo), gunakan:
```bash
adb logcat -s "ReactNativeJS" "Expo"
```

Jika Anda melihat error seperti `Network Error` atau `Image load failed`, itu berarti masalah koneksi internet atau server gambar (api.qrserver.com) yang sebelumnya kita perbaiki.

## 3. Memeriksa Log saat Development (Local)

Jika Anda menjalankan aplikasi di emulator atau HP via `npx expo start`:
1. Lihat langsung di **Terminal VS Code**.
2. Error frontend (React Native) akan muncul berwarna merah di terminal tersebut.
