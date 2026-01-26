
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

    const handleBarCodeScanned = async ({ type, data }: any) => {
        setScanned(true);
        setProcessing(true);

        try {
            // Data is expected to be the student ID
            const studentId = data;

            // Submit attendance
            const res = await client.post('/attendance', {
                scheduleId,
                studentId,
                date: new Date().toISOString(),
                status: 'PRESENT'
            });

            const studentName = res.data.data.attendance.student?.name || 'Siswa';

            Alert.alert(
                'Berhasil!',
                `Absensi berhasil untuk ${studentName}`,
                [
                    {
                        text: 'Scan Lagi',
                        onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    },
                    {
                        text: 'Selesai',
                        onPress: () => navigation.goBack(),
                        style: 'cancel'
                    }
                ]
            );

        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Gagal memproses absensi';
            Alert.alert(
                'Gagal',
                message,
                [
                    {
                        text: 'Coba Lagi',
                        onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        }
                    }
                ]
            );
        } finally {
            setProcessing(false);
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
                    <View style={styles.scanBox} />
                    <Text style={styles.hint}>Arahkan barcode siswa ke dalam kotak</Text>
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
    }
});
