import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { Screen } from '../../components/ui/Screen';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { colors as defaultColors, layout, shadows, spacing, getThemeColors } from '../../theme/theme';
import client from '../../api/client';
import { Button } from '../../components/ui/Button';
import { useThemeStore } from '../../store/useThemeStore';

const { width } = Dimensions.get('window');

export default function StudentDashboard({ navigation }: any) {
    const { user, logout } = useAuthStore();
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    const [className, setClassName] = useState(user?.className || user?.class?.name || '-');

    useEffect(() => {
        if ((!user?.className && !user?.class?.name) && user?.classId) {
            client.get(`/classes/${user.classId}`)
                .then(res => setClassName(res.data.data.class.name))
                .catch(err => console.log('Failed to fetch class name:', err));
        }
    }, [user]);

    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    useEffect(() => {
        console.log('User Data in Dashboard:', JSON.stringify(user, null, 2));
        fetchAttendanceHistory();
    }, []);

    const fetchAttendanceHistory = async () => {
        setLoading(true);
        try {
            const res = await client.get('/attendance');
            const history = res.data.data.attendance || [];
            setAttendanceHistory(history);

            // Calculate stats
            const present = history.filter((a: any) => a.status === 'PRESENT').length;
            const absent = history.filter((a: any) => a.status === 'ABSENT').length;
            const late = history.filter((a: any) => a.status === 'LATE').length;
            const excused = history.filter((a: any) => a.status === 'EXCUSED').length;

            setStats({
                present,
                absent,
                late,
                excused,
                total: history.length
            });
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
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

    const renderAttendanceItem = ({ item }: any) => (
        <View style={[styles.attendanceCard, { backgroundColor: colors.surface }]}>
            <View style={styles.attendanceHeader}>
                <Text style={[styles.subjectName, { color: colors.text }]}>{item.schedule.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
            <Text style={[styles.attendanceDate, { color: colors.textSecondary }]}>
                {new Date(item.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}
            </Text>
        </View>
    );

    if (loading) {
        return <LoadingState message="Memuat data..." />;
    }

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]} safeArea={false}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>{user?.tenant?.name || 'Sekolah'}</Text>
                        <Text style={styles.studentName}>{user?.name}</Text>
                        <Text style={styles.studentClass}>Kelas {className}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Menu */}
                <View style={[styles.menuContainer, { marginBottom: spacing.lg }]}>
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('StudentMaterials')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="book" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Materi & Tugas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('StudentPermission')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#F59E0B20' }]}>
                            <Ionicons name="hand-right" size={24} color="#F59E0B" />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Izin/Sakit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('StudentSchedule')} // Future feature
                    >
                        <View style={[styles.menuIcon, { backgroundColor: colors.textSecondary + '20' }]}>
                            <Ionicons name="calendar" size={24} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.text }]}>Jadwal</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderTopColor: colors.success }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.present}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hadir</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderTopColor: colors.warning }]}>
                        <Ionicons name="time" size={24} color={colors.warning} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.late}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Terlambat</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderTopColor: colors.error }]}>
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.absent}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absen</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderTopColor: '#6B7280' }]}>
                        <Ionicons name="flag" size={24} color="#6B7280" />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.excused}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Izin</Text>
                    </View>
                </View>

                {/* Attendance History */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Riwayat Presensi</Text>
                    {attendanceHistory.length === 0 ? (
                        <EmptyState
                            icon="calendar-outline"
                            title="Belum ada riwayat presensi"
                            message="Riwayat presensi Anda akan muncul di sini"
                        />
                    ) : (
                        <FlatList
                            data={attendanceHistory}
                            renderItem={renderAttendanceItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil</Text>
                    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.profileItem}>
                            <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>Email</Text>
                            <Text style={[styles.profileValue, { color: colors.text }]}>{user?.email}</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>NIS</Text>
                            <Text style={[styles.profileValue, { color: colors.text }]}>{user?.id.substring(0, 8)}</Text>
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <Button
                        label="Keluar"
                        onPress={logout}
                        variant="danger"
                        icon={<Ionicons name="log-out-outline" size={20} color="white" />}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: Platform.OS === 'android' ? 70 : 60, // Safe area
        paddingBottom: 30,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
    studentName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    studentClass: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
    avatar: {
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white'
    },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },

    content: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },

    menuContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4, // Reduce native margin
        justifyContent: 'space-between',
        marginBottom: spacing.md
    },
    menuItem: {
        width: (Dimensions.get('window').width - 48 - 24) / 3, // 3 Columns
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: 'white', // Default surface
        borderRadius: 16,
        ...shadows.sm,
        elevation: 2
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    menuText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: '#1F2937' // Default text
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Spread evenly
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1, // Distribute equal width
        marginHorizontal: 4, // Small gap
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 2, // Minimal horizontal padding
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
        borderTopWidth: 3, // Change to top border for compact vertical layout
        borderLeftWidth: 0, // Remove side border
        elevation: 2,
        height: 80
    },
    statNumber: { fontSize: 16, fontWeight: 'bold', marginTop: 4, color: defaultColors.text },
    statLabel: { fontSize: 10, marginTop: 2, color: defaultColors.textSecondary },

    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md },

    attendanceCard: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    subjectName: { fontSize: 16, fontWeight: '600' },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    attendanceDate: { fontSize: 13 },

    profileCard: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        ...shadows.sm
    },
    profileItem: { marginBottom: spacing.md },
    profileLabel: { fontSize: 12, marginBottom: 4 },
    profileValue: { fontSize: 16, fontWeight: '500' },

    logoutContainer: { marginTop: spacing.lg }
});
