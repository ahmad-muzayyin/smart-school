
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { colors, shadows, spacing, palette } from '../../theme/theme';

export default function ScanAttendanceScreen({ route, navigation }: any) {
    const { scheduleId, classId } = route.params;
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const [lastScannedName, setLastScannedName] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (processing || scanned) return;

        setScanned(true);
        setProcessing(true);
        setScanStatus(null);
        setLastScannedName(null);

        try {
            const studentId = data;

            await client.post('/attendance', {
                scheduleId,
                studentId,
                date: new Date().toISOString(),
                status: 'PRESENT'
            });

            // Fetch student info if needed, or backend returns it
            // Assuming backend returns student name in response structure
            // For now, let's assume successful 200 OK means it worked. 
            // We can try to fetch the name if we want, or just say "Berhasil"
            // Actually, in previous code: res.data.data.attendance.student?.name

            // Let's re-fetch or trust valid ID. 
            // To be safe and fast:
            const res = await client.get(`/users/${studentId}`);
            const studentName = res.data.data.user.name;

            setProcessing(false); // Stop processing indicator before showing feedback
            setLastScannedName(studentName);
            setScanStatus('success');

            // Auto reset after 1.5 seconds for next scan
            setTimeout(() => {
                setScanned(false);
                setScanStatus(null);
                setLastScannedName(null);
            }, 1500);

        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Gagal';

            setProcessing(false); // Stop processing indicator before showing feedback
            setLastScannedName(message); // Re-purpose for error message
            setScanStatus('error');

            // Auto reset after 2 seconds
            setTimeout(() => {
                setScanned(false);
                setScanStatus(null);
                setLastScannedName(null);
            }, 2000);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.center}>
                <Text>Minta izin kamera...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Text>Tidak ada akses kamera.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
                    <Text style={styles.btnText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Scan Barcode</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <View style={styles.cameraContainer}>
                <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.overlay}>
                    <View style={[
                        styles.scanBox,
                        scanStatus === 'success' && { borderColor: colors.success },
                        scanStatus === 'error' && { borderColor: colors.error }
                    ]} />

                    {!scanStatus && <Text style={styles.hint}>Arahkan barcode siswa ke dalam kotak</Text>}

                    {scanStatus === 'success' && (
                        <View style={styles.feedbackContainer}>
                            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                            <Text style={styles.feedbackTitle}>Berhasil!</Text>
                            <Text style={styles.feedbackText}>{lastScannedName}</Text>
                        </View>
                    )}

                    {scanStatus === 'error' && (
                        <View style={styles.feedbackContainer}>
                            <Ionicons name="close-circle" size={48} color={colors.error} />
                            <Text style={[styles.feedbackTitle, { color: colors.error }]}>Gagal</Text>
                            <Text style={styles.feedbackText}>{lastScannedName}</Text>
                        </View>
                    )}
                </View>

                {processing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Memproses...</Text>
                    </View>
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        zIndex: 10
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },

    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
        marginTop: -20, // Overlap visual fix if needed, or adjust header
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: 'transparent',
        borderRadius: 20,
    },
    hint: {
        color: 'white',
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40
    },
    btn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.primary,
        borderRadius: 8
    },
    btnText: { color: 'white' },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16
    },
    feedbackContainer: {
        position: 'absolute',
        top: '60%',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 16,
        width: '80%'
    },
    feedbackTitle: {
        color: colors.success,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10
    },
    feedbackText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 5
    }
});
