import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function PrivacySettingsScreen({ navigation }: any) {
    const [settings, setSettings] = useState({
        shareData: false,
        analytics: false,
        locationTracking: false,
        profileVisibility: true,
        activityStatus: true
    });

    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('privacySettings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
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
                    <Text style={styles.headerTitle}>Privasi</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.infoCard, { backgroundColor: defaultColors.primaryLight }]}>
                    <Ionicons name="shield-checkmark" size={24} color={defaultColors.primary} />
                    <Text style={[styles.infoText, { color: defaultColors.primary }]}>
                        Kelola pengaturan privasi Anda untuk mengontrol bagaimana data Anda digunakan.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Pengumpulan Data</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="share-social"
                            title="Berbagi Data"
                            subtitle="Izinkan berbagi data dengan pihak ketiga"
                            value={settings.shareData}
                            onToggle={() => toggleSetting('shareData')}
                        />
                        <SettingItem
                            icon="analytics"
                            title="Analytics"
                            subtitle="Bantu tingkatkan aplikasi dengan data analytics"
                            value={settings.analytics}
                            onToggle={() => toggleSetting('analytics')}
                        />
                        <SettingItem
                            icon="location"
                            title="Pelacakan Lokasi"
                            subtitle="Izinkan aplikasi melacak lokasi Anda"
                            value={settings.locationTracking}
                            onToggle={() => toggleSetting('locationTracking')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Visibilitas</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="person"
                            title="Visibilitas Profil"
                            subtitle="Tampilkan profil Anda ke pengguna lain"
                            value={settings.profileVisibility}
                            onToggle={() => toggleSetting('profileVisibility')}
                        />
                        <SettingItem
                            icon="pulse"
                            title="Status Aktivitas"
                            subtitle="Tampilkan status online Anda"
                            value={settings.activityStatus}
                            onToggle={() => toggleSetting('activityStatus')}
                        />
                    </View>
                </View>

                <View style={[styles.noteCard, { backgroundColor: colors.surface, borderLeftColor: defaultColors.primary }]}>
                    <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={[styles.noteTitle, { color: colors.text }]}>Catatan Privasi</Text>
                        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                            Data Anda aman dan terenkripsi. Kami tidak akan membagikan informasi pribadi Anda tanpa persetujuan eksplisit.
                        </Text>
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

    noteCard: {
        flexDirection: 'row',
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        borderLeftWidth: 4,
        alignItems: 'flex-start'
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs
    },
    noteText: {
        fontSize: 13,
        lineHeight: 18
    }
});
