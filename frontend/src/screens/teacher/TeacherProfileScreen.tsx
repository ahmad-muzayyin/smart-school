import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/useAuthStore';
import { colors as defaultColors, spacing, typography, layout, shadows, getThemeColors } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

export default function TeacherProfileScreen({ navigation }: any) {
    const { user, logout } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const handleLogout = () => {
        Alert.alert(
            "Keluar",
            "Apakah Anda yakin ingin keluar?",
            [
                { text: "Batal", style: "cancel" },
                { text: "Keluar", style: "destructive", onPress: logout }
            ]
        );
    };

    const [biometricEnabled, setBiometricEnabled] = React.useState(false);

    React.useEffect(() => {
        checkBiometricStatus();
    }, []);

    const checkBiometricStatus = async () => {
        const creds = await SecureStore.getItemAsync('biometric_credentials');
        setBiometricEnabled(!!creds);
    };

    const toggleBiometric = async (value: boolean) => {
        if (!value) {
            // Turning OFF
            Alert.alert(
                'Nonaktifkan Biometrik',
                'Apakah Anda yakin ingin menghapus data login biometrik?',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Nonaktifkan',
                        style: 'destructive',
                        onPress: async () => {
                            await SecureStore.deleteItemAsync('biometric_credentials');
                            setBiometricEnabled(false);
                        }
                    }
                ]
            );
        } else {
            // Turning ON
            Alert.alert(
                'Aktifkan Biometrik',
                'Fitur ini akan aktif otomatis setelah Anda login kembali secara manual. Silakan logout dan login ulang.',
                [{ text: 'OK' }]
            );
            // We don't set to true because we don't have creds yet
        }
    };

    const MenuItem = ({ icon, label, onPress, danger, value, rightElement }: any) => (
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.background }, danger && styles.menuIconDanger]}>
                <Ionicons name={icon} size={20} color={danger ? defaultColors.error : colors.text} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.text }, danger && styles.menuLabelDanger]}>{label}</Text>
                {value && <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text>}
            </View>
            {rightElement || <Ionicons name="chevron-forward" size={16} color={defaultColors.gray300} />}
        </TouchableOpacity>
    );

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background } as any]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'GU'}</Text>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>GURU PENGAJAR</Text>
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informasi Akun</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <MenuItem icon="person-outline" label="NIP / ID" value={user?.id?.substring(0, 8)} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="business-outline" label="ID Sekolah" value={user?.tenantId?.substring(0, 8)} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="mail-outline" label="Email" value={user?.email} />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Pengaturan</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <MenuItem
                            icon="finger-print-outline"
                            label="Login Biometrik"
                            rightElement={
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={toggleBiometric}
                                    trackColor={{ false: '#767577', true: defaultColors.primaryLight }}
                                    thumbColor={biometricEnabled ? defaultColors.primary : '#f4f3f4'}
                                />
                            }
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem
                            icon="lock-closed-outline"
                            label="Ganti Password"
                            onPress={() => navigation.navigate('ChangePassword')}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem
                            icon="notifications-outline"
                            label="Notifikasi"
                            onPress={() => navigation.navigate('NotificationSettings')}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem
                            icon="help-circle-outline"
                            label="Bantuan"
                            onPress={() => navigation.navigate('Help')}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <MenuItem
                            icon="log-out-outline"
                            label="Keluar"
                            danger
                            onPress={handleLogout}
                        />
                    </View>
                </View>

                <Text style={[styles.versionText, { color: colors.textSecondary }]}>Versi 1.0.0</Text>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {

    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: 20,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h3,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginBottom: spacing.lg,
        ...shadows.sm,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: defaultColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        ...shadows.md,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        ...typography.h2,
        marginBottom: 4,
    },
    email: {
        ...typography.body,
        marginBottom: spacing.md,
    },
    roleBadge: {
        backgroundColor: defaultColors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '700',
        color: defaultColors.primary,
        letterSpacing: 0.5,
    },
    sectionContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.caption,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        ...shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    menuIconDanger: {
        backgroundColor: defaultColors.errorBackground,
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    menuLabelDanger: {
        color: defaultColors.error,
    },
    menuValue: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginLeft: 56, // Icon width + margin
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: spacing.sm,
    }
});

