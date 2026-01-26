import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, shadows, spacing, palette } from '../../theme/theme';

export default function TeacherClassesScreen({ navigation }: any) {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const data = res.data.data.schedules;
            // Uniquify by classId
            const uniqueClasses = data.reduce((acc: any[], curr: any) => {
                if (!acc.find(item => item.classId === curr.classId)) {
                    acc.push(curr);
                }
                return acc;
            }, []);
            setClasses(uniqueClasses);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <Ionicons name="school" size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.className}>{item.class.name}</Text>
                <Text style={styles.subject}>{item.subject}</Text>
            </View>
            <View style={styles.badge}>
                <Ionicons name="people" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>{item.class.students?.length || 0} Siswa</Text>
            </View>
        </View>
    );

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[palette.brandBlue, palette.brandBlueSoft]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daftar Kelas</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <FlatList
                data={classes}
                renderItem={renderItem}
                keyExtractor={item => item.id} // Schedule ID but unique per class in this view logic
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Belum ada kelas</Text>
                    </View>
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    list: { padding: spacing.md },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm
    },
    iconBox: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    className: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    subject: { fontSize: 14, color: colors.textSecondary },
    badge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
    },
    badgeText: { fontSize: 12, color: colors.primary, fontWeight: '600', marginLeft: 4 },
    empty: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: colors.textSecondary }
});
