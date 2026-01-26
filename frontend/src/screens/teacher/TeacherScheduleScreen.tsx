import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing, typography, shadows, layout, palette } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherScheduleScreen({ navigation }: any) {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await client.get('/classes/schedules');
            setSchedules(res.data.data.schedules);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    // Group by day
    const groupedSchedules = schedules.reduce((acc: any, curr: any) => {
        const day = days[curr.dayOfWeek];
        if (!acc[day]) acc[day] = [];
        acc[day].push(curr);
        return acc;
    }, {});

    const getTodayDayNumber = () => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1; // Convert Sunday(0) to 6, Monday(1) to 0, etc.
    };

    const renderItem = ({ item }: any) => {
        const isToday = item.dayOfWeek === getTodayDayNumber();

        return (
            <View style={styles.cardContainer}>
                <View style={[styles.timeStripe, !isToday && { backgroundColor: colors.textSecondary }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.subjectText}>{item.subject}</Text>
                        <View style={[styles.statusBadge, !isToday && { backgroundColor: colors.border }]}>
                            <Text style={[styles.statusText, !isToday && { color: colors.textSecondary }]}>
                                {isToday ? 'Hari Ini' : 'Tidak Aktif'}
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
                </View>
            </View>
        );
    };

    const renderDaySection = ({ item }: any) => (
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

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[palette.brandBlue, palette.brandBlueSoft]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Jadwal Mengajar</Text>
                <Text style={styles.headerSubtitle}>Kelola jadwal kelas harian Anda</Text>
            </LinearGradient>

            <FlatList
                data={Object.keys(groupedSchedules)}
                renderItem={renderDaySection}
                keyExtractor={item => item}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>Belum ada jadwal yang diatur.</Text>
                        </View>
                    ) : null
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100
    },
    sectionContainer: {
        marginBottom: spacing.xl
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md
    },
    dayIndicator: {
        backgroundColor: palette.brandBlueSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: spacing.md
    },
    dayText: {
        color: palette.brandBlue,
        fontWeight: 'bold',
        fontSize: 14
    },
    lineDesc: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border
    },
    cardContainer: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        ...shadows.sm,
        overflow: 'hidden'
    },
    timeStripe: {
        width: 6,
        backgroundColor: palette.brandBlue,
    },
    cardContent: {
        flex: 1,
        padding: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
    },
    subjectText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text
    },
    statusBadge: {
        backgroundColor: colors.successBackground,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.success
    },
    metaRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.md
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    metaText: {
        fontSize: 13,
        color: colors.textSecondary
    },
    actionButton: {
        backgroundColor: palette.brandBlue,
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14
    },
    actionButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.6,
    },
    actionButtonTextDisabled: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.5
    },
    emptyText: {
        marginTop: spacing.sm,
        color: colors.text
    }
});
