import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, shadows, spacing, getThemeColors } from '../../theme/theme';
import client from '../../api/client';
import { useThemeStore } from '../../store/useThemeStore';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (spacing.xl * 2) - (spacing.md * 2)) / 3;

export default function TeacherDashboard({ navigation }: any) {
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [stats, setStats] = useState({ activeClasses: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todaySchedules, setTodaySchedules] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchTodaySchedules();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const schedules = res.data.data.schedules;

            const uniqueClasses = new Set(schedules.map((s: any) => s.classId));
            // Count unique students across all classes
            const uniqueStudentIds = new Set();
            schedules.forEach((s: any) => {
                s.class?.students?.forEach((student: any) => {
                    uniqueStudentIds.add(student.id);
                });
            });

            setStats({
                activeClasses: uniqueClasses.size,
                totalStudents: uniqueStudentIds.size
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodaySchedules = async () => {
        try {
            const dayOfWeek = new Date().getDay();
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const res = await client.get(`/classes/schedules?dayOfWeek=${adjustedDay}`);
            setTodaySchedules(res.data.data.schedules || []);
        } catch (error) {
            console.error('Failed to fetch today schedules:', error);
        }
    };

    const getDayName = () => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[currentTime.getDay()];
    };

    const getFormattedDate = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    };

    const getFormattedTime = () => {
        return currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const MenuItem = ({ icon, label, color, bg, onPress }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: isDarkMode ? colors.surface : bg }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]} safeArea={false}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoHex}>
                            <Ionicons name="cube" size={32} color="#0EA5E9" />
                        </View>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.profileTextContainer}>
                            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Guru'}</Text>
                            <Text style={[styles.institution, { color: defaultColors.primary, fontWeight: '700', marginBottom: 2 }]}>
                                {user?.tenant?.name || 'Sekolah'}
                            </Text>
                            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                                {user?.subjects && user.subjects.length > 0
                                    ? `Guru ${user.subjects.map((s: any) => s.name).join(', ')}`
                                    : 'Guru Mata Pelajaran'}
                            </Text>
                            <View style={[styles.studentsBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                <Ionicons name="people" size={12} color={colors.primary} />
                                <Text style={[styles.studentsBadgeText, { color: colors.text }]}>{stats.totalStudents} Siswa</Text>
                            </View>
                        </View>
                        <View style={[styles.avatar, { borderColor: colors.border }]}>
                            <Image
                                source={{ uri: 'https://ui-avatars.com/api/?name=Zufar+Rakasiwa&background=random' }}
                                style={styles.avatarImage}
                            />
                        </View>
                    </View>
                </View>

                {/* 2. Modern Stats Card */}
                <View style={styles.statsCardContainer}>
                    <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCardGradient}
                    >
                        <View style={styles.statsPatternCircle} />
                        <View style={styles.statsPatternCircle2} />

                        <View style={styles.statsRow}>
                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: colors.surface }]}>
                                    <Ionicons name="easel" size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{stats.activeClasses}</Text>
                                    <Text style={styles.statLabel}>Kelas Aktif</Text>
                                </View>
                            </View>

                            <View style={styles.verticalDivider} />

                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: colors.surface }]}>
                                    <Ionicons name="people" size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                                    <Text style={styles.statLabel}>Total Siswa</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Date & Time Card */}
                <View style={[styles.dateTimeCard, { backgroundColor: colors.surface }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={[styles.dayText, { color: colors.text }]}>{getDayName()}</Text>
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{getFormattedDate()}</Text>
                        </View>
                        <View style={[styles.timeContainer, { backgroundColor: defaultColors.primaryLight }]}>
                            <Ionicons name="time-outline" size={20} color={defaultColors.primary} />
                            <Text style={[styles.timeText, { color: defaultColors.primary }]}>{getFormattedTime()}</Text>
                        </View>
                    </View>
                </View>

                {/* Today's My Schedules */}
                {todaySchedules.length > 0 && (
                    <View style={styles.schedulesSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Jadwal Mengajar Hari Ini</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TeacherSchedule')}>
                                <Text style={{ color: defaultColors.primary, fontSize: 12, fontWeight: '600' }}>Lihat Semua</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }}>
                            <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', gap: spacing.sm }}>
                                {todaySchedules.slice(0, 5).map((schedule: any, index: number) => (
                                    <TouchableOpacity
                                        key={schedule.id || index}
                                        style={[styles.scheduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={() => navigation.navigate('TakeAttendance', { scheduleId: schedule.id })}
                                    >
                                        <View style={[styles.scheduleTime, { backgroundColor: defaultColors.primaryLight }]}>
                                            <Text style={[styles.scheduleTimeText, { color: defaultColors.primary }]}>
                                                {schedule.startTime} - {schedule.endTime}
                                            </Text>
                                        </View>
                                        <Text style={[styles.scheduleSubject, { color: colors.text }]} numberOfLines={1}>
                                            {schedule.subject}
                                        </Text>
                                        <Text style={[styles.scheduleClass, { color: colors.textSecondary }]} numberOfLines={1}>
                                            Kelas {schedule.class?.name || '-'}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.attendanceBtn, { backgroundColor: defaultColors.primary }]}
                                            onPress={() => navigation.navigate('TakeAttendance', { scheduleId: schedule.id })}
                                        >
                                            <Ionicons name="checkmark-circle" size={14} color="white" />
                                            <Text style={styles.attendanceBtnText}>Isi Presensi</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* 3. Grid Menu */}
                <View style={styles.gridContainer}>
                    {/* Row 1 */}
                    <MenuItem
                        icon="today"
                        label="Jadwal"
                        color="#EC4899"
                        bg="#FCE7F3"
                        onPress={() => navigation.navigate('Jadwal')}
                    />
                    <MenuItem
                        icon="calendar"
                        label="Presensi"
                        color="#0EA5E9"
                        bg="#E0F2FE"
                        onPress={() => navigation.navigate('Jadwal')}
                    />
                    <MenuItem
                        icon="document-text"
                        label="Nilai"
                        color="#F97316"
                        bg="#FFEDD5"
                        onPress={() => navigation.navigate('TeacherGrades')}
                    />

                    {/* Row 2 */}
                    <MenuItem
                        icon="book"
                        label="Bahan Ajar"
                        color="#EF4444"
                        bg="#FEE2E2"
                        onPress={() => navigation.navigate('TeachingMaterials')}
                    />
                    <MenuItem
                        icon="people"
                        label="Data Siswa"
                        color="#10B981"
                        bg="#D1FAE5"
                        onPress={() => navigation.navigate('TeacherStudents')}
                    />
                    <MenuItem
                        icon="school"
                        label="Kelas"
                        color="#3B82F6"
                        bg="#DBEAFE"
                        onPress={() => navigation.navigate('TeacherClasses')}
                    />

                    {/* Row 3 */}
                    <MenuItem
                        icon="trophy"
                        label="Kegiatan"
                        color="#84CC16"
                        bg="#ECFCCB"
                        onPress={() => alert('Fitur Kegiatan akan segera hadir')}
                    />
                    <MenuItem
                        icon="wallet"
                        label="Honorarium"
                        color="#8B5CF6"
                        bg="#EDE9FE"
                        onPress={() => alert('Fitur Honorarium akan segera hadir')}
                    />
                    <MenuItem
                        icon="chatbubbles"
                        label="Bantuan"
                        color="#F59E0B"
                        bg="#FEF3C7"
                        onPress={() => alert('Fitur Bantuan akan segera hadir')}
                    />
                </View>

            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        // backgroundColor handled dynamically
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: 140, // Increased to prevent bottom nav overlap
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    logoContainer: {
        justifyContent: 'center',
        paddingTop: 4,
    },
    logoHex: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileTextContainer: {
        alignItems: 'flex-end',
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    profileRole: {
        fontSize: 12,
        textAlign: 'right',
        marginBottom: 2,
    },
    institution: {
        fontSize: 10,
        textAlign: 'right',
        opacity: 0.8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    studentsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4
    },
    studentsBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },

    // Modern Stats Card
    statsCardContainer: {
        marginBottom: spacing.xl,
        borderRadius: 20,
        ...shadows.md,
    },
    statsCardGradient: {
        borderRadius: 20,
        padding: spacing.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    statsPatternCircle: {
        position: 'absolute',
        top: -20,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statsPatternCircle2: {
        position: 'absolute',
        bottom: -30,
        right: -10,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        justifyContent: 'center',
    },
    statIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 28,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    verticalDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 10,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: spacing.md,
    },
    menuItem: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        gap: 8,
    },
    menuIconContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    menuLabel: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 14,
    },

    // Date & Time Card
    dateTimeCard: {
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    dayText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 14,
        marginTop: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Today's Schedules
    schedulesSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    scheduleCard: {
        width: 160,
        borderRadius: 12,
        padding: spacing.sm,
        borderWidth: 1,
        ...shadows.sm,
    },
    scheduleTime: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: spacing.xs,
    },
    scheduleTimeText: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    scheduleSubject: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    scheduleClass: {
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    attendanceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    attendanceBtnText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
});
