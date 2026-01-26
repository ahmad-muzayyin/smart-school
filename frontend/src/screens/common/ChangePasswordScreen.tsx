import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChangePasswordScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { isDarkMode } = useThemeStore();
    const { logout } = useAuthStore();
    const colors = getThemeColors(isDarkMode);

    const handleChangePassword = async () => {
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            Alert.alert('Gagal', 'Semua field wajib diisi');
            return;
        }

        if (form.newPassword.length < 6) {
            Alert.alert('Gagal', 'Password baru minimal 6 karakter');
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            Alert.alert('Gagal', 'Password baru dan konfirmasi tidak cocok');
            return;
        }

        setLoading(true);
        try {
            await client.post('/auth/update-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });

            Alert.alert(
                'Berhasil',
                'Password berhasil diubah. Silakan login kembali.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await logout();
                        }
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan');
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
                    <Text style={styles.headerTitle}>Ubah Password</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.infoCard, { backgroundColor: defaultColors.primaryLight }]}>
                    <Ionicons name="information-circle" size={24} color={defaultColors.primary} />
                    <Text style={[styles.infoText, { color: defaultColors.primary }]}>
                        Password baru minimal 6 karakter. Setelah berhasil, Anda akan diminta login kembali.
                    </Text>
                </View>

                <PasswordInput
                    label="Password Saat Ini"
                    value={form.currentPassword}
                    onChangeText={(text: string) => setForm({ ...form, currentPassword: text })}
                    show={showCurrent}
                    toggleShow={() => setShowCurrent(!showCurrent)}
                    colors={colors}
                />

                <PasswordInput
                    label="Password Baru"
                    value={form.newPassword}
                    onChangeText={(text: string) => setForm({ ...form, newPassword: text })}
                    show={showNew}
                    toggleShow={() => setShowNew(!showNew)}
                    colors={colors}
                />

                <PasswordInput
                    label="Konfirmasi Password Baru"
                    value={form.confirmPassword}
                    onChangeText={(text: string) => setForm({ ...form, confirmPassword: text })}
                    show={showConfirm}
                    toggleShow={() => setShowConfirm(!showConfirm)}
                    colors={colors}
                />

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled, { backgroundColor: defaultColors.primary }]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <Ionicons name="lock-closed" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>
                        {loading ? 'Mengubah Password...' : 'Ubah Password'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </Screen>
    );
}

const PasswordInput = ({ label, value, onChangeText, show, toggleShow, colors }: any) => (
    <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={[styles.passwordContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Masukkan password"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!show}
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={toggleShow} style={styles.eyeBtn}>
                <Ionicons
                    name={show ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    </View>
);



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

    infoCard: {
        flexDirection: 'row',
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        alignItems: 'center'
    },
    infoText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 13,
        lineHeight: 18
    },

    formGroup: { marginBottom: spacing.lg },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.sm
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: layout.borderRadius.md,
    },
    passwordInput: {
        flex: 1,
        padding: spacing.md,
        fontSize: 16,
    },
    eyeBtn: {
        padding: spacing.md
    },

    saveBtn: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
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
