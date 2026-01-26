import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function NotificationSettingsScreen({ navigation }: any) {
    const [settings, setSettings] = useState({
        pushNotifications: true,
        emailNotifications: false,
        attendanceReminders: true,
        scheduleChanges: true,
        systemUpdates: false,
        soundEnabled: true,
        vibrationEnabled: true
    });

    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('notificationSettings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const toggleSetting = (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
    };

    const SettingItem = ({ icon, title, subtitle, value, onToggle }: any) => (
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: defaultColors.primaryLight }]}>
                <Ionicons name={icon} size={22} color={defaultColors.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: defaultColors.primaryLight }}
                thumbColor={value ? defaultColors.primary : colors.textSecondary}
            />
        </View>
    );

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
                    <Text style={styles.headerTitle}>Notifikasi</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifikasi Push</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="notifications"
                            title="Push Notifications"
                            subtitle="Terima notifikasi di perangkat"
                            value={settings.pushNotifications}
                            onToggle={() => toggleSetting('pushNotifications')}
                        />
                        <SettingItem
                            icon="mail"
                            title="Email Notifications"
                            subtitle="Terima notifikasi via email"
                            value={settings.emailNotifications}
                            onToggle={() => toggleSetting('emailNotifications')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Jenis Notifikasi</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="alarm"
                            title="Pengingat Absensi"
                            subtitle="Ingatkan untuk absensi"
                            value={settings.attendanceReminders}
                            onToggle={() => toggleSetting('attendanceReminders')}
                        />
                        <SettingItem
                            icon="calendar"
                            title="Perubahan Jadwal"
                            subtitle="Notifikasi jika ada perubahan jadwal"
                            value={settings.scheduleChanges}
                            onToggle={() => toggleSetting('scheduleChanges')}
                        />
                        <SettingItem
                            icon="information-circle"
                            title="Update Sistem"
                            subtitle="Informasi update aplikasi"
                            value={settings.systemUpdates}
                            onToggle={() => toggleSetting('systemUpdates')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferensi</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="volume-high"
                            title="Suara"
                            subtitle="Aktifkan suara notifikasi"
                            value={settings.soundEnabled}
                            onToggle={() => toggleSetting('soundEnabled')}
                        />
                        <SettingItem
                            icon="phone-portrait"
                            title="Getar"
                            subtitle="Aktifkan getaran notifikasi"
                            value={settings.vibrationEnabled}
                            onToggle={() => toggleSetting('vibrationEnabled')}
                        />
                    </View>
                </View>
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
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },

    section: { marginBottom: spacing.xl },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    card: {
        borderRadius: layout.borderRadius.lg,
        ...shadows.sm
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40, height: 40,
        borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md
    },
    settingContent: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
    settingSubtitle: { fontSize: 13 },
});
