import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

const LANGUAGES = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export default function LanguageSettingsScreen({ navigation }: any) {
    const { i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'id');
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    useEffect(() => {
        setSelectedLanguage(i18n.language || 'id');
    }, [i18n.language]);

    const selectLanguage = async (code: string) => {
        try {
            await i18n.changeLanguage(code);
            setSelectedLanguage(code);

            Alert.alert(
                code === 'id' ? 'Bahasa Diubah' : code === 'en' ? 'Language Changed' : 'تم تغيير اللغة',
                code === 'id'
                    ? 'Bahasa aplikasi telah diubah.'
                    : code === 'en'
                        ? 'Application language has been changed.'
                        : 'تم تغيير لغة التطبيق.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to change language');
        }
    };

    const LanguageItem = ({ language }: any) => (
        <TouchableOpacity
            style={[styles.languageItem, { borderBottomColor: colors.border }]}
            onPress={() => selectLanguage(language.code)}
        >
            <View style={styles.languageLeft}>
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={[styles.languageName, { color: colors.text }]}>{language.name}</Text>
            </View>
            {selectedLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={24} color={defaultColors.primary} />
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
                    <Text style={styles.headerTitle}>Bahasa</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.infoCard, { backgroundColor: defaultColors.primaryLight }]}>
                    <Ionicons name="information-circle" size={24} color={defaultColors.primary} />
                    <Text style={[styles.infoText, { color: defaultColors.primary }]}>
                        Pilih bahasa yang ingin digunakan dalam aplikasi. Perubahan akan diterapkan setelah restart aplikasi.
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    {LANGUAGES.map((language) => (
                        <LanguageItem key={language.code} language={language} />
                    ))}
                </View>

                <View style={[styles.noteCard, { backgroundColor: colors.surface, borderLeftColor: defaultColors.primary }]}>
                    <Text style={[styles.noteTitle, { color: colors.text }]}>Catatan:</Text>
                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                        • Bahasa Indonesia: Bahasa default aplikasi{'\n'}
                        • English: Coming soon{'\n'}
                        • العربية: Coming soon
                    </Text>
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
    scrollContent: { padding: spacing.lg },

    infoCard: {
        flexDirection: 'row',
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        alignItems: 'center'
    },
    infoText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 13,
        lineHeight: 18
    },

    card: {
        borderRadius: layout.borderRadius.lg,
        ...shadows.sm,
        marginBottom: spacing.lg
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 32,
        marginRight: spacing.md
    },
    languageName: {
        fontSize: 16,
        fontWeight: '500',
    },

    noteCard: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        borderLeftWidth: 4,
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs
    },
    noteText: {
        fontSize: 13,
        lineHeight: 20
    }
});
