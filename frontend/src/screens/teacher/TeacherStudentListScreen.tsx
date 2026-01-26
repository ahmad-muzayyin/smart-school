import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { IdentityCard } from '../../components/common/IdentityCard';
import { colors, layout, shadows, spacing, palette } from '../../theme/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function TeacherStudentListScreen({ navigation }: any) {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [cardModalVisible, setCardModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        console.log('TeacherStudentListScreen mounted');
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const res = await client.get('/classes/schedules');
            const data = res.data.data.schedules;
            // Get unique classes
            const uniqueClasses = data.reduce((acc: any[], curr: any) => {
                if (!acc.find(item => item.classId === curr.classId)) {
                    acc.push(curr);
                }
                return acc;
            }, []);
            setSchedules(uniqueClasses);
            if (uniqueClasses.length > 0) {
                setSelectedClass(uniqueClasses[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedClass) return;
        try {
            const res = await client.get(`/users/students/by-class/${selectedClass.classId}`);
            setStudents(res.data.data.users);
        } catch (error) {
            console.error(error);
        }
    };

    const handleShowCard = (student: any) => {
        setSelectedStudent(student);
        setCardModalVisible(true);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
            </View>
            {/* <TouchableOpacity style={styles.infoBtn}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity> */}
            <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => handleShowCard(item)}
            >
                <Ionicons name="id-card-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const generatePDF = async () => {
        if (!selectedStudent) return;

        const html = `
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .card {
                        width: 350px;
                        height: 550px;
                        background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
                        border-radius: 20px;
                        padding: 20px;
                        color: white;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    }
                    .header h1 {
                        font-size: 24px;
                        margin: 10px 0 5px;
                        letter-spacing: 1px;
                    }
                    .header h2 {
                        font-size: 14px;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        opacity: 0.8;
                    }
                    .avatar {
                        width: 120px;
                        height: 120px;
                        background: white;
                        border-radius: 50%;
                        margin: 30px auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 50px;
                        color: #1a237e;
                        font-weight: bold;
                        border: 4px solid rgba(255,255,255,0.3);
                    }
                    .info h3 {
                        font-size: 28px;
                        margin: 10px 0;
                    }
                    .info p {
                        font-size: 16px;
                        color: #90caf9;
                        margin: 0 0 20px;
                    }
                    .id-box {
                        background: rgba(0,0,0,0.2);
                        padding: 10px;
                        border-radius: 10px;
                        display: inline-block;
                        margin-bottom: 20px;
                    }
                    .footer {
                        background: white;
                        padding: 15px;
                        border-radius: 15px;
                        color: black;
                        margin-top: 20px;
                    }
                    .barcode {
                       font-size: 12px;
                       margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h1>${selectedStudent.tenant?.name || 'CHIKO ATTENDANCE'}</h1>
                        <h2>Student ID Card</h2>
                    </div>
                    <div class="avatar">
                        ${selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="info">
                        <h3>${selectedStudent.name}</h3>
                        <p>STUDENT</p>
                        <div class="id-box">
                            ID: ${selectedStudent.id.substring(0, 8).toUpperCase()}
                        </div>
                    </div>
                    <div class="footer">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedStudent.id}" width="100" height="100" />
                        <div class="barcode">Scan for Attendance</div>
                    </div>
                </div>
            </body>
        </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
        }
    };

    const generateBulkPDF = async () => {
        if (filteredStudents.length === 0) {
            Alert.alert('Info', 'Tidak ada siswa untuk dicetak pada tampilan ini');
            return;
        }

        const cardsHtml = filteredStudents.map(student => `
        <div class="page-container">
            <div class="card">
                <div class="header">
                    <h1>${student.tenant?.name || 'CHIKO ATTENDANCE'}</h1>
                    <h2>Student ID Card</h2>
                </div>
                <div class="avatar">
                    ${student.name.charAt(0).toUpperCase()}
                </div>
                <div class="info">
                    <h3>${student.name}</h3>
                    <p>STUDENT</p>
                    <div class="id-box">
                        ID: ${student.id.substring(0, 8).toUpperCase()}
                    </div>
                </div>
                <div class="footer">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}" width="100" height="100" />
                    <div class="barcode">Scan for Attendance</div>
                </div>
            </div>
        </div>
        `).join('');

        const html = `
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        margin: 0;
                        background-color: #f0f0f0;
                        -webkit-print-color-adjust: exact;
                    }
                    .page-container {
                        height: 100vh;
                        width: 100vw;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        page-break-after: always;
                    }
                    .page-container:last-child {
                        page-break-after: auto;
                    }
                    .card {
                        width: 350px;
                        height: 550px;
                        background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
                        border-radius: 20px;
                        padding: 20px;
                        color: white;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    }
                    /* Shared CSS from generatePDF */
                    .header h1 { font-size: 24px; margin: 10px 0 5px; letter-spacing: 1px; color: white;}
                    .header h2 { font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; color: white;}
                    .avatar {
                        width: 120px; height: 120px; background: white; border-radius: 50%;
                        margin: 30px auto; display: flex; align-items: center; justify-content: center;
                        font-size: 50px; color: #1a237e; font-weight: bold; border: 4px solid rgba(255,255,255,0.3);
                    }
                    .info h3 { font-size: 28px; margin: 10px 0; color: white;}
                    .info p { font-size: 16px; color: #90caf9; margin: 0 0 20px; }
                    .id-box { background: rgba(0,0,0,0.2); padding: 10px; border-radius: 10px; display: inline-block; margin-bottom: 20px; color: white;}
                    .footer { background: white; padding: 15px; border-radius: 15px; color: black; margin-top: 20px; }
                    .barcode { font-size: 12px; margin-top: 5px; }
                </style>
            </head>
            <body>
                ${cardsHtml}
            </body>
        </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Gagal', 'Terjadi kesalahan saat membuat PDF');
        }
    };

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
                    <Text style={styles.headerTitle}>Data Siswa</Text>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={generateBulkPDF}
                        >
                            <Ionicons name="print-outline" size={20} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={() => navigation.navigate('ScanAttendance', {
                                scheduleId: selectedClass?.id,
                                classId: selectedClass?.classId
                            })}
                        >
                            <Ionicons name="qr-code-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
                    <View>
                        <Text style={styles.selectorLabel}>Kelas Terpilih</Text>
                        <Text style={styles.selectorValue}>
                            {selectedClass ? selectedClass.class.name : 'Pilih Kelas'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredStudents}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Tidak ada siswa ditemukan</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Pilih Kelas</Text>
                        <FlatList
                            data={schedules}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedClass(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={styles.modalIcon}>
                                        <Ionicons name="people-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.modalClassName}>{item.class.name}</Text>
                                        <Text style={styles.modalSubject}>{item.class.students?.length || 0} Siswa</Text>
                                    </View>
                                    {selectedClass?.classId === item.classId && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ID Card Modal */}
            <Modal visible={cardModalVisible} transparent animationType="fade">
                <View style={styles.cardModalOverlay}>
                    <TouchableOpacity
                        style={styles.cardModalCloseArea}
                        activeOpacity={1}
                        onPress={() => setCardModalVisible(false)}
                    />
                    <View style={styles.cardModalContent}>
                        {selectedStudent && (
                            <IdentityCard user={{
                                id: selectedStudent.id,
                                name: selectedStudent.name,
                                role: 'STUDENT',
                                tenantName: selectedStudent.tenant?.name
                            }} />
                        )}
                        <View style={{ flexDirection: 'row', gap: 20, marginTop: 30 }}>
                            <TouchableOpacity
                                onPress={generatePDF}
                                style={styles.actionBtn}
                            >
                                <Ionicons name="print" size={24} color="white" />
                                <Text style={styles.actionBtnText}>Cetak / PDF</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setCardModalVisible(false)}
                                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                            >
                                <Ionicons name="close-circle" size={24} color="white" />
                                <Text style={styles.actionBtnText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen >
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
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    scanBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 12,
        borderRadius: 12
    },
    selectorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
    selectorValue: { fontSize: 16, fontWeight: 'bold', color: 'white' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        height: 48,
        ...shadows.sm
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.border
    },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    email: { fontSize: 12, color: colors.textSecondary },
    infoBtn: { padding: 8 },

    empty: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: colors.textSecondary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
    modalIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    modalClassName: { fontSize: 16, fontWeight: '600', color: colors.text },
    modalSubject: { fontSize: 12, color: colors.textSecondary },
    closeBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
    closeText: { color: colors.primary, fontWeight: 'bold' },

    cardModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    cardModalCloseArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    cardModalContent: { alignItems: 'center', zIndex: 10 },
    closeCardBtn: { marginTop: 30 },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        ...shadows.md
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
