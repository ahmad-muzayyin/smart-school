import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, typography, shadows, layout } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import * as Location from 'expo-location';

export default function SchoolSettingsScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [limit, setLimit] = useState('100');

    // Only school admin/owner should access this
    const tenantId = user?.tenant?.id || user?.tenantId;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Fetch tenant details
            const res = await client.get(`/tenants/${tenantId}`);
            const tenant = res.data.data.tenant;

            if (tenant.latitude) setLatitude(String(tenant.latitude));
            if (tenant.longitude) setLongitude(String(tenant.longitude));
            if (tenant.allowedRadius) setLimit(String(tenant.allowedRadius));

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal memuat pengaturan sekolah');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!latitude || !longitude || !limit) {
            Alert.alert('Eror', 'Semua kolom harus diisi');
            return;
        }

        setSubmitting(true);
        try {
            await client.patch(`/tenants/${tenantId}`, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                allowedRadius: parseInt(limit)
            });
            Alert.alert('Berhasil', 'Pengaturan lokasi sekolah berhasil disimpan');
            navigation.goBack();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGetCurrentLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk fitur ini');
            return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLatitude(String(loc.coords.latitude));
        setLongitude(String(loc.coords.longitude));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lokasi Sekolah</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.description}>
                        Tentukan lokasi sekolah dan radius toleransi untuk presensi guru. Guru hanya dapat melakukan absen jika berada dalam radius yang ditentukan.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Radius (Meter)</Text>
                        <TextInput
                            style={styles.input}
                            value={limit}
                            onChangeText={setLimit}
                            keyboardType="numeric"
                            placeholder="100"
                        />
                        <Text style={styles.hint}>Jarak maksimal guru dari pusat lokasi sekolah.</Text>
                    </View>

                    <View style={styles.coordsContainer}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Latitude</Text>
                            <TextInput
                                style={styles.input}
                                value={latitude}
                                onChangeText={setLatitude}
                                keyboardType="numeric" // Note: iOS might need numbers-and-punctuation
                                placeholder="-6.1234..."
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Longitude</Text>
                            <TextInput
                                style={styles.input}
                                value={longitude}
                                onChangeText={setLongitude}
                                keyboardType="numeric"
                                placeholder="106.1234..."
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.locationBtn} onPress={handleGetCurrentLocation}>
                        <Ionicons name="location" size={20} color="white" />
                        <Text style={styles.locationBtnText}>Ambil Lokasi Saat Ini</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, submitting && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 20,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.text },
    content: { padding: spacing.lg },

    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.lg,
        ...shadows.sm,
        marginBottom: spacing.xl
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 20
    },
    inputGroup: { marginBottom: spacing.md },
    label: {
        ...typography.caption,
        color: colors.text,
        marginBottom: 6,
        fontWeight: '600'
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        fontSize: 16,
        color: colors.text
    },
    hint: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4
    },
    coordsContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md
    },
    locationBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 5
    },
    locationBtnText: { color: 'white', fontWeight: '600' },

    saveBtn: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12
    },
    disabledBtn: {
        opacity: 0.7
    },
    saveBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
