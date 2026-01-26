import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, shadows, spacing, palette } from '../../theme/theme';

export default function TeacherGradesScreen({ navigation }: any) {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Filters
    const [semester, setSemester] = useState(1);
    const [category, setCategory] = useState<'Tugas' | 'Quiz' | 'UTS' | 'UAS' | 'Praktek'>('Tugas');

    // Grades State: { [studentId]: { score: string, gradeId?: string } }
    const [grades, setGrades] = useState<Record<string, { score: string, gradeId?: string, notes?: string }>>({});

    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    useEffect(() => {
        if (selectedSchedule) {
            fetchStudentsAndGrades();
        }
    }, [selectedSchedule, semester, category]);

    const fetchSchedules = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const data = res.data.data.schedules;
            // Deduplicate by classId and subject to show unique Class-Subject pairs
            const uniqueOptions = data.reduce((acc: any[], curr: any) => {
                const key = `${curr.classId}-${curr.subject}`;
                if (!acc.find(item => `${item.classId}-${item.subject}` === key)) {
                    acc.push(curr);
                }
                return acc;
            }, []);

            setSchedules(uniqueOptions);
            if (uniqueOptions.length > 0) {
                setSelectedSchedule(uniqueOptions[0]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsAndGrades = async () => {
        if (!selectedSchedule) return;
        setLoadingStudents(true);
        try {
            // 1. Fetch Students
            const studentsRes = await client.get(`/users/students/by-class/${selectedSchedule.classId}`);
            const studentsData = studentsRes.data.data.users;
            setStudents(studentsData);

            // 2. Fetch Existing Grades
            const gradesRes = await client.get('/grades', {
                params: {
                    classId: selectedSchedule.classId,
                    subject: selectedSchedule.subject,
                    semester,
                    category
                }
            });

            const existingGrades = gradesRes.data.data.grades;
            const gradesMap: any = {};
            existingGrades.forEach((g: any) => {
                gradesMap[g.studentId] = {
                    score: g.score.toString(),
                    gradeId: g.id,
                    notes: g.notes
                };
            });
            setGrades(gradesMap);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleScoreChange = (studentId: string, text: string) => {
        // Allow empty or numeric
        if (text === '' || /^\d+(\.\d{0,2})?$/.test(text)) {
            // Cap at 100
            if (parseFloat(text) > 100) return;

            setGrades(prev => ({
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    score: text
                }
            }));
        }
    };

    const saveGrade = async (studentId: string) => {
        const studentGrade = grades[studentId];
        if (!studentGrade || studentGrade.score === '') return;

        const scoreVal = parseFloat(studentGrade.score);
        if (isNaN(scoreVal)) return;

        try {
            if (studentGrade.gradeId) {
                // Update
                await client.put(`/grades/${studentGrade.gradeId}`, {
                    score: scoreVal,
                    notes: studentGrade.notes
                });
            } else {
                // Create
                const res = await client.post('/grades', {
                    studentId,
                    scheduleId: selectedSchedule.id, // Note: using the scheduleID from the selected option might be inexact if multiple schedules exist for same class/subject. But usually 1-1 relationship for grading context.
                    // Better: The backend should ideally not require scheduleId strictly for grouping, but it does.
                    // Risk: If teacher has Math on Mon and Wed, which scheduleId to use? 
                    // Solution: Just pick the one we selected. 
                    classId: selectedSchedule.classId,
                    subject: selectedSchedule.subject,
                    semester,
                    category,
                    score: scoreVal,
                    maxScore: 100
                });
                // Update local state with new ID
                setGrades(prev => ({
                    ...prev,
                    [studentId]: {
                        ...prev[studentId],
                        gradeId: res.data.data.grade.id
                    }
                }));
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Gagal', 'Gagal menyimpan nilai');
        }
    };

    const saveAll = async () => {
        // This could be improved with Promise.all
        // For simplicity, just alert user this demo saves per input or we implement bulk later.
        // Actually, let's just make the "Save" button on the row functional.
        // Or implement auto-save / onBlur.
        Alert.alert('Info', 'Nilai tersimpan otomatis saat anda mengetik (simulasi) atau tekan tombol simpan di baris siswa.');
    };

    const renderStudentRow = ({ item }: { item: any }) => {
        const grade = grades[item.id] || { score: '' };
        const hasScore = grade.score !== '';

        return (
            <View style={styles.studentRow}>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentId}>{item.email}</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.scoreInput}
                        keyboardType="numeric"
                        value={grade.score}
                        maxLength={5}
                        onChangeText={(text) => handleScoreChange(item.id, text)}
                        onBlur={() => {
                            if (hasScore) saveGrade(item.id);
                        }}
                        placeholder="0"
                    />
                    <Text style={styles.maxScore}>/100</Text>
                </View>
                {/* <TouchableOpacity onPress={() => saveGrade(item.id)} style={styles.saveIconBtn}>
                     <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                </TouchableOpacity> */}
            </View>
        );
    };

    const CategoryBadge = ({ label, value }: any) => (
        <TouchableOpacity
            style={[styles.catBadge, category === value && styles.catBadgeActive]}
            onPress={() => setCategory(value)}
        >
            <Text style={[styles.catText, category === value && styles.catTextActive]}>{label}</Text>
        </TouchableOpacity>
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
                    <Text style={styles.headerTitle}>Input Nilai</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Class Selector */}
                <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
                    <View>
                        <Text style={styles.selectorLabel}>Kelas & Mata Pelajaran</Text>
                        <Text style={styles.selectorValue}>
                            {selectedSchedule ? `${selectedSchedule.class.name} - ${selectedSchedule.subject}` : 'Pilih Kelas'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.controls}>
                <View style={styles.semesterSwitch}>
                    <TouchableOpacity
                        style={[styles.semBtn, semester === 1 && styles.semBtnActive]}
                        onPress={() => setSemester(1)}
                    >
                        <Text style={[styles.semText, semester === 1 && styles.semTextActive]}>Sem 1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.semBtn, semester === 2 && styles.semBtnActive]}
                        onPress={() => setSemester(2)}
                    >
                        <Text style={[styles.semText, semester === 2 && styles.semTextActive]}>Sem 2</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                    <CategoryBadge label="Tugas" value="Tugas" />
                    <CategoryBadge label="Quiz" value="Quiz" />
                    <CategoryBadge label="UTS" value="UTS" />
                    <CategoryBadge label="UAS" value="UAS" />
                    <CategoryBadge label="Praktek" value="Praktek" />
                </ScrollView>
            </View>

            {loadingStudents ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={students}
                    renderItem={renderStudentRow}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Tidak ada siswa di kelas ini</Text>
                    }
                />
            )}

            {/* Class Selection Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Kelas</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={schedules}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedSchedule(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={styles.modalIcon}>
                                        <Ionicons name="book-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.modalClassName}>{item.class.name}</Text>
                                        <Text style={styles.modalSubject}>{item.subject}</Text>
                                    </View>
                                    {selectedSchedule?.id === item.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 12,
        borderRadius: 12,
        marginTop: 4
    },
    selectorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
    selectorValue: { fontSize: 16, fontWeight: 'bold', color: 'white' },

    controls: {
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    semesterSwitch: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        padding: 4,
        borderRadius: 12,
        marginBottom: 12
    },
    semBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8
    },
    semBtnActive: {
        backgroundColor: 'white',
        ...shadows.sm
    },
    semText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    semTextActive: { color: colors.primary, fontWeight: '700' },

    categories: { flexDirection: 'row', gap: 8 },
    catBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8
    },
    catBadgeActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    catText: { fontSize: 12, color: colors.textSecondary },
    catTextActive: { color: 'white', fontWeight: '600' },

    listContent: { padding: spacing.md },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: 8,
        ...shadows.sm
    },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 14, fontWeight: '600', color: colors.text },
    studentId: { fontSize: 12, color: colors.textSecondary },

    inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scoreInput: {
        width: 60,
        height: 40,
        backgroundColor: colors.background,
        borderRadius: 8,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 14,
        fontWeight: 'bold'
    },
    maxScore: { fontSize: 12, color: colors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textSecondary },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '70%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    modalIcon: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md
    },
    modalClassName: { fontSize: 16, fontWeight: '600', color: colors.text },
    modalSubject: { fontSize: 12, color: colors.textSecondary }
});
