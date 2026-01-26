import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function EditProfileScreen({ navigation }: any) {
    const { user, setUser } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            Alert.alert('Gagal', 'Nama dan email wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const res = await client.put(`/users/${user?.id}`, {
                name: form.name,
                email: form.email
            });

            if (res.data?.data?.user) {
                const updatedUser = { ...user, ...res.data.data.user };
                setUser(updatedUser);
            }

            Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]} safeArea={false}>
            <LinearGradient
                colors={[defaultColors.primary, defaultColors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profil</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: defaultColors.primaryLight }]}>
                        <Ionicons name="person" size={48} color={defaultColors.primary} />
                    </View>
                    <Text style={[styles.roleText, { color: colors.textSecondary }]}>{user?.role || 'User'}</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                        placeholder="Masukkan nama lengkap"
                        placeholderTextColor={colors.textSecondary}
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                        placeholder="Masukkan email"
                        placeholderTextColor={colors.textSecondary}
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled, { backgroundColor: defaultColors.primary }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveBtnText}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
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
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },

    content: { flex: 1 },
    scrollContent: { padding: spacing.lg },

    avatarContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl
    },
    avatar: {
        width: 100, height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        ...shadows.md
    },
    roleText: {
        fontSize: 14,
        textTransform: 'capitalize'
    },

    formGroup: { marginBottom: spacing.lg },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.sm
    },
    input: {
        borderWidth: 1,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
    },

    saveBtn: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.md
    },
    saveBtnDisabled: {
        opacity: 0.6
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
