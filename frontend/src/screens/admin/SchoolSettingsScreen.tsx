import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, typography, shadows, layout } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
export default function SchoolSettingsScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Profile State
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [logo, setLogo] = useState<string | null>(null);

    // Location State
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [limit, setLimit] = useState('100');

    const tenantId = user?.tenantId;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await client.get(`/tenants/${tenantId}`);
            const tenant = res.data.data.tenant;

            setName(tenant.name || '');
            setAddress(tenant.address || '');
            setPhone(tenant.phone || '');
            setWebsite(tenant.website || '');
            setLogo(tenant.logo || null);

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

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setLogo(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !latitude || !longitude || !limit) {
            Alert.alert('Eror', 'Nama Sekolah dan Lokasi wajib diisi');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('address', address);
            formData.append('phone', phone);
            formData.append('website', website);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('allowedRadius', limit);

            if (logo && !logo.startsWith('http')) {
                formData.append('logo', {
                    uri: logo,
                    name: 'school_logo.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            await client.patch(`/tenants/${tenantId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Berhasil', 'Pengaturan sekolah berhasil disimpan');
            // navigation.goBack(); // Optional: Stay to see changes
            fetchSettings(); // Refresh
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
                <Text style={styles.headerTitle}>Pengaturan Sekolah</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* School Profile Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Profil Sekolah</Text>

                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={pickImage} style={styles.logoPlaceholder}>
                            {logo ? (
                                <Image source={{ uri: logo }} style={styles.logoImage} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="camera" size={32} color={colors.textSecondary} />
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Upload Logo</Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Sekolah</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Contoh: SMA Negeri 1..." />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Alamat</Text>
                        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Jalan Raya..." multiline />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telepon</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="021-..." />
                    </View>
                </View>

                {/* Location Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lokasi & Presensi</Text>
                    <Text style={styles.description}>
                        Tentukan titik koordinat sekolah untuk validasi presensi guru.
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
                    </View>

                    <View style={styles.coordsContainer}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Latitude</Text>
                            <TextInput
                                style={styles.input}
                                value={latitude}
                                onChangeText={setLatitude}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Longitude</Text>
                            <TextInput
                                style={styles.input}
                                value={longitude}
                                onChangeText={setLongitude}
                                keyboardType="numeric"
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
                        <Text style={styles.saveBtnText}>Simpan Pengubahan</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
    },
    logoImage: {
        width: '100%',
        height: '100%'
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white'
    }
});
