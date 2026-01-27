import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing, layout, shadows, typography } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function StudentScheduleScreen({ navigation }: any) {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Default to today (Monday=0), Sunday=6

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            // Fetch all schedules for the student's class
            const res = await client.get('/classes/schedules');
            setSchedules(res.data.data.schedules);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaySchedules = (dayIndex: number) => {
        return schedules
            .filter(s => s.dayOfWeek === dayIndex)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const renderDayTab = (dayIndex: number) => {
        const isActive = activeDay === dayIndex;
        return (
            <TouchableOpacity
                key={dayIndex}
                style={[
                    styles.dayTab,
                    isActive && styles.activeDayTab
                ]}
                onPress={() => setActiveDay(dayIndex)}
            >
                <Text style={[
                    styles.dayTabText,
                    isActive && styles.activeDayTabText
                ]}>
                    {DAYS[dayIndex]}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderScheduleItem = ({ item }: any) => (
        <View style={styles.scheduleCard}>
            <View style={styles.timeContainer}>
                <Text style={styles.startTime}>{item.startTime}</Text>
                <Text style={styles.endTime}>{item.endTime}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoContainer}>
                <Text style={styles.subjectName}>{item.subject}</Text>
                <View style={styles.teacherRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.teacherName}>{item.teacher?.name || 'Guru belum ditentukan'}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return <LoadingState message="Memuat jadwal..." />;
    }

    const daySchedules = getDaySchedules(activeDay);

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Jadwal Pelajaran</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.dayTabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayTabsContent}
                >
                    {DAYS.map((_, index) => renderDayTab(index))}
                </ScrollView>
            </View>

            <View style={styles.content}>
                {daySchedules.length > 0 ? (
                    <FlatList
                        data={daySchedules}
                        renderItem={renderScheduleItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <EmptyState
                        icon="calendar-outline"
                        title={`Tidak ada jadwal hari ${DAYS[activeDay]}`}
                        message="Nikmati waktu istirahatmu!"
                    />
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 20, // Adjust if needed based on SafeArea
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm,
        zIndex: 10
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.text },

    dayTabsContainer: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.sm
    },
    dayTabsContent: {
        paddingHorizontal: spacing.md
    },
    dayTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border
    },
    activeDayTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    dayTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary
    },
    activeDayTabText: {
        color: 'white'
    },

    content: { flex: 1 },
    listContent: { padding: spacing.lg },

    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
        alignItems: 'center'
    },
    timeContainer: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    startTime: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text
    },
    endTime: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: colors.border,
        marginHorizontal: spacing.md
    },
    infoContainer: {
        flex: 1
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    teacherName: {
        fontSize: 14,
        color: colors.textSecondary
    }
});
