import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
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
            const classId = scheduleRes.data.data.schedule.classId;

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
        // Optimistic update
        setStudents(curr => curr.map(s => s.id === studentId ? { ...s, status: status as any } : s));

        try {
            const payload = {
                scheduleId,
                studentId,
                date: new Date().toISOString(),
                status
            };

            console.log('Submitting attendance:', payload);

            const response = await client.post('/attendance', payload);

            console.log('Attendance saved successfully:', response.data);

            // Optional: Show success feedback
            // Alert.alert('Berhasil', 'Presensi tersimpan');
        } catch (error: any) {
            console.error('Error saving attendance:', error.response?.data || error.message);
            Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan presensi');

            // Revert optimistic update on error
            setStudents(curr => curr.map(s => s.id === studentId ? { ...s, status: null } : s));
        }
    };

    const StatusButton = ({ label, active, color, onPress, icon }: any) => (
        <TouchableOpacity
            style={[
                styles.statusBtn,
                active && { backgroundColor: color, borderColor: color },
                !active && { borderColor: colors.border }
            ]}
            onPress={onPress}
        >
            {active ? (
                <Ionicons name={icon} size={16} color="white" />
            ) : (
                <Text style={styles.statusBtnText}>{label}</Text>
            )}
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: Student }) => (
        <View style={styles.card}>
            <View style={styles.studentInfo}>
                <View style={[styles.avatar, item.status === 'PRESENT' && { borderColor: colors.success }]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                    {item.status && (
                        <View style={[styles.statusDot,
                        item.status === 'PRESENT' && { backgroundColor: colors.success },
                        item.status === 'LATE' && { backgroundColor: colors.warning },
                        item.status === 'ABSENT' && { backgroundColor: colors.error },
                        ]} />
                    )}
                </View>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.idText}>NIS: {item.id.substring(0, 6)}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <StatusButton
                    label="H"
                    icon="checkmark"
                    active={item.status === 'PRESENT'}
                    color={colors.success}
                    onPress={() => submitStatus(item.id, 'PRESENT')}
                />
                <StatusButton
                    label="T"
                    icon="time"
                    active={item.status === 'LATE'}
                    color={colors.warning}
                    onPress={() => submitStatus(item.id, 'LATE')}
                />
                <StatusButton
                    label="A"
                    icon="close"
                    active={item.status === 'ABSENT'}
                    color={colors.error}
                    onPress={() => submitStatus(item.id, 'ABSENT')}
                />
            </View>
        </View>
    );

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
                    <TouchableOpacity
                        style={styles.scanBtn}
                        onPress={() => navigation.navigate('ScanAttendance', {
                            scheduleId,
                            classId: students[0]?.classId // Fallback if needed, but ScanAttendance mainly uses scheduleId
                        })}
                    >
                        <Ionicons name="qr-code-outline" size={20} color="white" />
                    </TouchableOpacity>
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
        padding: spacing.md,
        borderRadius: layout.borderRadius.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.sm
    },
    studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
        borderWidth: 2, borderColor: colors.border
    },
    avatarText: { fontWeight: 'bold', color: colors.textSecondary, fontSize: 16 },
    statusDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 12, height: 12, borderRadius: 6,
        borderWidth: 2, borderColor: 'white'
    },
    name: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
    idText: { fontSize: 10, color: colors.textSecondary },

    actions: { flexDirection: 'row', gap: 8 },
    statusBtn: {
        width: 36, height: 36, borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center', justifyContent: 'center'
    },
    statusBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary }
});
