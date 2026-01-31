import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, layout, spacing, shadows } from '../../theme/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function ViewSchedulesScreen({ navigation }: any) {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    // Set default to today's day (0=Sunday, 1=Monday, etc. but we need 0=Monday for our system)
    const getTodayDayNumber = () => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1; // Convert Sunday(0) to 6, Monday(1) to 0, etc.
    };

    const [selectedDay, setSelectedDay] = useState<number | null>(getTodayDayNumber());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [importResult, setImportResult] = useState<any>(null);
    const [showImportResultModal, setShowImportResultModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchClasses();
            fetchSchedules();
        }, [selectedClass, selectedDay])
    );

    const fetchClasses = async () => {
        try {
            const res = await client.get('/classes');
            setClasses(res.data.data.classes);
        } catch (err: any) {
            // Silently fail or show unobtrusive alert
        }
    };

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = '/classes/schedules?';
            if (selectedClass) url += `classId=${selectedClass}&`;
            if (selectedDay !== null) url += `dayOfWeek=${selectedDay}&`;

            const res = await client.get(url);
            setSchedules(res.data.data.schedules);
        } catch (err: any) {
            setError('Gagal memuat jadwal pelajaran. Cek koneksi internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const csvContent = "ClassName,TeacherEmail,Subject,Day,StartTime,EndTime\nX IPA 1,guru@sekolah.com,Matematika,Senin,07:00,08:30\nX TKJ 1,guru.tkj@sekolah.com,Dasar Jaringan,Selasa,08:00,10:00";

            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "template_import_jadwal.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            if (!dir) throw new Error('Storage directory not found');

            const fileUri = dir + "template_import_jadwal.csv";
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Info', 'Berbagi tidak tersedia');
            }
        } catch (error: any) {
            Alert.alert('Gagal', 'Tidak dapat membuat template: ' + error.message);
        }
    };

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv',
                    'text/comma-separated-values',
                    'application/csv'
                ],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const formData = new FormData();

            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            } as any);

            setLoading(true);
            const res = await client.post('/classes/import-schedules', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000 // 120 seconds
            });

            setImportResult(res.data);
            setShowImportResultModal(true);

            fetchSchedules();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Gagal mengupload file jadwal';
            Alert.alert('Gagal Import', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            let url = '/classes/export-schedules?';
            if (selectedClass) url += `classId=${selectedClass}&`;
            if (selectedDay !== null) url += `dayOfWeek=${selectedDay}&`;

            const resData = await client.get(url, { responseType: 'arraybuffer' });

            const uint8Array = new Uint8Array(resData.data);
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }

            const base64 = Platform.OS === 'web' ? window.btoa(binary) : (global as any).btoa(binary);

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            const filename = `jadwal_pelajaran_${selectedClass ? classes.find(c => c.id === selectedClass)?.name : 'semua'}.xlsx`;
            const fileUri = dir + filename;

            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Berhasil', `File disimpan di: ${fileUri}`);
            }
        } catch (error: any) {
            Alert.alert('Gagal Export', error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengekspor jadwal.');
        } finally {
            setLoading(false);
        }
    };

    const showImportOptions = () => {
        Alert.alert(
            'Kelola Jadwal',
            'Pilih aksi yang ingin dilakukan',
            [
                {
                    text: 'Import Cerdas (New)',
                    onPress: () => navigation.navigate('ImportSchedule')
                },
                { text: 'Export Jadwal (Download)', onPress: handleExportExcel },
                { text: 'Batal', style: 'cancel' }
            ]
        );
    };

    const deleteSchedule = async (scheduleId: string, subject: string) => {
        Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus jadwal "${subject}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/classes/schedules/${scheduleId}`);
                            fetchSchedules();
                            Alert.alert('Sukses', 'Jadwal berhasil dihapus');
                        } catch (e) {
                            Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus jadwal');
                        }
                    }
                }
            ]
        );
    };

    const getDayName = (day: any) => {
        const days: any = {
            0: 'Senin',
            1: 'Selasa',
            2: 'Rabu',
            3: 'Kamis',
            4: 'Jumat',
            5: 'Sabtu',
            6: 'Minggu'
        };
        return days[day] ?? day;
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.dayBadge}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <Text style={styles.dayText}>{getDayName(item.dayOfWeek)}</Text>
                </View>
                <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Mata Pelajaran:</Text>
                    <Text style={styles.infoValue}>{item.subject?.name || item.subject}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="school-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Kelas:</Text>
                    <Text style={styles.infoValue}>{item.class.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Guru:</Text>
                    <Text style={styles.infoValue}>{item.teacher.name}</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                            navigation.navigate('CreateSchedule', { schedule: item });
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteSchedule(item.id, item.subject?.name || item.subject)}
                    >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                        <Text style={styles.deleteText}>Hapus</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading && schedules.length === 0) {
        return <LoadingState message="Memuat jadwal pelajaran..." />;
    }

    if (error && schedules.length === 0) {
        return <ErrorState message={error} onRetry={fetchSchedules} />;
    }

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Jadwal Pelajaran</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={showImportOptions}
                            style={styles.addBtn}
                        >
                            <Ionicons name="cloud-upload-outline" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateSchedule')}
                            style={styles.addBtn}
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>Daftar jadwal pelajaran aktif</Text>
            </LinearGradient>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedClass && styles.filterChipActive]}
                        onPress={() => setSelectedClass(null)}
                    >
                        <Text style={[styles.filterText, !selectedClass && styles.filterTextActive]}>Semua Kelas</Text>
                    </TouchableOpacity>
                    {classes.map((cls) => (
                        <TouchableOpacity
                            key={cls.id}
                            style={[styles.filterChip, selectedClass === cls.id && styles.filterChipActive]}
                            onPress={() => setSelectedClass(cls.id)}
                        >
                            <Text style={[styles.filterText, selectedClass === cls.id && styles.filterTextActive]}>
                                {cls.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterScroll, { marginTop: spacing.sm }]}>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedDay === null && styles.filterChipActive]}
                        onPress={() => setSelectedDay(null)}
                    >
                        <Text style={[styles.filterText, selectedDay === null && styles.filterTextActive]}>Semua Hari</Text>
                    </TouchableOpacity>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[styles.filterChip, selectedDay === day && styles.filterChipActive]}
                            onPress={() => setSelectedDay(day)}
                        >
                            <Text style={[styles.filterText, selectedDay === day && styles.filterTextActive]}>
                                {getDayName(day)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={schedules}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchSchedules}
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-outline"
                        title="Belum ada jadwal"
                        message="Tambahkan jadwal pelajaran untuk memulai"
                    />
                }
            />

            {/* Import Result Modal */}
            <Modal visible={showImportResultModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Hasil Import Jadwal</Text>
                            <TouchableOpacity onPress={() => setShowImportResultModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {importResult && (
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <View style={{
                                        flex: 1, backgroundColor: colors.success + '20', margin: 5, padding: 15, borderRadius: 10, alignItems: 'center'
                                    }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success }}>{importResult.imported}</Text>
                                        <Text style={{ fontSize: 12, color: colors.text }}>Berhasil</Text>
                                    </View>
                                    <View style={{
                                        flex: 1, backgroundColor: colors.error + '20', margin: 5, padding: 15, borderRadius: 10, alignItems: 'center'
                                    }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.error }}>{importResult.failed}</Text>
                                        <Text style={{ fontSize: 12, color: colors.text }}>Gagal</Text>
                                    </View>
                                </View>

                                {importResult.failed > 0 && (
                                    <>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: colors.text }}>Detail Error:</Text>
                                        <FlatList
                                            data={importResult.errors}
                                            keyExtractor={(_, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <View style={{
                                                    backgroundColor: colors.surface,
                                                    padding: 10,
                                                    borderRadius: 8,
                                                    marginBottom: 8,
                                                    borderLeftWidth: 4,
                                                    borderLeftColor: colors.error
                                                }}>
                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>
                                                        Line {item.row?.ClassName || 'Unknown'} - {item.row?.Subject || ''}
                                                    </Text>
                                                    <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                                                        {item.error}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
                                                        Data: {JSON.stringify(item.row)}
                                                    </Text>
                                                </View>
                                            )}
                                        />
                                    </>
                                )}
                                {importResult.failed === 0 && (
                                    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                        <Ionicons name="checkmark-circle-outline" size={80} color={colors.success} />
                                        <Text style={{ marginTop: 20, fontSize: 16, color: colors.text }}>Semua jadwal berhasil diimport!</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setShowImportResultModal(false)}
                        >
                            <Text style={styles.closeBtnText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    filterContainer: {
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: 'white',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    addBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    listContent: { padding: spacing.lg, paddingBottom: 100 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    dayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text
    },
    cardBody: {
        gap: spacing.sm
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    infoLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        width: 100
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: colors.text
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        backgroundColor: colors.primaryLight,
        borderRadius: 8,
        gap: 6
    },
    editText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.primary
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        backgroundColor: colors.errorBackground,
        borderRadius: 8,
        gap: 6
    },
    deleteText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.error
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '85%',
        minHeight: 400
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text
    },
    closeBtn: {
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.md
    },
    closeBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
