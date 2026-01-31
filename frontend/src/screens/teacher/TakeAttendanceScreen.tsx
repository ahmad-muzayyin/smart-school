import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, LayoutAnimation, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, shadows, spacing, palette } from '../../theme/theme';

interface Student {
    id: string;
    classId?: string;
    name: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
}

export default function TakeAttendanceScreen({ route, navigation }: any) {
    const { scheduleId, className } = route.params || {};
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState<any>(null);

    // Journal State
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [journalTopic, setJournalTopic] = useState('');
    const [journalNotes, setJournalNotes] = useState('');
    const [submittingJournal, setSubmittingJournal] = useState(false);

    if (!scheduleId && !loading) {
        // Handle missing param gracefully
        return (
            <Screen style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.text }}>Data jadwal tidak ditemukan.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10, backgroundColor: colors.primary, borderRadius: 8 }}>
                        <Text style={{ color: 'white' }}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </Screen>
        );
    }

    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    useEffect(() => {
        if (scheduleId) {
            fetchStudents();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchStudents = async () => {
        try {
            // First, get the schedule to find the classId
            const scheduleRes = await client.get(`/classes/schedules/${scheduleId}`);
            const schedule = scheduleRes.data.data.schedule;
            setScheduleData(schedule);
            const classId = schedule.classId;

            // Then, get students for that class
            const studentsRes = await client.get(`/users/students/by-class/${classId}`);
            const studentsData = studentsRes.data.data.users;

            // Get today's date (YYYY-MM-DD format)
            const today = new Date().toISOString().split('T')[0];

            // Load existing attendance for today and this schedule
            try {
                const attendanceRes = await client.get('/attendance', {
                    params: {
                        scheduleId,
                        date: today
                    }
                });

                const attendanceRecords = attendanceRes.data.data.attendance || [];

                // Create a map of studentId -> status
                const attendanceMap = new Map();
                attendanceRecords.forEach((record: any) => {
                    attendanceMap.set(record.studentId, record.status);
                });

                // Merge students with their attendance status
                const studentsWithStatus = studentsData.map((s: any) => ({
                    ...s,
                    status: attendanceMap.get(s.id) || null
                }));

                setStudents(studentsWithStatus);
            } catch (attendanceError) {
                // If no attendance found, just set students with null status
                console.log('No existing attendance found');
                setStudents(studentsData.map((s: any) => ({ ...s, status: null })));
            }
        } catch (error: any) {
            console.error('Error fetching students:', error);
            Alert.alert('Gagal', error.response?.data?.message || 'Gagal memuat data siswa');
        } finally {
            setLoading(false);
        }
    };

    const submitStatus = async (studentId: string, status: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        // Optimistic update
        setStudents(curr => curr.map(s => s.id === studentId ? { ...s, status: status as any } : s));

        try {
            const payload = {
                scheduleId,
                studentId,
                date: new Date().toISOString(),
                status
            };

            await client.post('/attendance', payload);

            // Silent success for smoother UX, or use a Toast if available
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Gagal menyimpan data presensi. Periksa koneksi internet Anda.';
            Alert.alert('Gagal Presensi', errorMessage);

            // Revert optimistic update on error
            setStudents(curr => curr.map(s => s.id === studentId ? { ...s, status: null } : s));
        }
    };

    const StatusButton = ({ label, active, color, onPress, icon }: any) => (
        <TouchableOpacity
            style={[
                styles.statusBtn,
                active
                    ? { backgroundColor: color, borderColor: color, elevation: 2 }
                    : { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {active ? (
                <Ionicons name={icon} size={20} color="white" />
            ) : (
                <Text style={[styles.statusBtnText, { color: colors.textSecondary }]}>{label}</Text>
            )}
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: Student }) => {
        const getCardBackground = () => {
            switch (item.status) {
                case 'PRESENT': return colors.successBackground || '#ECFDF5';
                case 'EXCUSED': return '#EFF6FF'; // Light Blue
                case 'LATE': return colors.warningBackground || '#FFFBEB';
                case 'ABSENT': return colors.errorBackground || '#FEF2F2';
                default: return colors.surface;
            }
        };

        return (
            <View style={[styles.card,
            {
                borderLeftColor: item.status === 'PRESENT' ? colors.success :
                    item.status === 'EXCUSED' ? colors.info :
                        item.status === 'LATE' ? colors.warning :
                            item.status === 'ABSENT' ? colors.error : 'transparent',
                borderLeftWidth: item.status ? 4 : 0,
                backgroundColor: getCardBackground()
            }
            ]}>
                <View style={styles.cardContent}>
                    <View style={styles.studentHeader}>
                        <View style={[styles.avatar, item.status ? { borderColor: 'transparent', backgroundColor: 'white' } : {}]}>
                            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.idText}>NIS: {item.id.substring(0, 8).toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <StatusButton label="H" icon={item.status === 'PRESENT' ? "checkmark-circle" : "checkmark-circle-outline"} active={item.status === 'PRESENT'} color={colors.success} onPress={() => submitStatus(item.id, 'PRESENT')} />
                        <StatusButton label="I" icon={item.status === 'EXCUSED' ? "document-text" : "document-text-outline"} active={item.status === 'EXCUSED'} color={colors.info} onPress={() => submitStatus(item.id, 'EXCUSED')} />
                        <StatusButton label="T" icon={item.status === 'LATE' ? "time" : "time-outline"} active={item.status === 'LATE'} color={colors.warning} onPress={() => submitStatus(item.id, 'LATE')} />
                        <StatusButton label="A" icon={item.status === 'ABSENT' ? "close-circle" : "close-circle-outline"} active={item.status === 'ABSENT'} color={colors.error} onPress={() => submitStatus(item.id, 'ABSENT')} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[palette.brandBlue, palette.brandBlueSoft]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerClassName}>{className}</Text>
                        <Text style={styles.headerSubtitle}>Presensi Harian</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={() => setShowJournalModal(true)}
                        >
                            <Ionicons name="book-outline" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={() => navigation.navigate('ScanAttendance', {
                                scheduleId,
                                classId: students[0]?.classId
                            })}
                        >
                            <Ionicons name="qr-code-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.summaryBar}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {(students || []).filter(s => s.status === 'PRESENT').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Hadir</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {(students || []).filter(s => s.status === 'EXCUSED').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Izin</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {(students || []).filter(s => s.status === 'ABSENT').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Absen</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {(students || []).filter(s => s.status === null).length}
                        </Text>
                        <Text style={styles.summaryLabel}>Belum</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={students}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.dateText}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                }
            />
            {/* Journal Modal */}
            <Modal
                visible={showJournalModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowJournalModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Jurnal Kelas</Text>
                                <TouchableOpacity onPress={() => setShowJournalModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ marginBottom: 20 }}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Mata Pelajaran</Text>
                                    <View style={styles.disabledInput}>
                                        <Text style={{ color: colors.text }}>{scheduleData?.subject || '-'}</Text>
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Materi Pembelajaran <Text style={{ color: 'red' }}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Contoh: Operasi Bilangan Bulat"
                                        value={journalTopic}
                                        onChangeText={setJournalTopic}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Catatan / Kendala</Text>
                                    <TextInput
                                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                        placeholder="Catatan tambahan..."
                                        value={journalNotes}
                                        onChangeText={setJournalNotes}
                                        multiline
                                    />
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.submitBtn, submittingJournal && { opacity: 0.7 }]}
                                onPress={async () => {
                                    if (!journalTopic.trim()) {
                                        Alert.alert('Eror', 'Materi pembelajaran wajib diisi');
                                        return;
                                    }

                                    try {
                                        setSubmittingJournal(true);
                                        const today = new Date().toISOString().split('T')[0];

                                        await client.post('/journals', {
                                            classId: scheduleData.classId,
                                            scheduleId: scheduleId,
                                            subject: scheduleData.subject,
                                            date: today,
                                            topic: journalTopic,
                                            notes: journalNotes
                                        });

                                        Alert.alert('Sukses', 'Jurnal kelas berhasil disimpan');
                                        setShowJournalModal(false);
                                        setJournalTopic('');
                                        setJournalNotes('');
                                    } catch (error: any) {
                                        console.error('Journal Error:', error);
                                        Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan jurnal');
                                    } finally {
                                        setSubmittingJournal(false);
                                    }
                                }}
                                disabled={submittingJournal}
                            >
                                {submittingJournal ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Simpan Jurnal</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    scanBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitleContainer: { alignItems: 'center' },
    headerClassName: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    summaryBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between'
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
    divider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.3)' },

    list: { padding: spacing.lg, paddingBottom: 100 },
    listHeader: { marginBottom: spacing.md },
    dateText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },

    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        ...shadows.sm,
        overflow: 'hidden'
    },
    cardContent: {
        padding: 16,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    nameContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border
    },
    avatarText: { fontWeight: 'bold', color: colors.textSecondary, fontSize: 18 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    idText: { fontSize: 12, color: colors.textSecondary },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8
    },
    statusBtn: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center', justifyContent: 'center'
    },
    statusBtnText: { fontSize: 16, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    formGroup: { marginBottom: spacing.md },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.textSecondary },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.surface
    },
    disabledInput: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: 0.7
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        ...shadows.md
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
