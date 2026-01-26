import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, layout, spacing, shadows } from '../../theme/theme';

export default function CreateScheduleScreen({ navigation, route }: any) {
    const editingSchedule = route.params?.schedule || null;

    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [day, setDay] = useState('1');
    const [start, setStart] = useState('08:00');
    const [end, setEnd] = useState('09:00');

    const [modalType, setModalType] = useState<'CLASS' | 'TEACHER' | 'SUBJECT' | null>(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    const closeModal = () => {
        setModalType(null);
        setModalSearchQuery('');
    };

    const getFilteredData = () => {
        const query = modalSearchQuery.toLowerCase();
        let data: any[] = [];
        if (modalType === 'CLASS') data = classes;
        else if (modalType === 'TEACHER') data = teachers;
        else if (modalType === 'SUBJECT') data = subjects;

        if (!query) return data;

        return data.filter(item =>
            item.name?.toLowerCase().includes(query) ||
            (item.email && item.email.toLowerCase().includes(query)) ||
            (item.code && item.code.toLowerCase().includes(query)) ||
            (item.subject?.name && item.subject.name.toLowerCase().includes(query))
        );
    };

    useEffect(() => {
        client.get('/classes').then(res => setClasses(res.data.data.classes)).catch(console.error);
        client.get('/users/teachers').then(res => setTeachers(res.data.data.users)).catch(console.error);
        client.get('/subjects').then(res => setSubjects(res.data.data.subjects)).catch(console.error);
    }, []);

    useEffect(() => {
        if (editingSchedule) {
            setSelectedClass(editingSchedule.class);
            setSelectedTeacher(editingSchedule.teacher);

            // Fix Subject Binding: editingSchedule.subject is a String name, but state expects Object
            const subjectName = typeof editingSchedule.subject === 'string'
                ? editingSchedule.subject
                : editingSchedule.subject?.name;

            if (subjectName) {
                const foundSubject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
                if (foundSubject) {
                    setSelectedSubject(foundSubject);
                } else {
                    // Fallback to display text if subject not in master list yet
                    setSelectedSubject({ name: subjectName });
                }
            }

            setDay(editingSchedule.dayOfWeek.toString());
            setStart(editingSchedule.startTime);
            setEnd(editingSchedule.endTime);
        }
    }, [editingSchedule, subjects]);

    // Auto-select subject when teacher is selected
    // Auto-select subject when teacher is selected (only if subject not yet currently selected)
    useEffect(() => {
        if (selectedTeacher && selectedTeacher.subjects && selectedTeacher.subjects.length === 1 && !selectedSubject) {
            const teacherSubject = subjects.find(s => s.id === selectedTeacher.subjects[0].id);
            if (teacherSubject) {
                setSelectedSubject(teacherSubject);
            }
        }
    }, [selectedTeacher, subjects]);

    const submit = async () => {
        if (!selectedClass || !selectedTeacher || !selectedSubject) {
            Alert.alert("Gagal", "Mohon lengkapi semua data");
            return;
        }
        try {
            const data = {
                classId: selectedClass.id,
                teacherId: selectedTeacher.id,
                subject: selectedSubject.name,
                dayOfWeek: parseInt(day),
                startTime: start,
                endTime: end
            };

            if (editingSchedule) {
                await client.put(`/classes/schedules/${editingSchedule.id}`, data);
                Alert.alert("Berhasil", "Jadwal berhasil diperbarui");
            } else {
                await client.post('/classes/schedules', data);
                Alert.alert("Berhasil", "Jadwal berhasil dibuat");
            }
            navigation.goBack();
        } catch (e) {
            Alert.alert("Gagal", "Terjadi kesalahan");
        }
    };

    const getDayName = (d: string) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[parseInt(d)] || 'Pilih Hari';
    };

    const FormItem = ({ label, value, onPress, placeholder, icon }: any) => (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.inputBtn} onPress={onPress}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {icon && <Ionicons name={icon} size={20} color={colors.textSecondary} />}
                    <Text style={{ color: value ? colors.text : colors.textSecondary }}>
                        {value || placeholder}
                    </Text>
                </View>
                {onPress && <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
        </View>
    );

    return (
        <Screen style={styles.container} safeArea={false}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {editingSchedule ? 'Edit Jadwal Pelajaran' : 'Buat Jadwal Pelajaran'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <View style={styles.formContainer}>
                <FormItem
                    label="Pilih Kelas"
                    value={selectedClass?.name}
                    placeholder="-- Pilih Kelas --"
                    icon="school-outline"
                    onPress={() => setModalType('CLASS')}
                />

                <FormItem
                    label="Pilih Guru Pengajar"
                    value={selectedTeacher?.name}
                    placeholder="-- Pilih Guru --"
                    icon="person-outline"
                    onPress={() => setModalType('TEACHER')}
                />

                <FormItem
                    label="Pilih Mata Pelajaran"
                    value={selectedSubject?.name}
                    placeholder="-- Pilih Mata Pelajaran --"
                    icon="book-outline"
                    onPress={() => setModalType('SUBJECT')}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Hari (0=Mgg, 1=Sen...)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="1"
                            keyboardType="numeric"
                            value={day}
                            onChangeText={setDay}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Jam Mulai</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="08:00"
                            value={start}
                            onChangeText={setStart}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Jam Selesai</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="09:30"
                            value={end}
                            onChangeText={setEnd}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={submit}>
                    <Text style={styles.submitBtnText}>Simpan Jadwal</Text>
                </TouchableOpacity>
            </View>



            <Modal visible={modalType !== null} animationType="slide" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'CLASS' ? 'Pilih Kelas' : modalType === 'TEACHER' ? 'Pilih Guru' : 'Pilih Mata Pelajaran'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            height: 44,
                            marginBottom: 12
                        }}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 14, color: colors.text }}
                                placeholder="Cari..."
                                value={modalSearchQuery}
                                onChangeText={setModalSearchQuery}
                                placeholderTextColor={colors.textSecondary}
                            />
                            {modalSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={getFilteredData()}
                            keyExtractor={i => i.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => {
                                    if (modalType === 'CLASS') {
                                        setSelectedClass(item);
                                    } else if (modalType === 'TEACHER') {
                                        setSelectedTeacher(item);
                                    } else if (modalType === 'SUBJECT') {
                                        setSelectedSubject(item);
                                    }
                                    closeModal();
                                }}>
                                    <Ionicons
                                        name={modalType === 'CLASS' ? "school-outline" : modalType === 'TEACHER' ? "person-outline" : "book-outline"}
                                        size={20}
                                        color={colors.primary}
                                        style={{ marginRight: 12 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {modalType === 'TEACHER' && item.subjects && item.subjects.length > 0 && (
                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                                Mata Pelajaran: {item.subjects.map((s: any) => s.name).join(', ')}
                                            </Text>
                                        )}
                                        {modalType === 'SUBJECT' && item.code && (
                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                                Kode: {item.code}
                                            </Text>
                                        )}
                                    </View>
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
    container: { flex: 1, backgroundColor: colors.background },
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    },
    formContainer: {
        padding: spacing.lg
    },
    formGroup: { marginBottom: spacing.md },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8
    },
    inputBtn: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: colors.surface,
        color: colors.text
    },
    row: {
        flexDirection: 'row',
        marginBottom: spacing.md
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.md
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        height: '60%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center'
    },
    modalItemText: { fontSize: 16, color: colors.text }
});
