import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button'; // Assuming you have a reusable Button component
import { colors, spacing, typography, layout, shadows } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';

export default function StudentPermissionScreen({ navigation }: any) {
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [reason, setReason] = useState('Sakit'); // Default
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const reasons = ['Sakit', 'Izin', 'Acara Keluarga', 'Lainnya'];

    const handleSubmit = async () => {
        if (!notes && reason === 'Lainnya') {
            Alert.alert('Perhatian', 'Mohon isi keterangan untuk alasan Lainnya');
            return;
        }

        setLoading(true);
        try {
            await client.post('/attendance/permission', {
                date: date.toISOString(),
                reason,
                notes
            });
            Alert.alert('Berhasil', 'Pengajuan izin berhasil dikirim.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengajuan Izin</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Tanggal Izin</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={styles.dateText}>
                            {date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    <Text style={styles.label}>Alasan</Text>
                    <View style={styles.reasonContainer}>
                        {reasons.map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.reasonChip,
                                    reason === r && styles.activeReasonChip
                                ]}
                                onPress={() => setReason(r)}
                            >
                                <Text style={[
                                    styles.reasonText,
                                    reason === r && styles.activeReasonText
                                ]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Keterangan Tambahan</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Contoh: Sakit demam sejak semalam..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            Izin yang diajukan akan otomatis tercatat untuk semua mata pelajaran pada tanggal tersebut.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    label="Kirim Pengajuan"
                    onPress={handleSubmit}
                    loading={loading}
                    size="lg"
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm,
        zIndex: 10
    },
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.text },
    content: { padding: spacing.lg },

    card: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.md,
        padding: spacing.lg,
        ...shadows.sm
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        marginTop: 16
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: colors.background
    },
    dateText: {
        marginLeft: 10,
        fontSize: 16,
        color: colors.text
    },

    reasonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    reasonChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background
    },
    activeReasonChip: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    reasonText: {
        fontSize: 14,
        color: colors.textSecondary
    },
    activeReasonText: {
        color: 'white',
        fontWeight: '600'
    },

    textArea: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: colors.background,
        fontSize: 16,
        color: colors.text,
        minHeight: 100
    },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: colors.primary + '10', // 10% opacity
        padding: 12,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
        gap: 10
    },
    infoText: {
        fontSize: 13,
        color: colors.text,
        flex: 1,
        lineHeight: 18
    },

    footer: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border
    }
});
