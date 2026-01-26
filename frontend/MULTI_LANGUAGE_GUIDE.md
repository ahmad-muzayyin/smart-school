# Multi-Language Implementation Guide

## ✅ Setup Complete
- i18n configured with AsyncStorage
- 3 languages: Indonesian (ID), English (EN), Arabic (AR)
- Translation files created in `src/i18n/locales/`

## 🚀 How to Use in Any Screen

### Step 1: Import useTranslation
```typescript
import { useTranslation } from 'react-i18next';
```

### Step 2: Use the hook
```typescript
const { t } = useTranslation();
```

### Step 3: Replace hardcoded text
```typescript
// Before:
<Text>Kelola Guru</Text>

// After:
<Text>{t('users.manageTeachers')}</Text>
```

## 📝 Available Translation Keys

### Common
- `t('common.save')` - Simpan / Save / حفظ
- `t('common.cancel')` - Batal / Cancel / إلغاء
- `t('common.delete')` - Hapus / Delete / حذف
- `t('common.edit')` - Edit / Edit / تعديل
- `t('common.add')` - Tambah / Add / إضافة
- `t('common.search')` - Cari / Search / بحث
- `t('common.loading')` - Memuat... / Loading... / جاري التحميل...
- `t('common.error')` - Terjadi kesalahan / An error occurred / حدث خطأ
- `t('common.success')` - Berhasil / Success / نجح
- `t('common.confirm')` - Konfirmasi / Confirm / تأكيد
- `t('common.back')` - Kembali / Back / رجوع
- `t('common.ok')` - OK / OK / موافق

### Auth
- `t('auth.login')` - Masuk / Login / تسجيل الدخول
- `t('auth.logout')` - Keluar / Logout / تسجيل الخروج
- `t('auth.email')` - Email / Email / البريد الإلكتروني
- `t('auth.password')` - Password / Password / كلمة المرور

### Dashboard
- `t('dashboard.welcome')` - Selamat Datang / Welcome / مرحباً
- `t('dashboard.adminDashboard')` - Dashboard Admin / Admin Dashboard / لوحة تحكم المسؤول
- `t('dashboard.teachers')` - Guru / Teachers / المعلمون
- `t('dashboard.students')` - Siswa / Students / الطلاب
- `t('dashboard.classes')` - Kelas / Classes / الفصول
- `t('dashboard.subjects')` - Mata Pelajaran / Subjects / المواد
- `t('dashboard.schedules')` - Jadwal Pelajaran / Schedules / الجداول
- `t('dashboard.attendance')` - Absensi / Attendance / الحضور
- `t('dashboard.reports')` - Laporan / Reports / التقارير

### Users
- `t('users.manageTeachers')` - Kelola Guru / Manage Teachers / إدارة المعلمين
- `t('users.manageStudents')` - Kelola Siswa / Manage Students / إدارة الطلاب
- `t('users.addTeacher')` - Tambah Guru / Add Teacher / إضافة معلم
- `t('users.addStudent')` - Tambah Siswa / Add Student / إضافة طالب
- `t('users.editTeacher')` - Edit Guru / Edit Teacher / تعديل معلم
- `t('users.editStudent')` - Edit Siswa / Edit Student / تعديل طالب
- `t('users.name')` - Nama / Name / الاسم
- `t('users.email')` - Email / Email / البريد الإلكتروني
- `t('users.class')` - Kelas / Class / الفصل
- `t('users.subject')` - Mata Pelajaran / Subject / المادة
- `t('users.selectClass')` - Pilih Kelas / Select Class / اختر الفصل
- `t('users.selectSubject')` - Pilih Mata Pelajaran / Select Subject / اختر المادة

### Classes
- `t('classes.manageClasses')` - Kelola Kelas / Manage Classes / إدارة الفصول
- `t('classes.addClass')` - Tambah Kelas / Add Class / إضافة فصل
- `t('classes.editClass')` - Edit Kelas / Edit Class / تعديل فصل
- `t('classes.className')` - Nama Kelas / Class Name / اسم الفصل
- `t('classes.homeRoomTeacher')` - Wali Kelas / Homeroom Teacher / معلم الفصل
- `t('classes.selectTeacher')` - Pilih Wali Kelas / Select Teacher / اختر المعلم
- `t('classes.studentsCount')` - Jumlah Siswa / Students Count / عدد الطلاب

