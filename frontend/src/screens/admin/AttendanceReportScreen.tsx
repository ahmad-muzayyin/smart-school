import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, layout, spacing } from '../../theme/theme';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function AttendanceReportScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filter states
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]); // New state
    const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null); // New state
    const [showFilterModal, setShowFilterModal] = useState(false); // Renamed for generality

    const fetchFilters = async () => {
        try {
            const [classRes, subjectRes] = await Promise.all([
                client.get('/classes'),
                client.get('/subjects')
            ]);
            setClasses(classRes.data.data.classes);
            setSubjects(subjectRes.data.data.subjects);
        } catch (e) {
            console.error('Failed to fetch filter options', e);
        }
    };

    React.useEffect(() => {
        fetchFilters();
    }, []);

    const fetchAttendanceReport = async (date: Date) => {
        setLoading(true);
        setError(null);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await client.get(`/attendance?date=${dateStr}`);
            const history = res.data.data.history || res.data.data.attendance || [];
            setAttendanceData(Array.isArray(history) ? history : []);
        } catch (err: any) {
            setError('Gagal memuat laporan presensi');
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAttendanceReport(selectedDate);
    }, [selectedDate, selectedClassFilter, selectedSubjectFilter]);

    const handleExportAttendance = async () => {
        try {
            setLoading(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            let url = `/attendance/export?date=${dateStr}`;

            if (selectedClassFilter) url += `&classId=${selectedClassFilter}`;
            if (selectedSubjectFilter) {
                const subjectName = subjects.find(s => s.id === selectedSubjectFilter)?.name;
                if (subjectName) url += `&subjectName=${encodeURIComponent(subjectName)}`;
            }

            const resData = await client.get(url, { responseType: 'arraybuffer' });

            const uint8Array = new Uint8Array(resData.data);
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = (global as any).btoa ? (global as any).btoa(binary) : binary;

            const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            const filename = `Laporan_Absensi_${dateStr}.xlsx`;
            const fileUri = dir + filename;

            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Berhasil', `Laporan disimpan di: ${fileUri}`);
            }
        } catch (error: any) {
            console.error('Export Error:', error);
            Alert.alert('Gagal Export', 'Terjadi kesalahan saat mengekspor laporan absensi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return colors.success;
            case 'LATE': return colors.warning;
            case 'ABSENT': return colors.error;
            case 'EXCUSED': return '#6B7280';
            default: return colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'Hadir';
            case 'LATE': return 'Terlambat';
            case 'ABSENT': return 'Tidak Hadir';
            case 'EXCUSED': return 'Izin';
            default: return status;
        }
    };

    const renderItem = ({ item }: any) => {
        const initials = item?.student?.name ? item.student.name.substring(0, 2).toUpperCase() : '??';
        const color = getStatusColor(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardInner}>
                    <View style={[styles.avatarBox, { backgroundColor: color + '15' }]}>
                        <Text style={[styles.avatarText, { color: color }]}>{initials}</Text>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.rowTop}>
                            <Text style={styles.studentName} numberOfLines={1}>
                                {item?.student?.name || 'Unknown'}
                            </Text>
                            <View style={[styles.statusPill, { backgroundColor: color + '10', borderColor: color + '30' }]}>
                                <Text style={[styles.statusText, { color: color }]}>
                                    {getStatusLabel(item.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.rowBelow}>
                            {item?.student?.class?.name && (
                                <Text style={styles.metaText}>
                                    {item.student.class.name} •
                                </Text>
                            )}
                            <Text style={[styles.metaText, { flex: 1, marginLeft: 4 }]} numberOfLines={1}>
                                {item?.schedule?.subject || 'Unknown Subject'}
                            </Text>
                        </View>

                        {item.notes && (
                            <View style={styles.notesBox}>
                                <Ionicons name="chatbox-ellipses-outline" size={12} color="#94A3B8" style={{ marginTop: 2, marginRight: 6 }} />
                                <Text style={styles.notesText}>{item.notes}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const filteredData = attendanceData.filter(item => {
        // Filter Class
        const studentClassId = item.student?.classId || item.student?.class?.id;
        const matchesClass = !selectedClassFilter || String(studentClassId) === String(selectedClassFilter);

        // Filter Subject
        const subjectId = item.schedule?.subject?.id;
        const matchesSubject = !selectedSubjectFilter || (item?.schedule?.subject?.name === selectedSubjectFilter); // Using name matching if ID not consistent, or adjust based on API

        // Note: API returns subject name in schedule.subject, let's assume filtering by name for now or match ID if available
        // Ideally checking item.schedule.subjectId vs selectedSubjectFilter
        // Let's check what 'subjects' state has. Assuming subjects have ids.
        // Let's try to match subject name for now since item.schedule.subject is a string name in previous lines?
        // Wait, look at line 115: item?.schedule?.subject || 'Unknown Subject' 
        // If subject is just a string, we match string. If it's object, we match ID.
        // Checking backend service... 'schedule: { select: { subject: true } }' usually returns object if subject is relation, or if it's just name? 
        // In previous `renderItem` it used `item.schedule.subject`.
        // Let's safely match:
        const itemSubjectName = typeof item.schedule?.subject === 'object' ? item.schedule.subject.name : item.schedule?.subject;
        const selectedSubjectName = subjects.find(s => s.id === selectedSubjectFilter)?.name;

        const isSubjectMatch = !selectedSubjectFilter || (itemSubjectName === selectedSubjectName);

        return matchesClass && isSubjectMatch;
    });

    if (loading && attendanceData.length === 0) {
        return <LoadingState message="Memuat laporan presensi..." />;
    }

    if (error && attendanceData.length === 0) {
        return <ErrorState message={error} onRetry={() => fetchAttendanceReport(selectedDate)} />;
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
                    <Text style={styles.headerTitle}>Laporan Presensi</Text>
                    <TouchableOpacity onPress={handleExportAttendance} style={styles.backBtn}>
                        <Ionicons name="download-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.dateSelector, { flex: 1, marginRight: 10 }]} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.dateText}>
                            {selectedDate.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, (selectedClassFilter || selectedSubjectFilter) ? { backgroundColor: 'white' } : { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name={(selectedClassFilter || selectedSubjectFilter) ? "filter" : "filter-outline"} size={22} color={(selectedClassFilter || selectedSubjectFilter) ? colors.primary : "white"} />
                    </TouchableOpacity>
                </View>

                {(selectedClassFilter || selectedSubjectFilter) && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                        {selectedClassFilter && (
                            <TouchableOpacity
                                onPress={() => setSelectedClassFilter(null)}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                            >
                                <Text style={{ color: 'white', fontSize: 12, marginRight: 6 }}>
                                    {classes.find(c => String(c.id) === String(selectedClassFilter))?.name}
                                </Text>
                                <Ionicons name="close-circle" size={16} color="white" />
                            </TouchableOpacity>
                        )}
                        {selectedSubjectFilter && (
                            <TouchableOpacity
                                onPress={() => setSelectedSubjectFilter(null)}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                            >
                                <Text style={{ color: 'white', fontSize: 12, marginRight: 6 }}>
                                    {subjects.find(s => s.id === selectedSubjectFilter)?.name}
                                </Text>
                                <Ionicons name="close-circle" size={16} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </LinearGradient>

            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={() => fetchAttendanceReport(selectedDate)}
                ListEmptyComponent={
                    <EmptyState
                        icon="document-text-outline"
                        title="Tidak ada data presensi"
                        message={selectedClassFilter ? "Tidak ada presensi untuk kelas ini" : "Belum ada presensi yang tercatat untuk tanggal ini"}
                    />
                }
            />

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Laporan</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.sectionTitle}>Kelas</Text>
                            <View style={styles.filterOptionsContainer}>
                                <TouchableOpacity
                                    style={[styles.filterChip, !selectedClassFilter && styles.filterChipActive]}
                                    onPress={() => setSelectedClassFilter(null)}
                                >
                                    <Text style={[styles.filterChipText, !selectedClassFilter && styles.filterChipTextActive]}>Semua</Text>
                                </TouchableOpacity>
                                {classes.map(cls => (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[styles.filterChip, selectedClassFilter === cls.id && styles.filterChipActive]}
                                        onPress={() => setSelectedClassFilter(cls.id === selectedClassFilter ? null : cls.id)}
                                    >
                                        <Text style={[styles.filterChipText, selectedClassFilter === cls.id && styles.filterChipTextActive]}>{cls.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mata Pelajaran</Text>
                            <View style={styles.filterOptionsContainer}>
                                <TouchableOpacity
                                    style={[styles.filterChip, !selectedSubjectFilter && styles.filterChipActive]}
                                    onPress={() => setSelectedSubjectFilter(null)}
                                >
                                    <Text style={[styles.filterChipText, !selectedSubjectFilter && styles.filterChipTextActive]}>Semua</Text>
                                </TouchableOpacity>
                                {subjects.map(subj => (
                                    <TouchableOpacity
                                        key={subj.id}
                                        style={[styles.filterChip, selectedSubjectFilter === subj.id && styles.filterChipActive]}
                                        onPress={() => setSelectedSubjectFilter(subj.id === selectedSubjectFilter ? null : subj.id)}
                                    >
                                        <Text style={[styles.filterChipText, selectedSubjectFilter === subj.id && styles.filterChipTextActive]}>{subj.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    dateText: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardInner: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatarBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '700',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        marginRight: 8,
    },
    rowBelow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    notesBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    notesText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        flex: 1,
        lineHeight: 16,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemText: {
        fontSize: 16,
        color: '#334155',
        marginLeft: 16,
        flex: 1,
        fontWeight: '600',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 8,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: 'white',
        fontWeight: '600',
    },
});
