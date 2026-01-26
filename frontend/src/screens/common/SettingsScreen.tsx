import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function SettingsScreen({ navigation }: any) {
    const { t } = useTranslation();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const handleLogout = () => {
        Alert.alert(
            t('settings.logoutTitle'),
            t('settings.logoutMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.logoutButton'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('user');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const handleProfile = () => {
        navigation.navigate('EditProfile');
    };

    const handleNotifications = () => {
        navigation.navigate('NotificationSettings');
    };

    const handleLanguage = () => {
        navigation.navigate('LanguageSettings');
    };

    const handlePrivacy = () => {
        navigation.navigate('PrivacySettings');
    };

    const handleVersion = () => {
        Alert.alert(
            t('settings.version'),
            'School Attendance Management System\nVersi 1.0.0\n\n© 2026 All Rights Reserved',
            [{ text: t('common.ok') }]
        );
    };

    const handleTerms = () => {
        navigation.navigate('Help');
    };

    const handlePrivacyPolicy = () => {
        navigation.navigate('PrivacyPolicy');
    };

    const SettingItem = ({ icon, title, subtitle, onPress, danger, isSwitch, switchValue, onSwitchChange }: any) => (
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={onPress} disabled={isSwitch}>
            <View style={[styles.iconContainer,
            danger && { backgroundColor: defaultColors.errorBackground },
            !danger && { backgroundColor: defaultColors.primaryLight }
            ]}>
                <Ionicons name={icon} size={22} color={danger ? defaultColors.error : defaultColors.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }, danger && { color: defaultColors.error }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            {isSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: colors.border, true: defaultColors.primary }}
                    thumbColor={'white'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
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
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERAL</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="person-outline"
                            title={t('settings.profile')}
                            subtitle={t('settings.profileSubtitle')}
                            onPress={handleProfile}
                        />
                        <SettingItem
                            icon="notifications-outline"
                            title={t('settings.notifications')}
                            subtitle={t('settings.notificationsSubtitle')}
                            onPress={handleNotifications}
                        />
                        <SettingItem
                            icon="language-outline"
                            title={t('settings.language')}
                            subtitle={t('settings.languageSubtitle')}
                            onPress={handleLanguage}
                        />
                        <SettingItem
                            icon={isDarkMode ? "moon" : "moon-outline"}
                            title="Dark Mode"
                            subtitle={isDarkMode ? "On" : "Off"}
                            isSwitch
                            switchValue={isDarkMode}
                            onSwitchChange={toggleTheme}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="lock-closed-outline"
                            title={t('settings.changePassword')}
                            subtitle={t('settings.changePasswordSubtitle')}
                            onPress={handleChangePassword}
                        />
                        <SettingItem
                            icon="shield-checkmark-outline"
                            title={t('settings.privacy')}
                            subtitle={t('settings.privacySubtitle')}
                            onPress={handlePrivacy}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="information-circle-outline"
                            title={t('settings.version')}
                            subtitle="v1.0.0"
                            onPress={handleVersion}
                        />
                        <SettingItem
                            icon="document-text-outline"
                            title={t('settings.help')}
                            onPress={handleTerms}
                        />
                        <SettingItem
                            icon="shield-outline"
                            title={t('settings.privacyPolicy')}
                            onPress={handlePrivacyPolicy}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <SettingItem
                            icon="log-out-outline"
                            title={t('auth.logout')}
                            subtitle={t('settings.logoutMessage')}
                            onPress={handleLogout}
                            danger
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
