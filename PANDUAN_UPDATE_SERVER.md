# Panduan Update di Server (SSH)

Berikut adalah langkah-langkah untuk mengambil update terbaru (Wali Kelas & Export Recap) di server.

### 1. Login ke SSH
Buka terminal dan login ke server:
```bash
ssh ahmads_muzayyin_gmail_com@34.126.121.250
```

### 2. Masuk ke Folder Project
```bash
cd attendance/smart-school
```

### 3. Ambil Update dari GitHub
Tarik perubahan terbaru dari repository:
```bash
git pull origin master
```

### 4. Build Ulang Frontend (Opsional tapi Disarankan)
Karena ada perubahan UI di Teacher Dashboard dan Admin, kita perlu build ulang asset frontend web (jika hosting web):
```bash
cd frontend
npm install
npx expo export -p web
cd ..
```
*Catatan: Jika Anda hanya menggunakan API/Backend dan Mobile App (APK), langkah ini bisa dilewati, tapi pastikan backend terupdate.*

### 5. Restart Backend
Masuk ke folder backend dan restart service agar perubahan code `classController` (untuk export) berjalan:
```bash
cd backend
npm install
pm2 restart backend-api
```

### 6. Cek Status
Pastikan server berjalan normal:
```bash
pm2 status
pm2 logs backend-api --lines 50
```

Selesai! Fitur baru sudah aktif di server.
