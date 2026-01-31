import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing, typography, shadows, layout, palette } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';


export default function TeacherScheduleScreen({ navigation }: any) {
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states for "Semua Jadwal"
    const [selectedDay, setSelectedDay] = useState(0);
    const [searchClass, setSearchClass] = useState('');

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    useEffect(() => {
        // Init selected day to today
        setSelectedDay(getTodayDayNumber());
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [viewMode, selectedDay]);

    const getTodayDayNumber = () => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1;
    };

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            let res;
            if (viewMode === 'my') {
                res = await client.get('/classes/schedules');
            } else {
                // Use selectedDay filter
                res = await client.get(`/classes/schedules?allTeachers=true&dayOfWeek=${selectedDay}`);
            }
            setSchedules(res.data.data.schedules);
        } catch (error) {
            Alert.alert('Error', 'Gagal memuat jadwal. Periksa koneksi internet Anda.');
        } finally {
            setLoading(false);
        }
    };



    const renderItem = ({ item }: any) => {
        const isToday = item.dayOfWeek === getTodayDayNumber();
        const isMySchedule = viewMode === 'my' || (item.teacherId && item.teacherId === client.defaults.headers.common['x-user-id']);

        return (
            <View style={styles.cardContainer}>
                {/* Time Stripe: Green if Today, else Blue/Gray */}
                <View style={[styles.timeStripe, { backgroundColor: isToday ? colors.success : palette.brandBlue }, !isToday && viewMode === 'my' && { backgroundColor: colors.textSecondary }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.subjectText}>{item.subject}</Text>
                            {viewMode === 'all' && (
                                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{item.teacher?.name}</Text>
                            )}
                        </View>
                        <View style={[styles.statusBadge, (!isToday && viewMode === 'my') && { backgroundColor: colors.border }]}>
                            <Text style={[styles.statusText, (!isToday && viewMode === 'my') && { color: colors.textSecondary }]}>
                                {isToday ? 'Hari Ini' : 'Jadwal'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{item.startTime} - {item.endTime}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{item.class.name}</Text>
                        </View>
                    </View>

                    {viewMode === 'my' && (
                        <TouchableOpacity
                            style={[styles.actionButton, !isToday && styles.actionButtonDisabled]}
                            onPress={() => {
                                if (isToday) {
                                    navigation.navigate('TakeAttendance', {
                                        scheduleId: item.id,
                                        className: item.class.name,
                                        classId: item.class.id
                                    });
                                }
                            }}
                            disabled={!isToday}
                        >
                            <Text style={[styles.actionButtonText, !isToday && styles.actionButtonTextDisabled]}>
                                {isToday ? 'Isi Presensi' : 'Tidak Tersedia'}
                            </Text>
                            {isToday && <Ionicons name="arrow-forward" size={16} color="white" />}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderDaySection = ({ item }: any) => {
        // Only used in 'my' mode
        // ... (existing logic)
        const groupedSchedules = schedules.reduce((acc: any, curr: any) => {
            const day = days[curr.dayOfWeek];
            if (!acc[day]) acc[day] = [];
            acc[day].push(curr);
            return acc;
        }, {});

        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <View style={styles.dayIndicator}>
                        <Text style={styles.dayText}>{item}</Text>
                    </View>
                    <View style={styles.lineDesc} />
                </View>
                <FlatList
                    data={groupedSchedules[item]}
                    renderItem={renderItem}
                    keyExtractor={(i: any) => i.id}
                    scrollEnabled={false}
                />
            </View>
        );
    };

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[palette.brandBlue, palette.brandBlueSoft]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Jadwal Mengajar</Text>
                <Text style={styles.headerSubtitle}>Kelola jadwal kelas harian Anda</Text>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, viewMode === 'my' && styles.tabBtnActive]}
                        onPress={() => setViewMode('my')}
                    >
                        <Text style={[styles.tabText, viewMode === 'my' && styles.tabTextActive]}>Jadwal Saya</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, viewMode === 'all' && styles.tabBtnActive]}
                        onPress={() => setViewMode('all')}
                    >
                        <Text style={[styles.tabText, viewMode === 'all' && styles.tabTextActive]}>Semua Jadwal</Text>
                    </TouchableOpacity>
                </View>

                {viewMode === 'all' && (
                    <View style={styles.filterContainer}>
                        {/* Day Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
                            {days.map((day, index) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.dayChip, selectedDay === index && styles.dayChipActive]}
                                    onPress={() => setSelectedDay(index)}
                                >
                                    <Text style={[styles.dayChipText, selectedDay === index && styles.dayChipTextActive]}>{day}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Search Class */}
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={20} color="white" style={{ marginRight: 8, opacity: 0.8 }} />
                            <TextInput
                                placeholder="Cari Kelas (Cth: 7A)"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={styles.searchInput}
                                value={searchClass}
                                onChangeText={setSearchClass}
                            />
                        </View>
                    </View>
                )}
            </LinearGradient>

            {viewMode === 'my' ? (
                <FlatList
                    data={Object.keys(schedules.reduce((acc: any, curr: any) => {
                        const day = days[curr.dayOfWeek];
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(curr);
                        return acc;
                    }, {}))}
                    renderItem={renderDaySection}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={!loading ? <EmptyState /> : null}
                />
            ) : (
                <FlatList
                    data={schedules.filter(s =>
                        !searchClass || (s.class && s.class.name.toLowerCase().includes(searchClass.toLowerCase()))
                    )}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={!loading ? <EmptyState text="Tidak ada jadwal ditemukan" /> : null}
                />
            )}
        </Screen>
    );
}

const EmptyState = ({ text = "Belum ada jadwal." }: any) => (
    <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    // ... existing styles ...
    container: { backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 4,
        marginTop: 20
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10
    },
    tabBtnActive: {
        backgroundColor: 'white',
        ...shadows.sm
    },
    tabText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600'
    },
    tabTextActive: {
        color: palette.brandBlue,
        fontWeight: 'bold'
    },

    listContent: { padding: spacing.lg, paddingBottom: 100 },
    sectionContainer: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    dayIndicator: { backgroundColor: palette.brandBlueSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: spacing.md },
    dayText: { color: palette.brandBlue, fontWeight: 'bold', fontSize: 14 },
    lineDesc: { flex: 1, height: 1, backgroundColor: colors.border },

    cardContainer: { backgroundColor: colors.surface, borderRadius: layout.borderRadius.md, marginBottom: spacing.md, flexDirection: 'row', ...shadows.sm, overflow: 'hidden' },
    timeStripe: { width: 6, backgroundColor: palette.brandBlue },
    cardContent: { flex: 1, padding: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    subjectText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    statusBadge: { backgroundColor: colors.successBackground, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700', color: colors.success },

    metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: colors.textSecondary },

    actionButton: { backgroundColor: palette.brandBlue, borderRadius: 8, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
    actionButtonDisabled: { backgroundColor: colors.border, opacity: 0.6 },
    actionButtonTextDisabled: { color: colors.textSecondary },

    emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { marginTop: spacing.sm, color: colors.text },

    filterContainer: { marginTop: 20 },
    dayScroll: { paddingVertical: 5, paddingHorizontal: 4, gap: 8 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 8 },
    dayChipActive: { backgroundColor: 'white' },
    dayChipText: { color: 'white', fontSize: 13, fontWeight: '600' },
    dayChipTextActive: { color: palette.brandBlue, fontWeight: 'bold' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 15 },
    searchInput: { flex: 1, color: 'white', fontSize: 14, fontWeight: '500' }
});
