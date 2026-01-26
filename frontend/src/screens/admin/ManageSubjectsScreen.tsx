import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, layout, spacing, shadows } from '../../theme/theme';

export default function ManageSubjectsScreen({ navigation }: any) {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchSubjects();
        }, [])
    );

    const filteredSubjects = subjects.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.code && sub.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const fetchSubjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get('/subjects');
            setSubjects(res.data.data.subjects);
        } catch (err: any) {
            setError('Gagal memuat data mata pelajaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Gagal', 'Nama mata pelajaran wajib diisi');
            return;
        }

        try {
            await client.post('/subjects', formData);
            Alert.alert('Berhasil', 'Mata pelajaran berhasil ditambahkan');
            setModalVisible(false);
            setFormData({ name: '', code: '', description: '' });
            fetchSubjects();
        } catch (err: any) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat menambahkan mata pelajaran');
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Konfirmasi',
            'Apakah Anda yakin ingin menghapus mata pelajaran ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/subjects/${id}`);
                            Alert.alert('Berhasil', 'Mata pelajaran berhasil dihapus');
                            fetchSubjects();
                        } catch (err: any) {
                            Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus mata pelajaran');
                        }
                    }
                }
            ]
        );
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await client.post('/subjects/sync');
            Alert.alert('Sukses', res.data.data.message);
            fetchSubjects();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Gagal', 'Gagal mensinkronkan data.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name="book" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.subjectName}>{item.name}</Text>
                    {item.code && <Text style={styles.subjectCode}>Kode: {item.code}</Text>}
                    {item.description && <Text style={styles.subjectDesc}>{item.description}</Text>}
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
        </View>
    );

    if (loading && subjects.length === 0) {
        return <LoadingState message="Memuat data mata pelajaran..." />;
    }

    if (error && subjects.length === 0) {
        return <ErrorState message={error} onRetry={fetchSubjects} />;
    }

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mata Pelajaran</Text>
                    <TouchableOpacity onPress={handleSync} style={styles.backBtn}>
                        <Ionicons name="sync" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Kelola mata pelajaran sekolah</Text>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari mata pelajaran..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSecondary}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <FlatList
                data={filteredSubjects}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchSubjects}
                ListEmptyComponent={
                    <EmptyState
                        icon="book-outline"
                        title={searchQuery ? "Tidak ditemukan" : "Belum ada mata pelajaran"}
                        message={searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Tambahkan mata pelajaran untuk memulai"}
                    />
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tambah Mata Pelajaran</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nama Mata Pelajaran *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: Matematika Wajib"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Kode (Opsional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: MAT-W"
                                value={formData.code}
                                onChangeText={(text) => setFormData({ ...formData, code: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Deskripsi (Opsional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Deskripsi mata pelajaran"
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                            <Text style={styles.submitBtnText}>Simpan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    listContent: { padding: spacing.lg, paddingBottom: 100 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.sm
    },
    cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
        width: 48, height: 48,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md
    },
    cardInfo: { flex: 1 },
    subjectName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
    subjectCode: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    subjectDesc: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
    deleteBtn: {
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: colors.errorBackground,
        alignItems: 'center', justifyContent: 'center'
    },

    fab: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
        ...shadows.md
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    formGroup: { marginBottom: spacing.md },
    label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: colors.surface,
        color: colors.text
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.md
    },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginTop: 15
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text
    }
});
