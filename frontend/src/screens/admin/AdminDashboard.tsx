import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, shadows, spacing, getThemeColors } from '../../theme/theme';
import client from '../../api/client';
import { useThemeStore } from '../../store/useThemeStore';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (spacing.xl * 2) - (spacing.md * 2)) / 3;

export default function AdminDashboard({ navigation }: any) {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [stats, setStats] = useState({ teacherCount: 0, studentCount: 0 });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todaySchedules, setTodaySchedules] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            fetchTodaySchedules();
        }, [])
    );

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStats = async () => {
        try {
            const [teachersRes, studentsRes] = await Promise.all([
                client.get('/users/teachers'),
                client.get('/users/students')
            ]);
            setStats({
                teacherCount: teachersRes.data.data.users.length,
                studentCount: studentsRes.data.data.users.length
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
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoHex}>
                            <Ionicons name="cube" size={32} color="#0EA5E9" />
                        </View>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.profileTextContainer}>
                            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Admin'}</Text>
                            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>{t('dashboard.adminDashboard')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.institution, { color: colors.textSecondary }]}>{user?.tenant?.name || 'Sekolah'}</Text>
                                <View style={{
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                    backgroundColor: (user?.tenant?.isActive === false) ? '#FEE2E2' : '#D1FAE5',
                                    borderWidth: 1,
                                    borderColor: (user?.tenant?.isActive === false) ? '#EF4444' : '#10B981',
                                }}>
                                    <Text style={{
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        color: (user?.tenant?.isActive === false) ? '#B91C1C' : '#047857'
                                    }}>
                                        {(user?.tenant?.isActive === false) ? 'NONAKTIF' : 'AKTIF'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.avatar, { borderColor: colors.border }]}>
                            <Image
                                source={{ uri: 'https://ui-avatars.com/api/?name=Admin+Sekolah&background=random' }}
                                style={styles.avatarImage}
                            />
                        </View>
                    </View>
                </View>

                {/* Stats Card */}
                {/* Modern Stats Card */}
                <View style={styles.statsCardContainer}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCardGradient}
                    >
                        <View style={styles.statsPatternCircle} />
                        <View style={styles.statsPatternCircle2} />

                        <View style={styles.statsRow}>
                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: colors.surface }]}>
                                    <Ionicons name="people" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{stats.teacherCount}</Text>
                                    <Text style={styles.statLabel}>{t('dashboard.teachers')}</Text>
                                </View>
                            </View>

                            <View style={styles.verticalDivider} />

                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: colors.surface }]}>
                                    <Ionicons name="people-circle" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{stats.studentCount}</Text>
                                    <Text style={styles.statLabel}>{t('dashboard.students')}</Text>
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

                {/* Grid Menu */}
                <View style={styles.gridContainer}>
                    {/* Row 1 */}
                    <MenuItem
                        icon="people"
                        label={t('dashboard.teachers')}
                        color="#EC4899"
                        bg="#FCE7F3"
                        onPress={() => navigation.navigate('ManageUsers', { role: 'TEACHER' })}
                    />
                    <MenuItem
                        icon="people-circle"
                        label={t('dashboard.students')}
                        color="#0EA5E9"
                        bg="#E0F2FE"
                        onPress={() => navigation.navigate('ManageUsers', { role: 'STUDENT' })}
                    />
                    <MenuItem
                        icon="school"
                        label={t('dashboard.classes')}
                        color="#F97316"
                        bg="#FFEDD5"
                        onPress={() => navigation.navigate('ManageClasses')}
                    />

                    {/* Row 2 */}
                    <MenuItem
                        icon="calendar"
                        label={t('dashboard.schedules')}
                        color="#EF4444"
                        bg="#FEE2E2"
                        onPress={() => navigation.navigate('ViewSchedules')}
                    />
                    <MenuItem
                        icon="book"
                        label={t('dashboard.subjects')}
                        color="#10B981"
                        bg="#D1FAE5"
                        onPress={() => navigation.navigate('ManageSubjects')}
                    />
                    <MenuItem
                        icon="stats-chart"
                        label={t('dashboard.reports')}
                        color="#3B82F6"
                        bg="#DBEAFE"
                        onPress={() => navigation.navigate('AttendanceReport')}
                    />


                    {/* Row 3 */}
                    <MenuItem
                        icon="notifications"
                        label={t('dashboard.announcements')}
                        color="#84CC16"
                        bg="#ECFCCB"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="settings"
                        label={t('settings.title')}
                        color="#8B5CF6"
                        bg="#EDE9FE"
                        onPress={() => navigation.navigate('Settings')}
                    />
                    <MenuItem
                        icon="help-circle"
                        label="Bantuan"
                        color="#F59E0B"
                        bg="#FEF3C7"
                        onPress={() => navigation.navigate('Help')}
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
        rowGap: spacing.md, // Reduced gap
    },
    menuItem: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        gap: 8, // Reduced gap
    },
    menuIconContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        borderRadius: 20, // More modern radius
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    menuLabel: {
        fontSize: 11, // Smaller font
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
        marginBottom: 2,
    },
    scheduleTeacher: {
        fontSize: 11,
    },
});
