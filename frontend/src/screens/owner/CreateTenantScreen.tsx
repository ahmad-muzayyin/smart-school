import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors as defaultColors, layout, spacing, typography, shadows, getThemeColors } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

export default function CreateTenantScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminName, setAdminName] = useState(''); // New field
    const [adminPassword, setAdminPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const handleCreate = async () => {
        if (!name || !address || !adminEmail || !adminPassword || !adminName) {
            Alert.alert('Missing Fields', 'Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            await client.post('/tenants', {
                name,
                address,
                adminName,
                adminEmail,
                adminPassword
            });
            Alert.alert('Success', 'School registered successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]} safeArea={false}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.backLink, { color: defaultColors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Register New School</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                            <Ionicons name="business" size={20} color={defaultColors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>School Details</Text>
                        </View>
                        <Input label="SCHOOL NAME" placeholder="e.g. Global High School" value={name} onChangeText={setName} />
                        <Input label="ADDRESS" placeholder="e.g. 123 Education Lane" value={address} onChangeText={setAddress} />
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                            <Ionicons name="person-circle" size={20} color={defaultColors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Administrator Account</Text>
                        </View>
                        <Input label="ADMIN NAME" placeholder="e.g. Principal Skinner" value={adminName} onChangeText={setAdminName} />
                        <Input label="EMAIL ADDRESS" placeholder="e.g. admin@school.com" value={adminEmail} onChangeText={setAdminEmail} keyboardType="email-address" />
                        <Input label="PASSWORD" placeholder="Min. 6 characters" value={adminPassword} onChangeText={setAdminPassword} secureTextEntry />
                    </View>

                    <Button label="Create Account" onPress={handleCreate} loading={loading} style={styles.submitBtn} size="lg" />
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    backLink: { fontSize: 16 },
    headerTitle: { ...typography.h3 },

    form: { padding: spacing.lg },

    section: {
        borderRadius: layout.borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
    },
    sectionTitle: { ...typography.body, fontWeight: '600' },

    submitBtn: { marginTop: spacing.md }
});

