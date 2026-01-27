import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, AlertButton, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { IdentityCard } from '../../components/common/IdentityCard';
import { colors as defaultColors, layout, spacing, typography, shadows, palette, getThemeColors } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import QRCode from 'qrcode';

export default function ManageUsersScreen({ route, navigation }: any) {
    const { role, tenantId } = route.params; // 'TEACHER' or 'STUDENT', optional tenantId for Owner
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState<{
        name: string;
        email: string;
        password: string;
        role: string;
        classId: string;
        subjectId: string;
        subjectIds: string[];
    }>({ name: '', email: '', password: '', role, classId: '', subjectId: '', subjectIds: [] });
    const [editingUser, setEditingUser] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [cardModalVisible, setCardModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);
    const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
    const [showClassFilterModal, setShowClassFilterModal] = useState(false);

    const [showClassPicker, setShowClassPicker] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');

    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        let matchesClass = true;
        if (role === 'STUDENT' && selectedClassFilter) {
            matchesClass = user.classId === selectedClassFilter || user.class?.id === selectedClassFilter;
        }

        return matchesSearch && matchesClass;
    });

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
            if (role === 'STUDENT') {
                fetchClasses();
            }
            if (role === 'TEACHER') {
                fetchSubjects();
            }
        }, [role, tenantId])
    );

    const fetchUsers = async () => {
        setLoading(true);
        let endpoint = '/users/students';
        if (role === 'TEACHER') endpoint = '/users/teachers';
        if (role === 'SCHOOL_ADMIN') endpoint = '/users/admins';

        if (tenantId) {
            endpoint += `?tenantId=${tenantId}`;
        }
        try {
            const res = await client.get(endpoint);
            setUsers(res.data.data.users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            // If Owner, classes might need tenantId too? Yes, probably. 
            // Assuming tenantId applies here too if ClassController supports it.
            // Let's assume for now classes list is global or filtered by user. Owner needs tenantId.
            // But ManageClasses is separate. Let's just try basic users first.
            const res = await client.get('/classes');
            setClasses(res.data.data.classes);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSubjects = async () => {
        try {
            let endpoint = '/subjects';
            if (tenantId) {
                endpoint += `?tenantId=${tenantId}`;
            }
            const res = await client.get(endpoint);
            console.log('Fetched subjects:', res.data.data.subjects);
            setSubjects(res.data.data.subjects);
        } catch (e) {
            console.error('Error fetching subjects:', e);
        }
    };

    const createUser = async () => {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Gagal', 'Mohon lengkapi semua data');
            return;
        }
        try {
            const payload = { ...form, role, tenantId }; // Pass tenantId for Owner
            await client.post('/users', payload);
            closeModal();
            fetchUsers();
            Alert.alert('Berhasil', `${getRoleLabel()} berhasil ditambahkan`);
        } catch (e) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat membuat user');
        }
    };

    const updateUser = async () => {
        if (!form.name || !form.email) {
            Alert.alert('Gagal', 'Mohon lengkapi semua data');
            return;
        }
        try {
            const updateData: any = { name: form.name, email: form.email };
            if (form.password) {
                updateData.password = form.password;
            }
            if (role === 'STUDENT' && form.classId) {
                updateData.classId = form.classId;
            }
            if (role === 'TEACHER' && form.subjectIds) {
                updateData.subjectIds = form.subjectIds;
            }
            await client.put(`/users/${editingUser.id}`, updateData);
            closeModal();
            fetchUsers();
            Alert.alert('Berhasil', `${getRoleLabel()} berhasil diperbarui`);
        } catch (e: any) {
            console.error('Update user error:', e);
            const errorMessage = e.response?.data?.message || 'Terjadi kesalahan saat memperbarui user';
            Alert.alert('Gagal', errorMessage);
        }
    };

    const deleteUser = async (userId: string, userName: string) => {
        Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus ${getRoleLabel()} "${userName}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/users/${userId}`);
                            fetchUsers();
                            Alert.alert('Berhasil', `${getRoleLabel()} berhasil dihapus`);
                        } catch (e) {
                            Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus user');
                        }
                    }
                }
            ]
        );
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({ name: '', email: '', password: '', role, classId: '', subjectId: '', subjectIds: [] });
        setModalVisible(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role,
            classId: user.classId || '',
            subjectId: '', // Deprecated
            subjectIds: user.subjects ? user.subjects.map((s: any) => s.id) : []
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingUser(null);
        setForm({ name: '', email: '', password: '', role, classId: '', subjectId: '', subjectIds: [] });
    };

    const handleSubmit = () => {
        if (editingUser) {
            updateUser();
        } else {
            createUser();
        }
    };

    const getRoleLabel = () => {
        if (role === 'TEACHER') return 'Guru';
        if (role === 'STUDENT') return 'Siswa';
        if (role === 'SCHOOL_ADMIN') return 'Admin Sekolah';
        return 'User';
    };

    const handleShowCard = (student: any) => {
        setSelectedStudent(student);
        setCardModalVisible(true);
    };



    const generateBulkPDF = async () => {
        if (filteredUsers.length === 0) {
            Alert.alert('Info', 'Tidak ada siswa untuk dicetak (sesuai filter aktif)');
            return;
        }

        try {
            Alert.alert('Memproses...', `Membuat PDF untuk ${filteredUsers.length} siswa`);

            // Generate HTML pages asynchronously first
            const htmlPagesArray = await Promise.all(filteredUsers.map(async (student: any) => {
                // Generate QR Code SVG locally
                const qrSvg = await QRCode.toString(student.id, {
                    type: 'svg',
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });

                return `
                <div style="page-break-after: always; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; box-sizing: border-box;">
                    <div style="background: white; border-radius: 20px; padding: 30px; width: 350px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">KARTU PELAJAR</h1>
                            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">SMA Global Madani</p>
                        </div>
                        <div style="margin: 20px auto; width: 200px; height: 200px; border: 3px solid #667eea; border-radius: 10px; overflow: hidden; display: flex; align-items: justify; justify-content: center;">
                            ${qrSvg}
                        </div>
                        <div style="text-align: left; padding: 0 10px;">
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; font-size: 12px; color: #666; font-weight: 600;">NAMA LENGKAP</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #333; font-weight: bold;">${student.name}</p>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; font-size: 12px; color: #666; font-weight: 600;">KELAS</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #333; font-weight: bold;">${student.class?.name || 'Belum Ada Kelas'}</p>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; font-size: 12px; color: #666; font-weight: 600;">NIS</p>
                                <p style="margin: 5px 0 0 0; font-size: 14px; color: #333; font-family: monospace;">${student.id.substring(0, 12)}</p>
                            </div>
                        </div>
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ddd;">
                            <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">Scan QR code untuk presensi</p>
                        </div>
                    </div>
                </div>
            `;
            }));

            const htmlPages = htmlPagesArray.join('');

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page { margin: 0; }
                        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                        svg { width: 100%; height: 100%; } 
                    </style>
                </head>
                <body>
                    ${htmlPages}
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                });
                Alert.alert('Berhasil', 'PDF berhasil dibuat dan siap dibagikan');
            } else {
                Alert.alert('Info', 'Fitur sharing tidak tersedia');
            }

        } catch (error: any) {
            console.error('Error generating PDF:', error);
            Alert.alert('Gagal', `Terjadi kesalahan saat membuat PDF: ${error.message || error}`);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const csvContent = "Name,Email,Password,Role,ClassName\nContoh Siswa SMA,siswa.sma@sekolah.com,123456,STUDENT,X IPA 1\nContoh Siswa SMK,siswa.smk@sekolah.com,123456,STUDENT,X TKJ 1\nContoh Guru,guru@sekolah.com,123456,TEACHER,";

            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "template_import_users.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            if (!dir) {
                console.log('FileSystem keys:', Object.keys(FileSystem));
                throw new Error('Directory penyimpanan tidak ditemukan (Local storage null)');
            }

            const fileUri = dir + "template_import_users.csv";
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Info', 'Fitur berbagi tidak tersedia di perangkat ini');
            }
        } catch (error: any) {
            console.error('Download Template Error:', error);
            Alert.alert('Gagal', `Tidak dapat membuat file template: ${error.message}`);
        }
    };

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const formData = new FormData();

            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            } as any);

            if (tenantId) {
                formData.append('tenantId', tenantId);
            }

            setLoading(true);
            const res = await client.post('/users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 seconds
                // Hapus transformRequest jika ada karena bisa merusak format FormData di RN
            });

            Alert.alert(
                'Import Selesai',
                `Berhasil: ${res.data.imported}, Gagal: ${res.data.failed}` + (res.data.failed > 0 ? '\nCek console untuk detail error.' : '')
            );

            if (res.data.errors && res.data.errors.length > 0) {
                console.log('Import errors:', res.data.errors);
            }

            fetchUsers();
        } catch (error: any) {
            console.error('Import Error:', error);
            const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengupload file.';
            Alert.alert('Gagal Import', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            let url = role === 'TEACHER' ? '/users/export-teachers' : '/users/export-students';

            if (role === 'STUDENT' && selectedClassFilter) {
                url += `?classId=${selectedClassFilter}`;
            }

            const resData = await client.get(url, { responseType: 'arraybuffer' });

            const uint8Array = new Uint8Array(resData.data);
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }

            const base64 = Platform.OS === 'web' ? window.btoa(binary) : (global as any).btoa(binary);

            const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;

            let filename = 'data.xlsx';
            if (role === 'TEACHER') {
                filename = 'daftar_guru.xlsx';
            } else {
                filename = selectedClassFilter
                    ? `daftar_siswa_${classes.find(c => c.id === selectedClassFilter)?.name || 'kelas'}.xlsx`
                    : 'daftar_siswa_semua.xlsx';
            }

            const fileUri = dir + filename;

            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Berhasil', `File disimpan di: ${fileUri}`);
            }
        } catch (error: any) {
            console.error('Export Error:', error);
            Alert.alert('Gagal Export', 'Terjadi kesalahan saat mengekspor data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncSubjects = async () => {
        try {
            setLoading(true);
            const res = await client.post('/subjects/sync');
            Alert.alert('Sinkronisasi Berhasil', res.data.data.message);
            fetchUsers();
        } catch (error: any) {
            console.error('Sync Error:', error);
            Alert.alert('Gagal Sinkronisasi', error.response?.data?.message || 'Terjadi kesalahan.');
        } finally {
            setLoading(false);
        }
    };

    const showImportOptions = () => {
        const label = role === 'TEACHER' ? 'Guru' : 'Siswa';
        const options: AlertButton[] = [
            { text: 'Download Template', onPress: handleDownloadTemplate },
            { text: `Import ${label} (Upload)`, onPress: handleImportExcel },
            { text: `Export ${label} (Download)`, onPress: handleExportExcel },
        ];

        if (role === 'TEACHER') {
            options.push({ text: 'Sync Mapel dari Jadwal', onPress: handleSyncSubjects });
        }

        options.push({ text: 'Batal', style: 'cancel' });

        Alert.alert(
            'Kelola Data Excel',
            'Pilih aksi yang ingin dilakukan',
            options
        );
    };

    const renderHeader = () => (
        <LinearGradient
            colors={[defaultColors.primary, defaultColors.primaryDark]}
            style={styles.header}
        >
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Data {getRoleLabel()}</Text>
                {(role === 'STUDENT' || role === 'TEACHER') && users.length > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                        {role === 'TEACHER' && (
                            <TouchableOpacity onPress={handleSyncSubjects} style={styles.backBtn}>
                                <Ionicons name="sync" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleExportExcel} style={styles.backBtn}>
                            <Ionicons name="download-outline" size={24} color="white" />
                        </TouchableOpacity>
                        {role === 'STUDENT' && (
                            <TouchableOpacity onPress={generateBulkPDF} style={styles.backBtn}>
                                <Ionicons name="print" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, flex: 1 }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={{ flex: 1, color: colors.text, height: '100%' }}
                        placeholder={`Cari ${getRoleLabel()}...`}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {role === 'STUDENT' && (
                    <TouchableOpacity
                        style={[styles.searchContainer, {
                            backgroundColor: colors.surface,
                            width: 48,
                            paddingHorizontal: 0,
                            justifyContent: 'center',
                            borderWidth: selectedClassFilter ? 1 : 0,
                            borderColor: defaultColors.primary
                        }]}
                        onPress={() => setShowClassFilterModal(true)}
                    >
                        <Ionicons
                            name={selectedClassFilter ? "filter" : "filter-outline"}
                            size={24}
                            color={selectedClassFilter ? defaultColors.primary : colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {selectedClassFilter && (
                <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginRight: 8 }}>Filter: Kelas {classes.find(c => c.id === selectedClassFilter)?.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedClassFilter(null)}>
                        <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: 'bold' }}>Hapus Filter</Text>
                    </TouchableOpacity>
                </View>
            )}
        </LinearGradient>
    );

    const renderItem = ({ item }: any) => (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatarContainer, { backgroundColor: defaultColors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: defaultColors.primary }]}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                {role === 'STUDENT' && item.class && (
                    <View style={[styles.classBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.classBadgeText, { color: colors.textSecondary }]}>{item.class.name}</Text>
                    </View>
                )}
                {role === 'TEACHER' && (
                    <View style={[styles.classBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons name="book-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.classBadgeText, { color: colors.textSecondary }]}>
                            {item.subjects && item.subjects.length > 0
                                ? item.subjects.map((s: any) => s.name).join(', ')
                                : (item.subject?.name || '-')}
                        </Text>
                    </View>
                )}
            </View>
            {role === 'STUDENT' && (
                <TouchableOpacity
                    style={[styles.cardBtn, { backgroundColor: '#E0F2FE' }]}
                    onPress={() => handleShowCard(item)}
                >
                    <Ionicons name="card-outline" size={20} color="#0284C7" />
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: defaultColors.primaryLight }]}
                onPress={() => openEditModal(item)}
            >
                <Ionicons name="create-outline" size={20} color={defaultColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: defaultColors.errorBackground }]}
                onPress={() => deleteUser(item.id, item.name)}
            >
                <Ionicons name="trash-outline" size={20} color={defaultColors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]} safeArea={false}>
            {renderHeader()}

            <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchUsers}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tidak ada data {getRoleLabel()}</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={[styles.fab, { bottom: 180, backgroundColor: defaultColors.success }]}
                onPress={showImportOptions}
                activeOpacity={0.9}
            >
                <Ionicons name="document-text-outline" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: defaultColors.primary }]}
                onPress={openCreateModal}
                activeOpacity={0.9}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingUser ? `Edit ${getRoleLabel()}` : `Tambah ${getRoleLabel()} Baru`}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
                            <TextInput
                                placeholder="Contoh: Budi Santoso"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                                value={form.name}
                                onChangeText={t => setForm({ ...form, name: t })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                            <TextInput
                                placeholder="email@sekolah.com"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                                value={form.email}
                                onChangeText={t => setForm({ ...form, email: t })}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                            </Text>
                            <TextInput
                                placeholder={editingUser ? "Kosongkan jika tidak diubah" : "******"}
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                                value={form.password}
                                onChangeText={t => setForm({ ...form, password: t })}
                                secureTextEntry
                            />
                        </View>

                        {role === 'TEACHER' && (
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Mata Pelajaran (Opsional)</Text>
                                <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                    <TouchableOpacity
                                        style={styles.picker}
                                        onPress={() => {
                                            if (subjects.length === 0) {
                                                Alert.alert('Info', 'Belum ada mata pelajaran. Silakan tambahkan mata pelajaran terlebih dahulu.');
                                                return;
                                            }
                                            setShowSubjectPicker(true);
                                        }}
                                    >
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text
                                                style={(form.subjectIds && form.subjectIds.length > 0) ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {form.subjectIds && form.subjectIds.length > 0
                                                    ? form.subjectIds.map(id => subjects.find((s: any) => s.id === id)?.name).filter(Boolean).join(', ')
                                                    : 'Pilih Mata Pelajaran'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {role === 'STUDENT' && (
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Kelas (Wajib)</Text>
                                <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                    <TouchableOpacity
                                        style={styles.picker}
                                        onPress={() => setShowClassPicker(true)}
                                    >
                                        <Text style={form.classId ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                                            {form.classId ? classes.find(c => c.id === form.classId)?.name || form.classId : 'Pilih Kelas'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: defaultColors.primary }]} onPress={handleSubmit}>
                            <Text style={styles.submitBtnText}>
                                {editingUser ? 'Perbarui Data' : 'Simpan Data'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ID Card Modal */}
            <Modal visible={cardModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.cardModalContent, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={styles.closeCardBtn}
                            onPress={() => setCardModalVisible(false)}
                        >
                            <Ionicons name="close-circle" size={32} color={colors.text} />
                        </TouchableOpacity>
                        {selectedStudent && (
                            <IdentityCard
                                user={{
                                    id: selectedStudent.id,
                                    name: selectedStudent.name,
                                    role: 'STUDENT',
                                    email: selectedStudent.email,
                                    tenantName: 'SMA Global Madani'
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>


            {/* Class Picker Modal */}
            <Modal visible={showClassPicker} animationType="slide" transparent onRequestClose={() => {
                setShowClassPicker(false);
                setClassSearchQuery('');
            }}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Kelas</Text>
                            <TouchableOpacity onPress={() => {
                                setShowClassPicker(false);
                                setClassSearchQuery('');
                            }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            height: 44,
                            marginBottom: 12
                        }}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 14, color: colors.text }}
                                placeholder="Cari Kelas..."
                                value={classSearchQuery}
                                onChangeText={setClassSearchQuery}
                                placeholderTextColor={colors.textSecondary}
                            />
                            {classSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setClassSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={classes.filter(c =>
                                c.name.toLowerCase().includes(classSearchQuery.toLowerCase())
                            )}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setForm({ ...form, classId: item.id });
                                        setShowClassPicker(false);
                                        setClassSearchQuery('');
                                    }}
                                >
                                    <View style={[styles.avatarContainer, { backgroundColor: defaultColors.primaryLight, width: 36, height: 36, marginRight: 12 }]}>
                                        <Ionicons name="people-outline" size={18} color={defaultColors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                                    </View>
                                    {form.classId === item.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={defaultColors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textSecondary }}>Kelas tidak ditemukan</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Subject Picker Modal */}
            <Modal visible={showSubjectPicker} animationType="slide" transparent onRequestClose={() => {
                setShowSubjectPicker(false);
                setSubjectSearchQuery('');
            }}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Mata Pelajaran</Text>
                            <TouchableOpacity onPress={() => {
                                setShowSubjectPicker(false);
                                setSubjectSearchQuery('');
                            }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            height: 44,
                            marginBottom: 12
                        }}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 14, color: colors.text }}
                                placeholder="Cari..."
                                value={subjectSearchQuery}
                                onChangeText={setSubjectSearchQuery}
                                placeholderTextColor={colors.textSecondary}
                            />
                            {subjectSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSubjectSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={subjects.filter(s =>
                                s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                                (s.code && s.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                            )}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        const currentIds = form.subjectIds || [];
                                        let newIds: string[];
                                        if (currentIds.includes(item.id)) {
                                            newIds = currentIds.filter(id => id !== item.id);
                                        } else {
                                            newIds = [...currentIds, item.id];
                                        }
                                        setForm({ ...form, subjectIds: newIds });
                                        // setShowSubjectPicker(false); // Don't close on multi-select
                                        // setSubjectSearchQuery('');
                                    }}
                                >
                                    <View style={[styles.avatarContainer, { backgroundColor: defaultColors.primaryLight, width: 36, height: 36, marginRight: 12 }]}>
                                        <Ionicons name="book-outline" size={18} color={defaultColors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Kode: {item.code || '-'}</Text>
                                    </View>
                                    {form.subjectIds?.includes(item.id) && (
                                        <Ionicons name="checkmark-circle" size={24} color={defaultColors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={() => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setForm({ ...form, subjectIds: [] });
                                        // setShowSubjectPicker(false);
                                    }}
                                >
                                    <View style={[styles.avatarContainer, { backgroundColor: '#f3f4f6', width: 36, height: 36, marginRight: 12 }]}>
                                        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.modalItemText, { color: colors.text }]}>Tidak Ada (Hapus Pilihan)</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Text style={{ color: colors.textSecondary }}>Belum ada mata pelajaran</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>


            {/* Class Filter Modal */}
            <Modal visible={showClassFilterModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Berdasarkan Kelas</Text>
                            <TouchableOpacity onPress={() => setShowClassFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={classes}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedClassFilter(item.id);
                                        setShowClassFilterModal(false);
                                    }}
                                >
                                    <View style={[styles.avatarContainer, { backgroundColor: defaultColors.primaryLight, width: 36, height: 36, marginRight: 12 }]}>
                                        <Ionicons name="school-outline" size={18} color={defaultColors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                                    </View>
                                    {selectedClassFilter === item.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={defaultColors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={() => (
                                <TouchableOpacity
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedClassFilter(null);
                                        setShowClassFilterModal(false);
                                    }}
                                >
                                    <View style={[styles.avatarContainer, { backgroundColor: '#f3f4f6', width: 36, height: 36, marginRight: 12 }]}>
                                        <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.modalItemText, { color: colors.text }]}>Semua Kelas</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Text style={{ color: colors.textSecondary }}>Belum ada data kelas</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        marginBottom: spacing.md
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
    searchContainer: {
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: 48
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100
    },
    card: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm
    },
    avatarContainer: {
        width: 50, height: 50,
        borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: { flex: 1 },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2
    },
    userEmail: {
        fontSize: 12,
    },
    classBadge: {
        marginTop: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    classBadgeText: {
        fontSize: 10,
        fontWeight: '500'
    },
    cardBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.xs
    },
    editBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.xs
    },
    deleteBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        alignItems: 'center', justifyContent: 'center'
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        opacity: 0.5
    },
    emptyText: { marginTop: 8 },

    fab: {
        position: 'absolute',
        bottom: 110, // Above tabs
        right: 20,
        width: 56, height: 56,
        borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        ...shadows.lg
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        minHeight: 400,
        maxHeight: '85%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    formGroup: { marginBottom: spacing.md },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // Increased padding
        minHeight: 56, // Taller button
    },
    pickerText: {
        fontSize: 16,
    },
    pickerPlaceholder: {
        fontSize: 16,
    },
    submitBtn: {
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
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16, // Increased vertical padding
        paddingHorizontal: 12, // Added horizontal padding
        borderBottomWidth: 1,
        minHeight: 60, // Taller items
    },
    modalItemText: {
        fontSize: 16,
        fontWeight: '500'
    },
    cardModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        alignItems: 'center',
        minHeight: 500
    },
    closeCardBtn: {
        alignSelf: 'flex-end',
        marginBottom: spacing.md
    }
});
