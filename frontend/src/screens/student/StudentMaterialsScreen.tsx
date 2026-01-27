import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking, Alert, Platform } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, shadows, layout } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

export default function StudentMaterialsScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

    const categories = ['Semua', 'Materi', 'Tugas', 'Latihan', 'Video', 'Referensi'];

    useEffect(() => {
        fetchMaterials();
    }, [selectedCategory]);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            let url = '/materials';
            if (selectedCategory !== 'Semua') {
                url += `?category=${selectedCategory}`;
            }

            const res = await client.get(url);
            setMaterials(res.data.data.materials);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal memuat materi pelajaran');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMaterials();
    };

    const handleOpenMaterial = async (url: string) => {
        if (!url) {
            Alert.alert('Info', 'Tidak ada lampiran file/link');
            return;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Tidak dapat membuka link ini');
            }
        } catch (err) {
            Alert.alert('Error', 'Gagal membuka link');
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'PDF': return 'document-text';
            case 'PPT': return 'easel';
            case 'VIDEO': return 'videocam';
            case 'IMAGE': return 'image';
            case 'LINK': return 'link';
            default: return 'document';
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => item.fileUrl ? handleOpenMaterial(item.fileUrl) : null}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={getIconForType(item.fileType)} size={24} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subject}>{item.subject}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.teacherName}>Oleh: {item.teacher?.name}</Text>
                        {item.isPublic && <View style={styles.publicBadge}><Text style={styles.publicText}>Publik</Text></View>}
                    </View>
                </View>
            </View>

            {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View style={styles.footer}>
                <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{item.category}</Text>
                </View>
                <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Materi Pelajaran</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={categories}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedCategory === item && styles.activeChip
                            ]}
                            onPress={() => setSelectedCategory(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedCategory === item && styles.activeFilterText
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <LoadingState message="Memuat materi..." />
            ) : materials.length === 0 ? (
                <EmptyState
                    icon="library-outline"
                    title="Belum ada materi"
                    message="Guru belum mengupload materi pelajaran untuk kelas ini."
                />
            ) : (
                <FlatList
                    data={materials}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                />
            )}
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
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm,
        zIndex: 10
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.text },

    filterContainer: {
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border
    },
    activeChip: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary
    },
    activeFilterText: {
        color: 'white'
    },

    listContent: {
        padding: spacing.lg
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2
    },
    subject: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 2
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    teacherName: {
        fontSize: 12,
        color: colors.textSecondary
    },
    publicBadge: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8
    },
    publicText: {
        fontSize: 10,
        color: colors.success,
        fontWeight: 'bold'
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 20
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm
    },
    typeTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: colors.gray100
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary
    },
    date: {
        fontSize: 12,
        color: colors.textSecondary
    }
});
