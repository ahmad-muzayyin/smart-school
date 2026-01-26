
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, spacing } from '../../theme/theme';

interface IdentityCardProps {
    user: {
        id: string;
        name: string;
        role: string;
        email?: string;
        tenantName?: string;
    };
    width?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const IdentityCard = ({ user, width = SCREEN_WIDTH - 48 }: IdentityCardProps) => {
    const CARD_HEIGHT = width * 1.58; // Standard ID card ratio

    return (
        <View style={[styles.container, { width, height: CARD_HEIGHT }]}>
            <LinearGradient
                colors={['#1a237e', '#3949ab']}
                style={styles.cardBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.schoolName}>{user.tenantName || 'NAMA SEKOLAH'}</Text>
                    <Text style={styles.cardTitle}>STUDENT ID CARD</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.role}>{user.role}</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>ID No:</Text>
                        <Text style={styles.value}>{user.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                </View>

                {/* Barcode / QR Code Section */}
                <View style={styles.footer}>
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={user.id}
                            size={100}
                            color="black"
                            backgroundColor="white"
                        />
                    </View>
                    <Text style={styles.footerText}>Scan this code for attendance</Text>
                </View>

                {/* Decorative Circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        ...shadows.md,
        overflow: 'hidden',
    },
    cardBg: {
        flex: 1,
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        zIndex: 10,
    },
    schoolName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cardTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 4,
        letterSpacing: 2,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        zIndex: 10,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: '#90caf9',
        fontWeight: '600',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginRight: 8,
    },
    value: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    footer: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'white',
        padding: spacing.md,
        borderRadius: 16,
        marginTop: spacing.md,
    },
    qrContainer: {
        padding: 8,
    },
    footerText: {
        marginTop: 8,
        fontSize: 10,
        color: '#666',
    },
    circle1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle2: {
        position: 'absolute',
        bottom: 100,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    }
});
