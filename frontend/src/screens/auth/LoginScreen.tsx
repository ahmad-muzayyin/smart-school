import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors as defaultColors, spacing, typography, layout, getThemeColors } from '../../theme/theme';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../../store/useThemeStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formValidationError, setFormValidationError] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    React.useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const savedCreds = await SecureStore.getItemAsync('biometric_credentials');
            setIsBiometricSupported(hasHardware && isEnrolled && !!savedCreds);
        } catch (e) {
            console.log('Biometric check failed:', e);
        }
    };

    const handleLogin = async () => {
        setFormValidationError('');
        clearError();

        if (!email || !password) {
            setFormValidationError('Please enter both email and password.');
            return;
        }
        await login(email, password);

        // Check success by looking at store state directly (since login is void/doesn't throw)
        const state = useAuthStore.getState();
        if (state.token && !state.error) {
            // Save credentials for biometric reuse
            await SecureStore.setItemAsync('biometric_credentials', JSON.stringify({ email, password }));
            checkBiometricSupport(); // Update state
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login dengan Biometrik',
                fallbackLabel: 'Gunakan Password'
            });

            if (result.success) {
                const creds = await SecureStore.getItemAsync('biometric_credentials');
                if (creds) {
                    const { email: savedEmail, password: savedPassword } = JSON.parse(creds);
                    // Fill form for visual feedback (optional)
                    setEmail(savedEmail);
                    setPassword(savedPassword);
                    // Login
                    await login(savedEmail, savedPassword);
                } else {
                    Alert.alert('Error', 'Data login tidak ditemukan. Silakan login manual sekali.');
                }
            }
        } catch (error) {
            Alert.alert('Gagal', 'Login biometrik gagal.');
        }
    };

    React.useEffect(() => {
        if (formValidationError && (email || password)) {
            setFormValidationError('');
        }
    }, [email, password]);

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/icon.png')}
                                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                            />
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {(formValidationError || error) && (
                            <View style={[styles.errorContainer, { backgroundColor: defaultColors.errorBackground, borderLeftColor: defaultColors.error }]}>
                                <Text style={[styles.errorTitle, { color: defaultColors.error }]}>Authentication Failed</Text>
                                <Text style={[styles.errorText, { color: defaultColors.error }]}>{formValidationError || error}</Text>
                            </View>
                        )}

                        <Input
                            label="EMAIL"
                            placeholder="e.g. teacher@school.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        // Pass generic styles if Input component supports custom styles, 
                        // otherwise we rely on global input styles which might need update too.
                        // Assuming Input uses default colors internally or text color needs manual override if Input doesn't use `colors.text`
                        />

                        <Input
                            label="PASSWORD"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            label="Sign In"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.button}
                            size="lg"
                        />

                        {isBiometricSupported && (
                            <TouchableOpacity
                                onPress={handleBiometricLogin}
                                style={[styles.biometricBtn, { borderColor: defaultColors.primary }]}
                            >
                                <Ionicons name="finger-print" size={24} color={defaultColors.primary} />
                                <Text style={[styles.biometricText, { color: defaultColors.primary }]}>Login dengan Biometrik</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Forgot password? Please contact your school administrator.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        // dynamic bg
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoContainer: {
        width: Dimensions.get('window').width * 0.7,
        height: Dimensions.get('window').width * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        textAlign: 'center',
    },
    card: {
        borderRadius: layout.borderRadius.xl,
        padding: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    form: {
        marginBottom: spacing.xl,
    },
    errorContainer: {
        padding: spacing.md,
        borderRadius: layout.borderRadius.md,
        marginBottom: spacing.lg,
        borderLeftWidth: 3,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    errorText: {
        fontSize: 13,
        lineHeight: 18,
    },
    button: {
        marginTop: spacing.sm,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        ...typography.caption,
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 18,
    },
    biometricBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 15,
        gap: 8
    },
    biometricText: {
        fontWeight: '600',
        fontSize: 14
    }
});
