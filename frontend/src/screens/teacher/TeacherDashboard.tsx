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
const ITEM_WIDTH = (width - (spacing.xl * 2) - spacing.md) / 2;

export default function TeacherDashboard({ navigation }: any) {
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [stats, setStats] = useState({ activeClasses: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
    const [isHomeRoom, setIsHomeRoom] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchTodaySchedules();
        fetchHomeRoomStatus();
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

    const fetchHomeRoomStatus = async () => {
        try {
            // Check if user is assigned as HomeRoomTeacher to any class
            const res = await client.get('/classes');
            const classes = res.data.data.classes || [];
            const myClass = classes.find((c: any) => c.homeRoomTeacherId === user?.id);
            if (myClass) {
                setIsHomeRoom(true);
            }
        } catch (e) {
            console.log('Error checking homeroom status', e);
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
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${getDayName()}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    };

    const getFormattedTime = () => {
        return currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
    };

    const MenuItem = ({ icon, label, subLabel, color, bg, onPress }: any) => (
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: isDarkMode ? colors.surface : 'white' }]} onPress={onPress} activeOpacity={0.9}>
            <View style={[styles.menuIconContainer, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
                {subLabel && <Text style={[styles.menuSubLabel, { color: colors.textSecondary }]}>{subLabel}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: '#F3F4F6' }]} safeArea={false}>
            <StatusBar style="light" />

            {/* Header Background */}
            <LinearGradient
                colors={['#06640aff', '#0a7247ff']}
                style={styles.headerBackground}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingText}>Selamat Pagi,</Text>
                        <Text style={styles.userNameText}>{user?.name?.toUpperCase() || 'GURU'}</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="white" />
                            <Text style={styles.roleBadgeText}>
                                {isHomeRoom ? 'WALI KELAS' : 'GURU'}
                            </Text>
                        </View>
                    </View>


                    <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Profil')}>
                        <Text style={{ fontWeight: 'bold', color: '#19790cff', fontSize: 18 }}>
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'GU'}
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

                {/* Scan Absensi Button (Wide) */}
                <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Jadwal')}>
                    <View style={styles.scanButtonLeft}>
                        <View style={styles.scanIconBox}>
                            <Ionicons name="scan-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.scanTitle}>Jadwal Hari Ini</Text>
                            <Text style={styles.scanSubtitle}>Lihat kelas hari ini</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>

                {/* Menu Grid */}
                <View style={styles.gridContainer}>
                    <MenuItem
                        icon="calendar"
                        label="Jadwal"
                        subLabel="Agenda Mengajar"
                        color="#EF4444"
                        bg="#FEE2E2"
                        onPress={() => navigation.navigate('Jadwal')}
                    />
                    <MenuItem
                        icon="document-text"
                        label="Rekap Absensi"
                        subLabel="Laporan Bulanan"
                        color="#8B5CF6"
                        bg="#EDE9FE"
                        onPress={() => navigation.navigate('TeacherClasses')} // Used for Export Rekap now
                    />
                    <MenuItem
                        icon="star"
                        label="Nilai"
                        subLabel="Input Penilaian"
                        color="#F59E0B"
                        bg="#FEF3C7"
                        onPress={() => navigation.navigate('TeacherGrades')}
                    />
                    <MenuItem
                        icon="person"
                        label="Profil"
                        subLabel="Pengaturan Akun"
                        color="#EC4899"
                        bg="#FCE7F3"
                        onPress={() => navigation.navigate('Profil')}
                    />
                    <MenuItem
                        icon="people"
                        label="Data Siswa"
                        subLabel="Daftar Siswa"
                        color="#10B981"
                        bg="#D1FAE5"
                        onPress={() => navigation.navigate('TeacherStudents')}
                    />
                    <MenuItem
                        icon="book"
                        label="Bahan Ajar"
                        subLabel="Materi & Tugas"
                        color="#3B82F6"
                        bg="#DBEAFE"
                        onPress={() => navigation.navigate('TeachingMaterials')}
                    />
                </View>

            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
        paddingBottom: 24, // Reduced padding
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

    scrollContent: {
        paddingHorizontal: spacing.xl,
        marginTop: 20, // Positive margin
        paddingBottom: 160,
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

    // Scan Button
    scanButton: {
        backgroundColor: '#064E3B',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        ...shadows.md,
    },
    scanButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    scanIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    scanSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    menuItem: {
        width: ITEM_WIDTH,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        ...shadows.sm,
        minHeight: 120,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    menuTextContainer: {
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    menuSubLabel: {
        fontSize: 11,
        textAlign: 'center',
        opacity: 0.8,
    }
});
