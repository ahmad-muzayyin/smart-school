import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, layout, spacing, shadows, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

export default function HelpScreen({ navigation }: any) {

    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const HelpItem = ({ icon, title, description, onPress }: any) => (
        <TouchableOpacity style={[styles.helpCard, { backgroundColor: colors.surface }]} onPress={onPress}>
            <View style={[styles.helpIcon, { backgroundColor: defaultColors.primaryLight }]}>
                <Ionicons name={icon} size={28} color={defaultColors.primary} />
            </View>
            <View style={styles.helpContent}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.helpDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    const FAQItem = ({ question, answer }: any) => (
        <View style={[styles.faqCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
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
                    <Text style={styles.headerTitle}>Bantuan</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.headerSubtitle}>Kami siap membantu Anda</Text>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Hubungi Kami</Text>
                    <HelpItem
                        icon="mail-outline"
                        title="Email Support"
                        description="muzayyin.rpl@gmail.com"
                        onPress={() => Linking.openURL('mailto:muzayyin.rpl@gmail.com')}
                    />
                    <HelpItem
                        icon="call-outline"
                        title="Telepon"
                        description="+62 823-3257-5257"
                        onPress={() => Linking.openURL('tel:+6282332575257')}
                    />
                    <HelpItem
                        icon="logo-whatsapp"
                        title="WhatsApp"
                        description="Chat dengan tim support"
                        onPress={() => Linking.openURL('https://wa.me/6282332575257')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Pertanyaan Umum (FAQ)</Text>
                    <FAQItem
                        question="Bagaimana cara mengisi presensi?"
                        answer="Guru dapat mengisi presensi melalui menu Jadwal, pilih kelas yang sesuai, lalu klik tombol 'Isi Presensi'."
                    />
                    <FAQItem
                        question="Bagaimana cara melihat laporan presensi?"
                        answer="Admin dapat melihat laporan presensi melalui menu 'Laporan Presensi' di dashboard. Laporan dapat difilter berdasarkan tanggal."
                    />
                    <FAQItem
                        question="Bagaimana cara menambah siswa baru?"
                        answer="Admin dapat menambah siswa melalui menu 'Data Siswa', kemudian klik tombol '+' di pojok kanan bawah."
                    />
                    <FAQItem
                        question="Lupa password, apa yang harus dilakukan?"
                        answer="Silakan hubungi admin sekolah atau tim support kami untuk reset password."
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Panduan</Text>
                    <HelpItem
                        icon="book-outline"
                        title="Panduan Pengguna"
                        description="Pelajari cara menggunakan aplikasi"
                        onPress={() => { }}
                    />
                    <HelpItem
                        icon="videocam-outline"
                        title="Video Tutorial"
                        description="Tonton video panduan lengkap"
                        onPress={() => { }}
                    />
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
        marginBottom: spacing.sm,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    content: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },

    section: { marginBottom: spacing.xl },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    helpIcon: {
        width: 56, height: 56,
        borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md
    },
    helpContent: { flex: 1 },
    helpTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    helpDescription: { fontSize: 13 },

    faqCard: {
        borderRadius: layout.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 20
    },
});
