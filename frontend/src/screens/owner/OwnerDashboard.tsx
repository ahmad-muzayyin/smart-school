import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Dimensions } from 'react-native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, typography, shadows, getThemeColors } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface TenantStats {
    id: string;
    name: string;
    studentCount: number;
    teacherCount: number;
    classCount: number;
    totalUsers: number;
    isActive?: boolean;
}

export default function OwnerDashboard({ navigation }: any) {
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [statistics, setStatistics] = useState<TenantStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const fetchStatistics = async () => {
        try {
            const response = await client.get('/tenants/statistics');
            setStatistics(response.data.data.statistics);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStatistics();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStatistics();
    };

    const handleManageSchool = (school: TenantStats) => {
        navigation.navigate('SchoolManagement', {
            schoolId: school.id,
            schoolName: school.name
        });
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const renderSchoolCard = ({ item }: { item: TenantStats }) => {
        const isActive = item.isActive !== false;

        return (
            <View style={styles.cardWrapper}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <LinearGradient
                        colors={isActive ? [colors.primary, colors.primaryDark] : ['#64748B', '#475569']}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.schoolIcon}>
                                <Text style={styles.schoolIconText}>{item.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.schoolInfo}>
                                <Text style={styles.schoolNameLight} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.schoolSubtitleLight}>{item.totalUsers} Active Users</Text>
                            </View>
                            <View style={[styles.badgeContainer, { backgroundColor: isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.4)' }]}>
                                <Ionicons name={isActive ? "shield-checkmark" : "warning"} size={16} color="white" />
                                <Text style={styles.badgeText}>{isActive ? "AKTIF" : "NONAKTIF"}</Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumberLight}>{item.studentCount}</Text>
                                <Text style={styles.statLabelLight}>Students</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={styles.statNumberLight}>{item.teacherCount}</Text>
                                <Text style={styles.statLabelLight}>Teachers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={styles.statNumberLight}>{item.classCount}</Text>
                                <Text style={styles.statLabelLight}>Classes</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.manageButtonLight}
                            onPress={() => handleManageSchool(item)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.manageButtonTextLight, { color: isActive ? colors.primary : '#475569' }]}>Manage School</Text>
                            <Ionicons name="arrow-forward" size={16} color={isActive ? colors.primary : '#475569'} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        );
    };

    const totalStudents = statistics.reduce((sum, s) => sum + s.studentCount, 0);
    const totalTeachers = statistics.reduce((sum, s) => sum + s.teacherCount, 0);

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome Back</Text>
                        <Text style={[styles.title, { color: colors.text }]}>School Management</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('ManageUsers', { role: 'OWNER', tenantId: null })} // Trigger access to system users
                        >
                            <Ionicons name="people" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('CreateTenant')}
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="business" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{statistics.length}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Schools</Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#E0F2FE' }]}>
                            <Ionicons name="people" size={20} color="#0284C7" />
                        </View>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{totalStudents}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Students</Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="person" size={20} color="#16A34A" />
                        </View>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{totalTeachers}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Teachers</Text>
                    </View>
                </View>

                {/* Schools Carousel */}
                <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>All Schools</Text>
                    <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>{statistics.length} schools registered</Text>
                </View>

                {statistics.length > 0 ? (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={statistics}
                            renderItem={renderSchoolCard}
                            keyExtractor={item => item.id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WIDTH + spacing.xl}
                            decelerationRate="fast"
                            contentContainerStyle={styles.carouselContent}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                        />

                        {/* Pagination Dots */}
                        <View style={styles.pagination}>
                            {statistics.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        { backgroundColor: index === activeIndex ? colors.primary : colors.border }
                                        , index === activeIndex && styles.paginationDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="school-outline" size={64} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No schools yet</Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('CreateTenant')}
                        >
                            <Text style={styles.emptyButtonText}>Add First School</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    greeting: {
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },

    // Summary Section
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    summaryCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: 16,
        alignItems: 'center',
        ...shadows.sm,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 12,
    },

    // List Headers
    listHeader: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    listSubtitle: {
        fontSize: 14,
    },

    // Layout
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    carouselContent: {
        paddingVertical: spacing.md,
        paddingHorizontal: (width - CARD_WIDTH) / 2,
    },

    // Card Styles
    cardWrapper: {
        width: CARD_WIDTH,
        paddingHorizontal: spacing.sm,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        height: 280,
        ...shadows.lg,
    },
    cardGradient: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    schoolIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    schoolIconText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    schoolInfo: {
        flex: 1,
    },
    schoolNameLight: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    schoolSubtitleLight: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    // Stats in Card
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: spacing.md,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statNumberLight: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    statLabelLight: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },

    // Manage Button
    manageButtonLight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: spacing.md,
        borderRadius: 14,
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    manageButtonTextLight: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    paginationDotActive: {
        width: 20,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        fontSize: 16,
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    emptyButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
