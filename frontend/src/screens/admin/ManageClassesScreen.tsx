import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, spacing, shadows } from '../../theme/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageClassesScreen({ navigation }: any) {
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [className, setClassName] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [showTeacherPicker, setShowTeacherPicker] = useState(false);
    const [searchTeacher, setSearchTeacher] = useState('');

    // Export State
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [classToExport, setClassToExport] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchClasses();
            fetchTeachers();
        }, [])
    );

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/classes?_t=${new Date().getTime()}`);
            const fetchedClasses = res.data.data.classes;
            console.log('Fetched Classes:', fetchedClasses.length);
            console.log('Classes with Homeroom:', fetchedClasses.filter((c: any) => c.homeRoomTeacher).length);
            setClasses(fetchedClasses);
        } catch (e) {
            console.error('Fetch Classes Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await client.get('/users/teachers');
            setTeachers(res.data.data.users);
        } catch (e) {
            console.error(e);
        }
    };

    const createClass = async () => {
        if (!className.trim()) {
            Alert.alert('Error', 'Nama kelas tidak boleh kosong');
            return;
        }
        try {
            const data: any = { name: className };
            if (selectedTeacher) {
                data.homeRoomTeacherId = selectedTeacher.id;
            }
            await client.post('/classes', data);
            setModalVisible(false);
            setClassName('');
            setSelectedTeacher(null);
            fetchClasses();
            Alert.alert('Sukses', 'Kelas berhasil dibuat');
        } catch (e) {
            Alert.alert('Gagal', 'Terjadi kesalahan');
        }
    };

    const updateClass = async () => {
        if (!className.trim()) {
            Alert.alert('Error', 'Nama kelas tidak boleh kosong');
            return;
        }
        try {
            const data: any = { name: className };
            if (selectedTeacher) {
                data.homeRoomTeacherId = selectedTeacher.id;
            } else {
                data.homeRoomTeacherId = null;
            }

            await client.put(`/classes/${editingClass.id}`, data);
            setModalVisible(false);
            setClassName('');
            setSelectedTeacher(null);
            setEditingClass(null);
            fetchClasses();
            Alert.alert('Sukses', 'Kelas berhasil diperbarui');
        } catch (e) {
            console.error(e);
            Alert.alert('Gagal', 'Terjadi kesalahan');
        }
    };
    const deleteClass = async (classId: string, className: string) => {
        Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus kelas "${className}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/classes/${classId}`);
                            fetchClasses();
                            Alert.alert('Sukses', 'Kelas berhasil dihapus');
                        } catch (e) {
                            Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus kelas');
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (item: any) => {
        setEditingClass(item);
        setClassName(item.name);
        setSelectedTeacher(item.homeRoomTeacher || null);
        setModalVisible(true);
    };

    const openCreateModal = () => {
        setEditingClass(null);
        setClassName('');
        setSelectedTeacher(null);
        setModalVisible(true);
    };

    const handleSubmit = () => {
        if (editingClass) {
            updateClass();
        } else {
            createClass();
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const csvContent = "ClassName\nX IPA 1\nX IPA 2\nX IPS 1\nXI IPA 1";

            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "template_import_kelas.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            if (!dir) throw new Error('Storage directory not found');

            const fileUri = dir + "template_import_kelas.csv";
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Info', 'Template disimpan di: ' + fileUri);
            }
        } catch (error: any) {
            Alert.alert('Gagal', 'Tidak dapat membuat template: ' + error.message);
        }
    };

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'
                ],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                name: file.name
            } as any);

            setLoading(true);
            const res = await client.post('/classes/import-classes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000,
            });

            Alert.alert(
                'Import Selesai',
                `Berhasil: ${res.data.imported}, Gagal: ${res.data.failed}` + (res.data.failed > 0 ? '\nCek console untuk detail error.' : '')
            );

            if (res.data.errors && res.data.errors.length > 0) {
                console.log('Import errors:', res.data.errors);
            }

            fetchClasses();
        } catch (error: any) {
            console.error('Import Error:', error);
            const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengupload file.';
            Alert.alert('Gagal Import', msg);
        } finally {
            setLoading(false);
        }
    };

    const showImportOptions = () => {
        Alert.alert(
            'Kelola Data Excel',
            'Pilih aksi yang ingin dilakukan',
            [
                { text: 'Download Template', onPress: handleDownloadTemplate },
                { text: 'Import Kelas (Upload)', onPress: handleImportExcel },
                { text: 'Batal', style: 'cancel' }
            ]
        );
    };

    const handleExportRecap = async () => {
        if (!classToExport) return;
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            console.log('Token fetched for export:', token ? 'Yes (Length: ' + token.length + ')' : 'NO TOKEN');

            const monthStr = selectedDate.toISOString().slice(0, 7); // YYYY-MM
            const res = await client.get(`/classes/${classToExport.id}/export-rekap`, {
                params: {
                    month: monthStr,
                    auth_token: token // Sending token via Query Param as fallback
                },
                responseType: 'arraybuffer', // Important for binary data
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Convert to base64
            const uint8Array = new Uint8Array(res.data);
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = (global as any).btoa ? (global as any).btoa(binary) : binary;

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            const fileName = `Rekap_Absensi_${classToExport.name}_${monthStr}.xlsx`;
            const fileUri = dir + fileName;

            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

            setExportModalVisible(false);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Sukses', `File tersimpan di: ${fileUri}`);
            }

        } catch (error: any) {
            console.error(error);
            let errorMessage = error.message || 'Terjadi kesalahan saat mengekspor data.';

            if (error.response && error.response.data) {
                // Since responseType is arraybuffer, error.response.data is likely a buffer even for JSON errors
                try {
                    const text = String.fromCharCode.apply(null, new Uint8Array(error.response.data) as any);
                    const json = JSON.parse(text);
                    if (json.message) {
                        errorMessage = json.message;
                    }
                } catch (e) {
                    // Could not parse JSON from error buffer, ignore
                }
            }

            Alert.alert('Gagal', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const openExportModal = (item: any) => {
        setClassToExport(item);
        setSelectedDate(new Date()); // Default to current month
        setExportModalVisible(true);
    };

    const renderItem = ({ item }: any) => {
        const hasHomeRoom = !!item.homeRoomTeacher;
        return (
            <View style={styles.card}>
                <View style={[styles.statusStrip, { backgroundColor: hasHomeRoom ? colors.success : colors.warning }]} />
                <View style={[styles.iconContainer, { backgroundColor: hasHomeRoom ? '#D1FAE5' : '#FEF3C7' }]}>
                    <Ionicons
                        name={hasHomeRoom ? "school" : "alert-circle-outline"}
                        size={24}
                        color={hasHomeRoom ? colors.success : colors.warning}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.className}>{item.name}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.classDetails}> {item.students?.length || 0} Siswa</Text>
                    </View>

                    <View style={[styles.infoRow, { marginTop: 2 }]}>
                        <Ionicons
                            name={hasHomeRoom ? "person-circle-outline" : "help-circle-outline"}
                            size={14}
                            color={hasHomeRoom ? colors.text : colors.error}
                        />
                        <Text style={[styles.classDetails, {
                            color: hasHomeRoom ? colors.text : colors.error,
                            fontWeight: hasHomeRoom ? 'normal' : '600'
                        }]}>
                            {hasHomeRoom ? ` ${item.homeRoomTeacher.name}` : ' Belum ada Wali Kelas'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F0FDFA' }]}
                        onPress={() => openExportModal(item)}
                    >
                        <Ionicons name="download-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                        onPress={() => openEditModal(item)}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => deleteClass(item.id, item.name)}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

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
                    <Text style={styles.headerTitle}>Manajemen Kelas</Text>
                    <TouchableOpacity onPress={showImportOptions} style={styles.backBtn}>
                        <Ionicons name="document-text-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={classes}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchClasses}
                ListHeaderComponent={
                    <Text style={styles.listTitle}>Daftar Kelas Aktif</Text>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>Belum ada kelas.</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={openCreateModal}
                activeOpacity={0.9}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingClass ? 'Edit Kelas' : 'Buat Kelas Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setModalVisible(false);
                                setEditingClass(null);
                                setClassName('');
                            }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nama Kelas</Text>
                            <TextInput
                                placeholder="Contoh: X IPA 1"
                                style={styles.input}
                                value={className}
                                onChangeText={setClassName}
                            />
                            <Text style={styles.hint}>Gunakan nama yang mudah dikenali.</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Wali Kelas (Opsional)</Text>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowTeacherPicker(true)}
                            >
                                <Text style={selectedTeacher ? styles.pickerText : styles.pickerPlaceholder}>
                                    {selectedTeacher ? selectedTeacher.name : 'Pilih Wali Kelas'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            {selectedTeacher && (
                                <TouchableOpacity
                                    onPress={() => setSelectedTeacher(null)}
                                    style={styles.clearButton}
                                >
                                    <Text style={styles.clearText}>Hapus Wali Kelas</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                            <Text style={styles.submitBtnText}>
                                {editingClass ? 'Perbarui' : 'Simpan'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Teacher Picker Modal */}
            <Modal visible={showTeacherPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '60%', paddingBottom: 0 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Wali Kelas</Text>
                            <TouchableOpacity onPress={() => setShowTeacherPicker(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Cari nama guru..."
                                style={styles.searchInput}
                                value={searchTeacher}
                                onChangeText={setSearchTeacher}
                                autoFocus={false}
                            />
                        </View>

                        <FlatList
                            data={teachers
                                .filter(t => t.name.toLowerCase().includes(searchTeacher.toLowerCase()))
                                .sort((a, b) => a.name.localeCompare(b.name))
                            }
                            keyExtractor={item => item.id}
                            style={{ marginTop: 10 }}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.teacherItem}
                                    onPress={() => {
                                        setSelectedTeacher(item);
                                        setShowTeacherPicker(false);
                                        setSearchTeacher(''); // Reset search
                                    }}
                                >
                                    <View style={styles.teacherAvatar}>
                                        <Text style={styles.teacherAvatarText}>{item.name.charAt(0)}</Text>
                                    </View>
                                    <View style={styles.teacherInfo}>
                                        <Text style={styles.teacherName}>{item.name}</Text>
                                        <Text style={styles.teacherEmail}>{item.email}</Text>
                                    </View>
                                    {selectedTeacher?.id === item.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyTeacher}>
                                    <Text style={styles.emptyText}>Guru tidak ditemukan</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Export Recap Modal */}
            <Modal visible={exportModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 'auto', minHeight: undefined }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Export Rekap Absensi</Text>
                            <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ marginBottom: 10, color: colors.textSecondary }}>
                            Kelas: <Text style={{ fontWeight: 'bold', color: colors.text }}>{classToExport?.name}</Text>
                        </Text>

                        <Text style={styles.label}>Pilih Bulan</Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { marginBottom: 20 }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.pickerText}>
                                {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </Text>
                            <Ionicons name="calendar" size={20} color={colors.primary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setSelectedDate(date);
                                }}
                            />
                        )}

                        <TouchableOpacity style={styles.submitBtn} onPress={handleExportRecap}>
                            <Text style={styles.submitBtnText}>Download Excel</Text>
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
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm,
        overflow: 'hidden', // For status strip
        position: 'relative'
    },
    statusStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
    },
    iconContainer: {
        width: 48, height: 48,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
        marginLeft: 8 // Space after strip
    },
    cardContent: { flex: 1 },
    className: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classDetails: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 2
    },
    actionButtons: {
        flexDirection: 'column',
        gap: 8,
        marginLeft: 8
    },
    actionBtn: {
        width: 32, height: 32,
        borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },

    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.5
    },
    emptyText: { marginTop: 8, color: colors.textSecondary },

    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
        ...shadows.lg
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
        minHeight: 300
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    formGroup: { marginBottom: spacing.md },
    label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: colors.background
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background
    },
    pickerText: {
        fontSize: 16,
        color: colors.text
    },
    pickerPlaceholder: {
        fontSize: 16,
        color: colors.textSecondary
    },
    clearButton: {
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    clearText: {
        fontSize: 13,
        color: colors.error,
        textDecorationLine: 'underline'
    },
    teacherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    teacherAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    teacherAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary
    },
    teacherInfo: {
        flex: 1
    },
    teacherName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 2
    },
    teacherEmail: {
        fontSize: 13,
        color: colors.textSecondary
    },
    emptyTeacher: {
        padding: spacing.xl,
        alignItems: 'center'
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.md
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        height: '100%'
    }
});
