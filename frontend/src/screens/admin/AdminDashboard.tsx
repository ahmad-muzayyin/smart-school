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

    const MenuItem = ({ icon, label, gradientColors, onPress }: any) => (
        <TouchableOpacity
            style={[
                styles.menuItem,
                {
                    backgroundColor: isDarkMode ? colors.surface : 'white',
                    shadowColor: gradientColors[1], // specific colored shadow
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuItemBackgroundDecoration} />
            <LinearGradient
                colors={gradientColors}
                style={styles.menuIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={26} color="white" />
            </LinearGradient>
            <Text style={[styles.menuLabel, { color: colors.text }]} numberOfLines={2}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: '#F3F4F6' }]} safeArea={false}>
            <StatusBar style="light" />

            {/* Header Background */}
            <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.headerBackground}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingText}>{t('dashboard.adminDashboard')}</Text>
                        <Text style={styles.userNameText}>{user?.name?.toUpperCase() || 'ADMIN'}</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="white" />
                            <Text style={styles.roleBadgeText}>ADMINISTRATOR</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Settings')}>
                        <Text style={{ fontWeight: 'bold', color: '#0EA5E9', fontSize: 18 }}>
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Integrated Time Display in Header */}
                <View style={styles.headerTimeContainer}>
                    <View style={styles.headerTimeBox}>
                        <Ionicons name="time-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.headerTimeText}>{getFormattedTime()}</Text>
                    </View>
                    <Text style={styles.headerDateText}>{getFormattedDate()}</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Modern Stats Card */}
                <View style={styles.statsCardContainer}>
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.statsCardGradient}
                    >
                        <View style={styles.statsRow}>
                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
                                    <Ionicons name="people" size={24} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.statNumber, { color: colors.text }]}>{stats.teacherCount}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.teachers')}</Text>
                                </View>
                            </View>

                            <View style={styles.verticalDivider} />

                            <View style={styles.statBlock}>
                                <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                                    <Ionicons name="people-circle" size={24} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={[styles.statNumber, { color: colors.text }]}>{stats.studentCount}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.students')}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Custom Admin Menu Grid */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu Utama</Text>
                <View style={styles.gridContainer}>
                    {/* Row 1 */}
                    <MenuItem
                        icon="people"
                        label={t('dashboard.teachers')}
                        gradientColors={['#F472B6', '#DB2777']}
                        onPress={() => navigation.navigate('ManageUsers', { role: 'TEACHER' })}
                    />
                    <MenuItem
                        icon="people-circle"
                        label={t('dashboard.students')}
                        gradientColors={['#38BDF8', '#0284C7']}
                        onPress={() => navigation.navigate('ManageUsers', { role: 'STUDENT' })}
                    />
                    <MenuItem
                        icon="school"
                        label={t('dashboard.classes')}
                        gradientColors={['#FB923C', '#EA580C']}
                        onPress={() => navigation.navigate('ManageClasses')}
                    />

                    {/* Row 2 */}
                    <MenuItem
                        icon="calendar"
                        label={t('dashboard.schedules')}
                        gradientColors={['#F87171', '#DC2626']}
                        onPress={() => navigation.navigate('ViewSchedules')}
                    />
                    <MenuItem
                        icon="book"
                        label={t('dashboard.subjects')}
                        gradientColors={['#34D399', '#059669']}
                        onPress={() => navigation.navigate('ManageSubjects')}
                    />
                    <MenuItem
                        icon="stats-chart"
                        label={t('dashboard.reports')}
                        gradientColors={['#60A5FA', '#2563EB']}
                        onPress={() => navigation.navigate('AttendanceReport')}
                    />


                    {/* Row 3 */}
                    <MenuItem
                        icon="notifications"
                        label={t('dashboard.announcements')}
                        gradientColors={['#A3E635', '#65A30D']}
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="settings"
                        label={t('settings.title')}
                        gradientColors={['#A78BFA', '#7C3AED']}
                        onPress={() => navigation.navigate('Settings')}
                    />
                    <MenuItem
                        icon="help-circle"
                        label="Bantuan"
                        gradientColors={['#FBBF24', '#D97706']}
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
        paddingHorizontal: spacing.xl,
        marginTop: 20, /* Positive margin */
        paddingBottom: 160,
    },

    // New Header Styles
    headerBackground: {
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...shadows.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    userNameText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        gap: 6,
    },
    roleBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    profileAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        ...shadows.sm,
    },

    // New Header Time Styles
    headerTimeContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    headerTimeBox: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerTimeText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        letterSpacing: 0.5
    },
    headerDateText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500'
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
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    verticalDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 10,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16, // Use rowGap for vertical spacing
    },
    menuItem: {
        width: ITEM_WIDTH,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        // Improved Shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        position: 'relative',
        overflow: 'hidden',
    },
    menuItemBackgroundDecoration: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    menuIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        // Inner shadow for depth
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    menuLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 16,
    },



    // Today's Schedules
    schedulesSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: '#1F2937',
        marginLeft: 4
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