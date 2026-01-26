# Import Kelas - Dokumentasi

## Fitur Import Kelas dari Excel/CSV

Fitur ini memungkinkan admin untuk mengimpor data kelas secara massal menggunakan file Excel (.xlsx) atau CSV (.csv).

### Cara Menggunakan

1. **Download Template**
   - Buka aplikasi mobile → Manajemen Kelas
   - Tap icon dokumen di header (pojok kanan atas)
   - Pilih "Download Template"
   - Template akan diunduh ke perangkat Anda

2. **Isi Template**
   - Buka file template yang sudah didownload
   - Isi kolom `ClassName` dengan nama kelas
   - Contoh:
     ```
     ClassName
     X IPA 1
     X IPA 2
     X IPS 1
     ```

3. **Upload File**
   - Kembali ke Manajemen Kelas
   - Tap icon dokumen di header
   - Pilih "Import Kelas (Upload)"
   - Pilih file Excel/CSV yang sudah diisi
   - Tunggu proses import selesai

### Format File

**CSV Format:**
```csv
ClassName
X IPA 1
X IPA 2
X IPS 1
```

**Excel Format:**
| ClassName |
|-----------|
| X IPA 1   |
| X IPA 2   |
| X IPS 1   |

### Kolom yang Diperlukan

- **ClassName** (Wajib): Nama kelas yang akan dibuat
  - Alternatif nama kolom: `NamaKelas`, `Kelas`

### Catatan Penting

1. **Duplikasi**: Jika kelas dengan nama yang sama sudah ada, kelas tersebut akan dilewati (tidak akan dibuat duplikat)
2. **Format File**: Mendukung format .xlsx, .xls, dan .csv
3. **Encoding**: Untuk file CSV, gunakan encoding UTF-8
4. **Hasil Import**: Setelah import selesai, akan muncul notifikasi dengan jumlah kelas yang berhasil dan gagal diimport

### Troubleshooting

**Error: "Nama kelas wajib diisi"**
- Pastikan kolom `ClassName` terisi untuk setiap baris
- Periksa ejaan nama kolom (harus `ClassName`, `NamaKelas`, atau `Kelas`)

**Import gagal semua**
- Periksa format file (harus .xlsx, .xls, atau .csv)
- Pastikan file tidak corrupt
- Coba download template ulang dan isi kembali

**Beberapa kelas tidak terimport**
- Cek console log untuk detail error
- Kemungkinan kelas sudah ada di database
- Periksa format nama kelas (tidak boleh kosong)

### API Endpoint

**POST** `/api/classes/import-classes`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
file: <Excel/CSV file>
```

**Response:**
```json
{
  "status": "success",
  "imported": 5,
  "failed": 0,
  "errors": []
}
```

### Implementasi Backend

File: `backend/src/controllers/classImportController.ts`

Fungsi utama:
- Membaca file Excel/CSV menggunakan library `xlsx`
- Parsing data dan validasi
- Cek duplikasi berdasarkan nama kelas
- Insert ke database menggunakan Prisma
- Return hasil import (berhasil/gagal)

### Implementasi Frontend

File: `frontend/src/screens/admin/ManageClassesScreen.tsx`

Fungsi utama:
- `handleDownloadTemplate()`: Generate dan download template CSV
- `handleImportExcel()`: Upload file dan trigger import
- `showImportOptions()`: Tampilkan dialog pilihan aksi

### Dependencies

**Backend:**
- `xlsx`: Parsing Excel/CSV files
- `multer`: Handle file upload

**Frontend:**
- `expo-document-picker`: Pilih file dari perangkat
- `expo-file-system`: Operasi file system
- `expo-sharing`: Share/download file
