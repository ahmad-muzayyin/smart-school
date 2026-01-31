import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '../../components/ui/Screen'; // Adjust based on your project structure
import { colors, spacing, typography, shadows } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ImportScheduleScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleDownloadTemplate = async () => {
        try {
            setLoading(true);
            const res = await client.get('/import/template?type=schedules', { responseType: 'blob' });
            // In React Native with axios, responseType 'blob' might need specific handling or using FileSystem.downloadAsync
            // Let's use FileSystem.downloadAsync instead for reliable file download

            const fileUri = FileSystem.documentDirectory + 'Template_Jadwal.xlsx';
            // Need Auth Header manually if using FileSystem directly?
            // Easier: Get URL and download.
            // Or use client to get Base64?

            // Simpler approach for axios in RN:
            // Since we customized axios client, gettingblob might be tricky.
            // Let's assume the backend sends file.

            // ALTERNATIVE: Use Linking to open in browser? No, need Auth.
            // Let's try FileSystem download with headers.

            // Hacky but works: just creating a download link might not work in App.
            // Let's use the API client to get data as base64 if possible or arraybuffer.

            // Actually, client.ts usually has interceptors.
            // Let's assume we can get a download link if we had one.
            // But we don't.

            // Let's try to just use `FileSystem.downloadAsync` with headers from store.
            // But getting token from store here is async. 
            // Let's skip for a moment and focus on Upload logic which is more critical.
            // For Download, we can just say "Please contact admin" or try standard approach later.

            // Better: Use `FileSystem.downloadAsync` with headers.
            // I'll leave a TODO or try to implement if I can import store.
            Alert.alert('Info', 'Fitur download template sedang disiapkan. Silakan hubungi admin untuk file template.');
        } catch (e) {
            console.error(e);
            Alert.alert('Gagal', 'Gagal download template');
        } finally {
            setLoading(false);
        }
    };

    // DOWNLOAD TEMPLATE IMPLEMENTATION
    const downloadTemplate = async () => {
        try {
            setLoading(true);

            // Access token from storage or assume axios client handles it
            // Using axios client which already has interceptors for Auth
            const response = await client.get('/import/template?type=schedules', {
                responseType: 'blob' // IMPORTANT: Receive binary data
            });

            // WEB DOWNLOAD LOGIC
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Template_Smart_Jadwal.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Alert.alert('Sukses', 'Template berhasil didownload. Cek folder download Anda.');

        } catch (e: any) {
            console.error('Download error:', e);
            Alert.alert('Gagal', 'Gagal mendownload template: ' + (e.message || 'Server error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;
            const file = result.assets[0];

            setLoading(true);
            setReport(null);

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            } as any);

            const res = await client.post('/import/schedules', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setReport(res.data);
            Alert.alert('Selesai', `Import selesai. Sukses: ${res.data.summary.imported}, Gagal: ${res.data.summary.failed}`);

        } catch (e: any) {
            console.error(e);
            Alert.alert('Gagal', e.response?.data?.message || 'Gagal upload file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Import Jadwal Massal</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>1. Download Template</Text>
                    <Text style={styles.desc}>
                        Unduh template Excel yang sudah berisi daftar Guru, Kelas, dan Mapel sekolah Anda untuk menghindari kesalahan ketik.
                    </Text>
                    <TouchableOpacity style={styles.downloadBtn} onPress={downloadTemplate}>
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text style={styles.btnText}>Download Template.xlsx</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>2. Upload Data</Text>
                    <Text style={styles.desc}>
                        Upload file Excel yang sudah diisi. Sistem akan memvalidasi data secara otomatis.
                    </Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                                <Text style={styles.btnText}>Pilih File Excel & Upload</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {report && (
                    <View style={styles.reportCard}>
                        <Text style={styles.sectionTitle}>Laporan Hasil Import</Text>
                        <View style={styles.statRow}>
                            <View style={[styles.statBadge, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.statValue, { color: '#2E7D32' }]}>{report.summary.imported}</Text>
                                <Text style={styles.statLabel}>Berhasil</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FFEBEE' }]}>
                                <Text style={[styles.statValue, { color: '#C62828' }]}>{report.summary.failed}</Text>
                                <Text style={styles.statLabel}>Gagal</Text>
                            </View>
                        </View>

                        {report.errors.length > 0 && (
                            <View style={styles.errorList}>
                                <Text style={styles.errorHeader}>Detail Error:</Text>
                                {report.errors.map((err: any, idx: number) => (
                                    <View key={idx} style={styles.errorItem}>
                                        <Text style={styles.errorRow}>Baris {err.row}:</Text>
                                        <Text style={styles.errorMsg}>{err.error}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, ...shadows.sm },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    content: { padding: 20 },
    card: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, marginBottom: 20, ...shadows.sm },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: colors.text },
    desc: { fontSize: 14, color: colors.textSecondary, marginBottom: 15, lineHeight: 20 },
    downloadBtn: { backgroundColor: '#0288D1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 8 },
    uploadBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 8 },
    btnText: { color: 'white', fontWeight: 'bold' },
    reportCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, marginTop: 10, borderTopWidth: 4, borderTopColor: colors.primary },
    statRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    statBadge: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 8 },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 12, color: colors.textSecondary },
    errorList: { marginTop: 10 },
    errorHeader: { fontWeight: 'bold', marginBottom: 8, color: '#C62828' },
    errorItem: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    errorRow: { fontWeight: 'bold', fontSize: 12 },
    errorMsg: { fontSize: 12, color: '#D32F2F' }
});
