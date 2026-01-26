import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function PrivacyPolicyScreen({ navigation }: any) {
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const Section = ({ title, content }: any) => (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{content}</Text>
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
                    <Text style={styles.headerTitle}>Kebijakan Privasi</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.lastUpdated, { backgroundColor: colors.surface }]}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>Terakhir diperbarui: 18 Januari 2026</Text>
                </View>

                <Section
                    title="1. Pengumpulan Informasi"
                    content="Kami mengumpulkan informasi yang Anda berikan saat mendaftar dan menggunakan aplikasi, termasuk nama, email, dan data absensi. Informasi ini digunakan untuk menyediakan layanan manajemen absensi sekolah."
                />

                <Section
                    title="2. Penggunaan Informasi"
                    content="Informasi yang dikumpulkan digunakan untuk:
• Menyediakan dan memelihara layanan
• Mengelola akun pengguna
• Melacak kehadiran siswa dan guru
• Menghasilkan laporan absensi
• Mengirim notifikasi terkait layanan"
                />

                <Section
                    title="3. Keamanan Data"
                    content="Kami mengimplementasikan langkah-langkah keamanan yang sesuai untuk melindungi data pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Data Anda dienkripsi dan disimpan dengan aman."
                />

                <Section
                    title="4. Berbagi Informasi"
                    content="Kami tidak akan menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa persetujuan eksplisit Anda, kecuali diwajibkan oleh hukum."
                />

                <Section
                    title="5. Hak Pengguna"
                    content="Anda memiliki hak untuk:
• Mengakses data pribadi Anda
• Memperbarui atau mengoreksi informasi
• Menghapus akun Anda
• Menolak penggunaan data tertentu
• Mengunduh data Anda"
                />

                <Section
                    title="6. Cookies dan Teknologi Pelacakan"
                    content="Kami menggunakan cookies dan teknologi pelacakan serupa untuk meningkatkan pengalaman pengguna, menganalisis penggunaan aplikasi, dan menyediakan fitur yang dipersonalisasi."
                />

                <Section
                    title="7. Perlindungan Data Anak"
                    content="Aplikasi ini digunakan dalam konteks pendidikan. Data siswa di bawah umur dilindungi dengan standar keamanan tambahan dan hanya dapat diakses oleh pihak sekolah yang berwenang."
                />

                <Section
                    title="8. Perubahan Kebijakan"
                    content="Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui aplikasi atau email."
                />

                <Section
                    title="9. Kontak"
                    content="Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui:
Email: muzayyin.rpl@gmail.com
Telepon: +62 823-3257-5257
WhatsApp: +62 823-3257-5257"
                />

                <View style={[styles.acceptCard, { backgroundColor: defaultColors.primaryLight }]}>
                    <Ionicons name="shield-checkmark" size={32} color={defaultColors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[styles.acceptTitle, { color: defaultColors.primary }]}>Privasi Anda Penting</Text>
                        <Text style={[styles.acceptText, { color: defaultColors.primary }]}>
                            Dengan menggunakan aplikasi ini, Anda menyetujui kebijakan privasi kami.
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

    lastUpdated: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        padding: spacing.sm,
        borderRadius: layout.borderRadius.sm,
    },
    lastUpdatedText: {
        marginLeft: spacing.xs,
        fontSize: 12,
        fontStyle: 'italic'
    },

    section: {
        marginBottom: spacing.lg,
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        ...shadows.sm
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.sm
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 22
    },

    acceptCard: {
        flexDirection: 'row',
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md
    },
    acceptTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.xs
    },
    acceptText: {
        fontSize: 13,
        lineHeight: 18
    }
});
