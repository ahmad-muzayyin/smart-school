import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, shadows, spacing, palette, layout } from '../../theme/theme';

export default function TeacherAttendanceScreen({ navigation }: any) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [cameraRef, setCameraRef] = useState<any>(null); // This might need fix with new Camera API
    const [photo, setPhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Status
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'checkin' | 'checkout' | 'history'>('checkin');

    // CameraView ref
    const cameraViewRef = useRef<CameraView>(null);

    useEffect(() => {
        (async () => {
            // Camera Permission
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();

            // Location Permission
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

            setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');

            if (locationStatus === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
        })();

        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await client.get('/teacher-attendance/today');
            setTodayStatus(res.data.data);

            if (res.data.data.checkedOut) {
                fetchHistory();
                setViewMode('history');
            } else if (res.data.data.checkedIn) {
                setViewMode('checkout');
            } else {
                setViewMode('checkin');
            }
        } catch (error) {
            console.log('Error fetching status:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await client.get('/teacher-attendance/history');
            setHistory(res.data.data.history);
        } catch (error) {
            console.log('Error fetching history:', error);
        }
    };

    const takePicture = async () => {
        if (cameraViewRef.current) {
            const photoData = await cameraViewRef.current.takePictureAsync({
                quality: 0.5,
                base64: true,
            });
            setPhoto(photoData ? `data:image/jpg;base64,${photoData.base64}` : null);
        }
    };

    const retakePicture = () => {
        setPhoto(null);
    };

    const handleSubmit = async () => {
        if (!photo || !location) {
            Alert.alert('Error', 'Foto dan Lokasi diperlukan!');
            return;
        }

        setLoading(true);
        try {
            const endpoint = viewMode === 'checkin' ? '/teacher-attendance/check-in' : '/teacher-attendance/check-out';

            const payload = {
                [viewMode === 'checkin' ? 'checkInLat' : 'checkOutLat']: location.coords.latitude,
                [viewMode === 'checkin' ? 'checkInLong' : 'checkOutLong']: location.coords.longitude,
                [viewMode === 'checkin' ? 'checkInPhoto' : 'checkOutPhoto']: photo,
                // checkInAddress: "..." // Optional if we reverse geocode
            };

            await client.post(endpoint, payload);

            Alert.alert('Berhasil', `Berhasil ${viewMode === 'checkin' ? 'Check In' : 'Check Out'}!`);
            fetchStatus();
            setPhoto(null);
        } catch (error: any) {
            Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Text>Tidak ada akses kamera/lokasi.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
                    <Text style={styles.btnText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderCamera = () => (
        <View style={styles.cameraContainer}>
            {photo ? (
                <Image source={{ uri: photo }} style={styles.preview} />
            ) : (
                <CameraView
                    ref={cameraViewRef}
                    style={styles.camera}
                    facing="front"
                />
            )}

            <View style={styles.controls}>
                {photo ? (
                    <View style={styles.row}>
                        <TouchableOpacity onPress={retakePicture} style={[styles.controlBtn, { backgroundColor: colors.error }]}>
                            <Ionicons name="refresh" size={24} color="white" />
                            <Text style={styles.controlText}>Ulang</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} style={[styles.controlBtn, { backgroundColor: colors.success }]}>
                            {loading ? <ActivityIndicator color="white" /> : <Ionicons name="checkmark" size={24} color="white" />}
                            <Text style={styles.controlText}>Kirim</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                )}
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
                    <Text style={styles.headerTitle}>Presensi Saya</Text>
                    {/* Refresh logic optional */}
                </View>

                {todayStatus && (
                    <View style={styles.statusSummary}>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Masuk</Text>
                            <Text style={styles.statusValue}>
                                {todayStatus?.attendance?.checkInTime
                                    ? new Date(todayStatus.attendance.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Pulang</Text>
                            <Text style={styles.statusValue}>
                                {todayStatus?.attendance?.checkOutTime
                                    ? new Date(todayStatus.attendance.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </Text>
                        </View>
                    </View>
                )}
            </LinearGradient>

            <View style={styles.content}>
                {viewMode === 'history' ? (
                    <ScrollView style={styles.historyList}>
                        <Text style={styles.sectionTitle}>Riwayat Kehadiran</Text>
                        {history.map((item) => (
                            <View key={item.id} style={styles.historyCard}>
                                <View>
                                    <Text style={styles.historyDate}>
                                        {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </Text>
                                    <Text style={[styles.historyStatus,
                                    { color: item.status === 'LATE' ? colors.warning : colors.success }]}>
                                        {item.status}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.historyTime}>In: {new Date(item.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    <Text style={styles.historyTime}>Out: {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <>
                        <View style={styles.infoBox}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={styles.infoText}>
                                {location ? `Lat: ${location.coords.latitude.toFixed(4)}, Long: ${location.coords.longitude.toFixed(4)}` : 'Mencari lokasi...'}
                            </Text>
                        </View>

                        <Text style={styles.prompt}>
                            {viewMode === 'checkin' ? 'Ambil Foto untuk Check In' : 'Ambil Foto untuk Check Out'}
                        </Text>

                        {renderCamera()}
                    </>
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },

    statusSummary: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 15,
        justifyContent: 'space-between'
    },
    statusItem: { flex: 1, alignItems: 'center' },
    statusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
    statusValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

    content: { flex: 1, padding: spacing.lg },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        ...shadows.sm
    },
    infoText: { marginLeft: 10, color: colors.text, fontSize: 14 },

    prompt: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10, textAlign: 'center' },

    cameraContainer: {
        height: 400,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'black',
        position: 'relative'
    },
    camera: { flex: 1 },
    preview: { flex: 1 },

    controls: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    captureBtn: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center', alignItems: 'center'
    },
    captureInner: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'white'
    },
    row: { flexDirection: 'row', gap: 20 },
    controlBtn: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 30, gap: 8
    },
    controlText: { color: 'white', fontWeight: '600' },

    btn: { marginTop: 20, padding: 10, backgroundColor: colors.primary, borderRadius: 8 },
    btnText: { color: 'white' },

    historyList: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: colors.text },
    historyCard: {
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm
    },
    historyDate: { fontWeight: 'bold', fontSize: 14, color: colors.text },
    historyStatus: { fontSize: 12, marginTop: 4, fontWeight: '600' },
    historyTime: { fontSize: 12, color: colors.textSecondary }
});
