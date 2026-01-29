import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, shadows, spacing, palette, getThemeColors } from '../../theme/theme';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
                const fileUri = FileSystem.documentDirectory + `rekap_${className}_${monthStr}.xlsx`;
                const url = `/classes/${classId}/export-rekap?month=${monthStr}`;

                // We need a way to download with auth header using FileSystem
                // Client axios can get stream? Expo FileSystem.downloadAsync doesn't easily support custom headers in all versions.
                // Workaround: Use client to get base64 or blob, then write.

                const res = await client.get(url, {
                    responseType: 'text', // Receive as text (binary string) and convert? Or 'arraybuffer'
                    // Axios in RN with Expo: arraybuffer support varies. 
                    // Let's use FileSystem.downloadAsync with headers if supported or fetch.
                });

                // Actually, client (axios) responseType: 'blob' might not work well in RN.
                // Valid strategy: get base64 from backend?
                // Or use FileSystem.downloadAsync:
                const token = (client.defaults.headers as any).common['Authorization'] || (client.defaults.headers as any)['Authorization'];

                const fullUrl = client.defaults.baseURL + url;
                const downloadRes = await FileSystem.downloadAsync(
                    fullUrl,
                    fileUri,
                    {
                        headers: {
                            Authorization: token
                        }
                    }
                );

                if (downloadRes.status === 200) {
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri);
                    } else {
                        Alert.alert('Sukses', 'File disimpan di: ' + fileUri);
                    }
                } else {
                    throw new Error('Download failed status ' + downloadRes.status);
                }
            }
        } catch (error: any) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat export recap: ' + error.message);
            console.error(error);
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
                <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => handleExportRecap(item.id, item.name)}
                >
                    <Ionicons name="document-text" size={16} color="white" />
                    <Text style={styles.exportBtnText}>Rekap</Text>
                </TouchableOpacity>
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
