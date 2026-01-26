import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, Linking, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, shadows, spacing, palette, layout } from '../../theme/theme';

export default function TeachingMaterialsScreen({ navigation }: any) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [classFilterModal, setClassFilterModal] = useState(false);

    // Form State
    const [form, setForm] = useState({
        title: '',
        description: '',
        fileUrl: '',
        category: 'Materi', // Materi, Tugas, Latihan, Video, Referensi
        subject: '',
        classId: '' // Optional, if linked to specific class
    });

    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    useEffect(() => {
        if (selectedSchedule) {
            fetchMaterials();
        }
    }, [selectedSchedule]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await client.get('/materials', {
                params: {
                    classId: selectedSchedule?.classId,
                    subject: selectedSchedule?.subject
                }
            });
            setMaterials(res.data.data.materials);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const data = res.data.data.schedules;
            // Uniquify
            const uniqueOptions = data.reduce((acc: any[], curr: any) => {
                const key = `${curr.classId}-${curr.subject}`;
                if (!acc.find(item => `${item.classId}-${item.subject}` === key)) {
                    acc.push(curr);
                }
                return acc;
            }, []);
            setSchedules(uniqueOptions);
            if (uniqueOptions.length > 0) {
                const first = uniqueOptions[0];
                setSelectedSchedule(first);
                setForm(prev => ({ ...prev, subject: first.subject, classId: first.classId }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.subject) {
            Alert.alert('Error', 'Judul dan Mata Pelajaran wajib diisi');
            return;
        }

        try {
            await client.post('/materials', {
                ...form,
                fileType: 'LINK', // Defaulting to LINK for text input
                isPublic: true // Default visible
            });
            setModalVisible(false);
            fetchMaterials();
            setForm({ title: '', description: '', fileUrl: '', category: 'Materi', subject: form.subject, classId: form.classId });
            Alert.alert('Sukses', 'Materi berhasil ditambahkan');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal menyimpan materi');
        }
    };

    const openLink = (url: string) => {
        if (url) {
            Linking.openURL(url).catch(() => Alert.alert('Error', 'Tidak dapat membuka link'));
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: getCategoryColor(item.category) }]}>
                    <Ionicons name={getCategoryIcon(item.category) as any} size={24} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subject} • {item.category}</Text>
                </View>
                {item.fileUrl && (
                    <TouchableOpacity onPress={() => openLink(item.fileUrl)} style={styles.linkBtn}>
                        <Ionicons name="link" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
            {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
            <View style={styles.cardFooter}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {/* <Text style={styles.classLabel}>{item.classId ? 'Kelas Khusus' : 'Semua Kelas'}</Text> */}
            </View>
        </View>
    );

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Materi': return '#3B82F6';
            case 'Tugas': return '#EF4444';
            case 'Video': return '#F59E0B';
            default: return '#10B981';
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Materi': return 'book';
            case 'Tugas': return 'clipboard';
            case 'Video': return 'play-circle';
            default: return 'document-text';
        }
    };

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[palette.brandBlue, palette.brandBlueSoft]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bahan Ajar</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                        <Ionicons name="add" size={24} color={palette.brandBlue} />
                    </TouchableOpacity>
                </View>

                {/* Class Filter */}
                {selectedSchedule && (
                    <TouchableOpacity style={styles.selector} onPress={() => setClassFilterModal(true)}>
                        <View>
                            <Text style={styles.selectorLabel}>Kelas & Mata Pelajaran</Text>
                            <Text style={styles.selectorValue}>
                                {selectedSchedule.class.name} - {selectedSchedule.subject}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </LinearGradient>

            <FlatList
                data={materials}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="library-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>Belum ada bahan ajar</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tambah Bahan Ajar</Text>

                        <ScrollView>
                            <Text style={styles.label}>Judul</Text>
                            <TextInput
                                style={styles.input}
                                value={form.title}
                                onChangeText={t => setForm({ ...form, title: t })}
                                placeholder="Contoh: Modul Bab 1"
                            />

                            <Text style={styles.label}>Link / URL</Text>
                            <TextInput
                                style={styles.input}
                                value={form.fileUrl}
                                onChangeText={t => setForm({ ...form, fileUrl: t })}
                                placeholder="https://..."
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>Deskripsi</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={form.description}
                                onChangeText={t => setForm({ ...form, description: t })}
                                multiline
                            />

                            <Text style={styles.label}>Kategori</Text>
                            <View style={styles.catRow}>
                                {['Materi', 'Tugas', 'Video', 'Referensi'].map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.catChip, form.category === c && styles.catChipActive]}
                                        onPress={() => setForm({ ...form, category: c })}
                                    >
                                        <Text style={[styles.catChipText, form.category === c && { color: 'white' }]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Mata Pelajaran</Text>
                            <ScrollView horizontal>
                                {schedules.map((s, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.catChip, form.subject === s.subject && styles.catChipActive]}
                                        onPress={() => setForm({ ...form, subject: s.subject, classId: s.classId })}
                                    >
                                        <Text style={[styles.catChipText, form.subject === s.subject && { color: 'white' }]}>{s.subject}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={{ color: colors.error }}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Class Filter Modal */}
            <Modal visible={classFilterModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Kelas</Text>
                            <TouchableOpacity onPress={() => setClassFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={schedules}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedSchedule(item);
                                        // Auto update form subject/classId when changing filter
                                        setForm(prev => ({ ...prev, subject: item.subject, classId: item.classId }));
                                        setClassFilterModal(false);
                                    }}
                                >
                                    <View style={styles.modalIcon}>
                                        <Ionicons name="book-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.modalClassName}>{item.class.name}</Text>
                                        <Text style={styles.modalSubject}>{item.subject}</Text>
                                    </View>
                                    {selectedSchedule?.id === item.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },

    list: { padding: spacing.md },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: colors.textSecondary },

    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm
    },
    cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary },
    linkBtn: { padding: 8 },
    cardDesc: { fontSize: 13, color: colors.text, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    date: { fontSize: 10, color: colors.textSecondary },
    classLabel: { fontSize: 10, color: colors.primary, fontWeight: 'bold' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: colors.background
    },
    catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: 12, color: colors.textSecondary },

    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 24 },
    cancelBtn: { padding: 12 },
    saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },

    // Selector
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 12,
        borderRadius: 12,
        marginTop: 4
    },
    selectorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
    selectorValue: { fontSize: 16, fontWeight: 'bold', color: 'white' },

    // Filter Modal Items
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
    modalIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    modalClassName: { fontSize: 16, fontWeight: '600', color: colors.text },
    modalSubject: { fontSize: 12, color: colors.textSecondary }
});
