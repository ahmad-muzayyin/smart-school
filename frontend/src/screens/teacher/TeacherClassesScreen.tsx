import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, shadows, spacing, palette, getThemeColors } from '../../theme/theme';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export default function TeacherClassesScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const themeColors = getThemeColors(isDarkMode);

    const [classes, setClasses] = useState<any[]>([]);
    const [homeRoomClasses, setHomeRoomClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
        fetchHomeRoomClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const data = res.data.data.schedules;
            // Uniquify by classId
            const uniqueClasses = data.reduce((acc: any[], curr: any) => {
                if (!acc.find((item: any) => item.classId === curr.classId)) {
                    acc.push(curr);
                }
                return acc;
            }, []);
            setClasses(uniqueClasses);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHomeRoomClasses = async () => {
        // Teacher might navigate here, we need to know which classes they are homeroom for.
        // We can fetch all classes and filter, or check user profile.
        // Let's rely on checking if the user is assigned as homeRoomTeacher to any class.
        // Since we don't have a direct endpoint for "my homeroom classes", we can fetch all classes (if small) or search.
        // Ideally: GET /classes?homeRoomTeacherId=ME
        try {
            const res = await client.get(`/classes`); // This typically returns all classes. Might be heavy if many.
            // Filter client side for now as we didn't add filter backend
            const all = res.data.data.classes;
            const myHomeRoom = all.filter((c: any) => c.homeRoomTeacherId === user?.id);
            setHomeRoomClasses(myHomeRoom);
        } catch (e) {
            console.log('Error fetching homeroom classes', e);
        }
    };

    const handleExportRecap = async (classId: string, className: string) => {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthStr = `${year}-${month}`;

            // API Call would return a Blob (buffer)
            // client.get defaults to JSON, we need responseType arraybuffer/blob
            if (Platform.OS === 'web') {
                // For web we can open window
                const token = (client.defaults.headers as any).Authorization;
                const url = `${client.defaults.baseURL}/classes/${classId}/export-rekap?month=${monthStr}`;

                // We need to pass auth token. Browser direct link won't have headers.
                // So we use fetch with blob.
                const response = await fetch(url, {
                    headers: { Authorization: token }
                });
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `rekap_${className}_${monthStr}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // Mobile implementation
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    Alert.alert('Error', 'Sesi tidak valid, silakan login ulang.');
                    return;
                }

                const fileName = `Rekap_Absensi_${className.replace(/\s+/g, '_')}_${monthStr}.xlsx`;
                const fileUri = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + fileName;

                // Robust download url with auth_token query param fallback
                const IP_ADDRESS = '34.126.121.250';
                const downloadUrl = `http://${IP_ADDRESS}:3000/api/classes/${classId}/export-rekap?month=${monthStr}&auth_token=${token}`;

                console.log('Downloading Recap from:', downloadUrl);

                const downloadResumable = (FileSystem as any).createDownloadResumable(
                    downloadUrl,
                    fileUri,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const downloadRes = await downloadResumable.downloadAsync();

                if (downloadRes && downloadRes.status === 200) {
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(downloadRes.uri);
                    } else {
                        Alert.alert('Sukses', 'File disimpan di: ' + downloadRes.uri);
                    }
                } else {
                    throw new Error('Gagal download (Status: ' + (downloadRes?.status || 'Unknown') + ')');
                }
            }
        } catch (error: any) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat export recap: ' + error.message);
            console.error(error);
        }
    };

    const handleExportPDF = async (classId: string, className: string) => {
        try {
            Alert.alert('Memproses', 'Sedang membuat PDF...');
            const date = new Date();
            const monthStr = date.toISOString().slice(0, 7);

            // Fetch JSON Data
            // Fetch JSON Data
            const res = await client.get(`/classes/${classId}/rekap-data?month=${monthStr}`);
            const { tenant, class: cls, period, rows } = res.data.data;

            // PREPARE LOGO (Convert to Base64 for reliable PDF rendering)
            let logoBase64 = null;
            if (tenant.logo) {
                try {
                    // If URL is relative or absolute, handle accordingly. 
                    // Assuming tenant.logo is a full URL.
                    // If it's localhost, we might need to replace with IP_ADDRESS but client fetch usually handles connectivity.
                    // Better to rely on FileSystem download.
                    const cacheDir = FileSystem.cacheDirectory + 'logo_rekap_temp.png';
                    const downloadRes = await FileSystem.downloadAsync(tenant.logo, cacheDir);
                    if (downloadRes.status === 200) {
                        const base64 = await FileSystem.readAsStringAsync(cacheDir, { encoding: FileSystem.EncodingType.Base64 });
                        logoBase64 = `data:image/png;base64,${base64}`;
                    }
                } catch (e) {
                    console.log('Failed to load logo for PDF', e);
                }
            }

            const logoHtml = logoBase64
                ? `<div class="logo-container"><img src="${logoBase64}" class="logo" /></div>`
                : (tenant.logo ? `<div class="logo-container"><img src="${tenant.logo}" class="logo" /></div>` : '');

            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', serif; padding: 20px; }
    .header { text-align: center; border-bottom: 3px double black; line-height: 1.2; margin-bottom: 20px; padding-bottom: 10px; position: relative; min-height: 80px; }
    .logo-container { position: absolute; left: 0; top: 0; }
    .logo { width: 70px; height: auto; }
    .school-info { margin-left: 80px; margin-right: 80px; } 
    .school-name { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0; padding-top: 5px; }
    .school-address { font-size: 12px; margin: 5px 0 0; }
    .title { text-align: center; font-weight: bold; font-size: 16px; margin: 20px 0; text-decoration: underline; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid black; padding: 4px 2px; text-align: center; vertical-align: middle; }
    th { background-color: #f0f0f0; }
    .name-col { text-align: left; width: 150px; padding-left: 5px; }
    .no-col { width: 30px; }
    .day-col { width: 15px; font-size: 9px; }
    .sum-col { width: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
      ${logoHtml}
      <div class="school-info">
          <h1 class="school-name">${tenant.name || 'NAMA SEKOLAH'}</h1>
          <p class="school-address">${tenant.address || ''}</p>
      </div>
  </div>

  <div class="title">REKAP ABSENSI KELAS ${cls.name}<br/>BULAN ${period.month}/${period.year}</div>

  <table>
    <thead>
      <tr>
        <th rowspan="2" class="no-col">NO</th>
        <th rowspan="2" class="name-col">NAMA SISWA</th>
        <th colspan="${period.daysInMonth}">TANGGAL</th>
        <th colspan="4">TOTAL</th>
      </tr>
      <tr>
        ${Array.from({ length: period.daysInMonth }, (_, i) => `<th class="day-col">${i + 1}</th>`).join('')}
        <th class="sum-col">S</th><th class="sum-col">I</th><th class="sum-col">A</th><th class="sum-col">H</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((row: any) => `
        <tr>
          <td>${row.no}</td>
          <td class="name-col">${row.name}</td>
          ${Array.from({ length: period.daysInMonth }, (_, i) => `<td>${row.dates[i + 1]}</td>`).join('')}
          <td>${row.stats.s}</td>
          <td>${row.stats.i}</td>
          <td>${row.stats.a}</td>
          <td>${row.stats.h}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
    <div style="text-align: center; width: 200px;">
        <p>Wali Kelas,</p>
        <br/><br/><br/>
        <p style="font-weight: bold; text-decoration: underline;">${user?.name || '...................'}</p>
    </div>
  </div>
</body>
</html>
`;

            const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595, base64: false });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error: any) {
            console.error('PDF Error:', error);
            Alert.alert('Gagal', 'Gagal membuat PDF: ' + (error.response?.data?.message || error.message));
        }
    };

    const renderItem = ({ item, isHomeRoom }: { item: any, isHomeRoom?: boolean }) => (
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: isHomeRoom ? colors.error : colors.primary }]}>
                <Ionicons name={isHomeRoom ? "key" : "school"} size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.className, { color: themeColors.text }]}>{isHomeRoom ? item.name : item.class.name}</Text>
                <Text style={[styles.subject, { color: themeColors.textSecondary }]}>
                    {isHomeRoom ? 'Wali Kelas' : item.subject}
                </Text>
            </View>

            {isHomeRoom ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                        style={[styles.exportBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleExportPDF(item.id, item.name)}
                    >
                        <Ionicons name="document-text" size={16} color="white" />
                        <Text style={styles.exportBtnText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.exportBtn}
                        onPress={() => handleExportRecap(item.id, item.name)}
                    >
                        <Ionicons name="download" size={16} color="white" />
                        <Text style={styles.exportBtnText}>Excel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.badge}>
                    <Ionicons name="people" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>{item.class?.students?.length || 0} Siswa</Text>
                </View>
            )}
        </View>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: themeColors.background }]} safeArea={false}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daftar Kelas</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <FlatList
                contentContainerStyle={styles.list}
                data={[]}
                ListHeaderComponent={
                    <>
                        {/* Always show Recap Section so user knows it exists */}
                        <View style={{ marginBottom: spacing.lg }}>
                            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Rekap Absensi (Wali Kelas)</Text>
                            {homeRoomClasses.length > 0 ? (
                                homeRoomClasses.map(c => (
                                    <View key={'hr-' + c.id} style={{ marginBottom: spacing.sm }}>
                                        {renderItem({ item: c, isHomeRoom: true })}
                                    </View>
                                ))
                            ) : (
                                <View style={[styles.card, { backgroundColor: themeColors.surface, padding: spacing.lg, justifyContent: 'center' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
                                        <Text style={{ color: themeColors.textSecondary, flex: 1 }}>
                                            Anda belum ditugaskan sebagai Wali Kelas. Hubungi Admin untuk akses rekap.
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Jadwal Mengajar</Text>
                        {loading ? (
                            <Text style={{ color: themeColors.textSecondary }}>Memuat...</Text>
                        ) : classes.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>Belum ada jadwal mengajar.</Text>
                            </View>
                        ) : (
                            classes.map((c, i) => (
                                <View key={'cl-' + i} style={{ marginBottom: spacing.sm }}>
                                    {renderItem({ item: c, isHomeRoom: false })}
                                </View>
                            ))
                        )}
                    </>
                }
                renderItem={null}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {},
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    list: { padding: spacing.md },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm, marginLeft: 4 },

    card: {
        borderRadius: 16,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm
    },
    iconBox: {
        width: 48, height: 48, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    className: { fontSize: 16, fontWeight: 'bold' },
    subject: { fontSize: 13 },
    badge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
    },
    badgeText: { fontSize: 12, color: colors.primary, fontWeight: '600', marginLeft: 4 },

    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4
    },
    exportBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    empty: { alignItems: 'center', marginTop: 20 },
    emptyText: { color: colors.textSecondary }
});