### Subjects
- `t('subjects.manageSubjects')` - Kelola Mata Pelajaran / Manage Subjects / إدارة المواد
- `t('subjects.addSubject')` - Tambah Mata Pelajaran / Add Subject / إضافة مادة
- `t('subjects.subjectName')` - Nama Mata Pelajaran / Subject Name / اسم المادة
- `t('subjects.subjectCode')` - Kode / Code / الرمز
- `t('subjects.description')` - Deskripsi / Description / الوصف

### Schedules
- `t('schedules.manageSchedules')` - Kelola Jadwal / Manage Schedules / إدارة الجداول
- `t('schedules.addSchedule')` - Tambah Jadwal / Add Schedule / إضافة جدول
- `t('schedules.editSchedule')` - Edit Jadwal / Edit Schedule / تعديل جدول
- `t('schedules.day')` - Hari / Day / اليوم
- `t('schedules.time')` - Waktu / Time / الوقت
- `t('schedules.teacher')` - Guru / Teacher / المعلم
- `t('schedules.monday')` - Senin / Monday / الإثنين
- `t('schedules.tuesday')` - Selasa / Tuesday / الثلاثاء
- `t('schedules.wednesday')` - Rabu / Wednesday / الأربعاء
- `t('schedules.thursday')` - Kamis / Thursday / الخميس
- `t('schedules.friday')` - Jumat / Friday / الجمعة
- `t('schedules.saturday')` - Sabtu / Saturday / السبت
- `t('schedules.sunday')` - Minggu / Sunday / الأحد

### Settings
- `t('settings.title')` - Pengaturan / Settings / الإعدادات
- `t('settings.profile')` - Profil Saya / My Profile / ملفي الشخصي
- `t('settings.notifications')` - Notifikasi / Notifications / الإشعارات
- `t('settings.language')` - Bahasa / Language / اللغة
- `t('settings.changePassword')` - Ubah Password / Change Password / تغيير كلمة المرور
- `t('settings.privacy')` - Privasi / Privacy / الخصوصية
- `t('settings.version')` - Versi Aplikasi / App Version / إصدار التطبيق
- `t('settings.help')` - Bantuan / Help / مساعدة
- `t('settings.privacyPolicy')` - Kebijakan Privasi / Privacy Policy / سياسة الخصوصية

## 🎯 Quick Implementation Examples

### Example 1: AdminDashboard
```typescript
import { useTranslation } from 'react-i18next';

export default function AdminDashboard({ navigation }: any) {
    const { t } = useTranslation();
    
    return (
        <View>
            <Text>{t('dashboard.welcome')}</Text>
            <Text>{t('dashboard.adminDashboard')}</Text>
        </View>
    );
}
```

### Example 2: ManageUsersScreen
```typescript
import { useTranslation } from 'react-i18next';

export default function ManageUsersScreen({ route, navigation }: any) {
    const { t } = useTranslation();
    const { role } = route.params;
    
    const title = role === 'TEACHER' 
        ? t('users.manageTeachers') 
        : t('users.manageStudents');
    
    return (
        <View>
            <Text>{title}</Text>
            <Button title={t('common.add')} />
        </View>
    );
}
```

### Example 3: Buttons
```typescript
// Save button
<TouchableOpacity onPress={handleSave}>
    <Text>{t('common.save')}</Text>
</TouchableOpacity>

// Cancel button
<TouchableOpacity onPress={handleCancel}>
    <Text>{t('common.cancel')}</Text>
</TouchableOpacity>

// Delete button
<TouchableOpacity onPress={handleDelete}>
    <Text>{t('common.delete')}</Text>
</TouchableOpacity>
```

## 🔄 How to Change Language

Users can change language from Settings:
1. Go to Settings
2. Tap "Bahasa" / "Language" / "اللغة"
3. Select language (🇮🇩 / 🇬🇧 / 🇸🇦)
4. Language changes instantly!

## ✅ Screens Already Implemented
- ✅ SettingsScreen - Fully translated
- ✅ LanguageSettingsScreen - Uses i18n

## 📋 TODO: Apply to These Screens
- AdminDashboard
- ManageUsersScreen
- ManageClassesScreen
- ManageSubjectsScreen
- ViewSchedulesScreen
- CreateScheduleScreen
- AttendanceReportScreen

## 💡 Tips
1. Always use `t()` for user-facing text
2. Keep hardcoded text only for:
   - API endpoints
   - Technical strings
   - Debug messages
3. For dynamic text, use template strings:
   ```typescript
   t('common.welcome', { name: user.name })
   ```

## 🚀 Ready to Use!
All translation keys are ready. Just import `useTranslation` and start using `t()`!
