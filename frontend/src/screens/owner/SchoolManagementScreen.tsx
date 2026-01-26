import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Switch } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { colors as defaultColors, spacing, typography, shadows, getThemeColors } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { useThemeStore } from '../../store/useThemeStore';

export default function SchoolManagementScreen({ route, navigation }: any) {
    const { schoolId, schoolName } = route.params;
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    const [school, setSchool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [logoModalVisible, setLogoModalVisible] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: ''
    });
    const [logoUrl, setLogoUrl] = useState('');

    const fetchSchoolDetails = async () => {
        try {
            const res = await client.get(`/tenants/${schoolId}`);
            setSchool(res.data.data.tenant);
            setFormData({
                name: res.data.data.tenant.name,
                address: res.data.data.tenant.address || '',
                phone: res.data.data.tenant.phone || '',
                email: res.data.data.tenant.email || '',
                website: res.data.data.tenant.website || ''
            });
            setLogoUrl(res.data.data.tenant.logo || '');
            setIsActive(res.data.data.tenant.isActive ?? true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load school details');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSchoolDetails();
        }, [])
    );

    const handleSaveInfo = async () => {
        try {
            await client.put(`/tenants/${schoolId}`, formData);
            Alert.alert('Success', 'School information updated');
            setEditModalVisible(false);
            fetchSchoolDetails();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update school information');
        }
    };

    const [isActive, setIsActive] = useState(true);

    const handleSaveLogo = async () => {
        try {
            await client.put(`/tenants/${schoolId}`, { logo: logoUrl });
            Alert.alert('Success', 'School logo updated');
            setLogoModalVisible(false);
            fetchSchoolDetails();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update logo');
        }
    };

    const handleToggleActive = async (value: boolean) => {
        try {
            await client.put(`/tenants/${schoolId}`, { isActive: value });
            setIsActive(value);
            Alert.alert('Success', `School is now ${value ? 'Active' : 'Inactive'}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update school status');
            setIsActive(!value); // Revert on failure
        }
    };

    const menuItems = [
        {
            icon: 'information-circle',
            title: 'School Information',
            subtitle: 'Edit name, address, contact info',
            onPress: () => setEditModalVisible(true)
        },
        {
            icon: 'image',
            title: 'School Logo',
            subtitle: 'Upload or change logo URL',
            onPress: () => setLogoModalVisible(true)
        },
        {
            icon: 'person-circle',
            title: 'School Administrator',
            subtitle: 'View and edit admin account',
            onPress: () => navigation.navigate('ManageUsers', { role: 'SCHOOL_ADMIN', tenantId: schoolId })
        },
        {
            icon: 'settings',
            title: 'School Settings',
            subtitle: 'Configure school preferences',
            onPress: () => Alert.alert('Coming Soon', 'Settings feature in development')
        },
        {
            icon: 'people',
            title: 'Manage Users',
            subtitle: 'View and manage users',
            onPress: () => {
                Alert.alert(
                    'Manage Users',
                    'Select user type to manage',
                    [
                        {
                            text: 'Teachers',
                            onPress: () => navigation.navigate('ManageUsers', { role: 'TEACHER', tenantId: schoolId })
                        },
                        {
                            text: 'Students',
                            onPress: () => navigation.navigate('ManageUsers', { role: 'STUDENT', tenantId: schoolId })
                        },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }
        },
        {
            icon: 'stats-chart',
            title: 'Reports & Analytics',
            subtitle: 'View school statistics',
            onPress: () => Alert.alert('Coming Soon', 'Reports screen')
        }
    ];

    if (loading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large" color={defaultColors.primary} />
            </Screen>
        );
    }

    return (
        <Screen style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]}>{school?.name || schoolName}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>School Management</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* School Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.logoPlaceholder, { backgroundColor: defaultColors.primaryLight }]}>
                        {school?.logo ? (
                            <Ionicons name="image" size={48} color={defaultColors.primary} />
                            // In real app, use <Image source={{ uri: school.logo }} ... />
                        ) : (
                            <Ionicons name="school" size={48} color={defaultColors.primary} />
                        )}
                    </View>
                    <Text style={[styles.schoolName, { color: colors.text }]}>{school?.name}</Text>
                    <Text style={[styles.schoolId, { color: colors.textSecondary }]}>ID: {schoolId.substring(0, 8)}...</Text>
                    {school?.address && <Text style={[styles.detailText, { color: colors.textSecondary }]}>{school.address}</Text>}
                    {school?.email && <Text style={[styles.detailText, { color: colors.textSecondary }]}>{school.email}</Text>}

                    <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                            <Ionicons name="people" size={16} color={defaultColors.primary} />
                            <Text style={[styles.statText, { color: colors.text }]}>
                                {school?.users?.filter((u: any) => u.role === 'STUDENT').length || 0} Siswa
                            </Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Ionicons name="easel" size={16} color={defaultColors.primary} />
                            <Text style={[styles.statText, { color: colors.text }]}>
                                {school?.classes?.length || 0} Kelas
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statusContainer, { borderTopColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusLabel, { color: colors.text }]}>Status Sekolah</Text>
                            <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                                {isActive ? 'Aktif - Siswa & Guru bisa login' : 'Nonaktif - Login dibatasi'}
                            </Text>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={handleToggleActive}
                            trackColor={{ false: defaultColors.border, true: defaultColors.primary }}
                            thumbColor={'white'}
                        />
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: colors.surface }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: defaultColors.primaryLight }]}>
                                <Ionicons name={item.icon as any} size={24} color={defaultColors.primary} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Edit Info Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit School Information</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="School Name"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.name}
                            onChangeText={(t) => setFormData({ ...formData, name: t })}
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Address"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.address}
                            onChangeText={(t) => setFormData({ ...formData, address: t })}
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Phone"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.phone}
                            onChangeText={(t) => setFormData({ ...formData, phone: t })}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Email"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.email}
                            onChangeText={(t) => setFormData({ ...formData, email: t })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Website"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.website}
                            onChangeText={(t) => setFormData({ ...formData, website: t })}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: defaultColors.primary }]}
                                onPress={handleSaveInfo}
                            >
                                <Text style={[styles.buttonText, { color: 'white' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Logo Modal */}
            <Modal
                visible={logoModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setLogoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Update Logo</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter image URL</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="https://example.com/logo.png"
                            placeholderTextColor={colors.textSecondary}
                            value={logoUrl}
                            onChangeText={setLogoUrl}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setLogoModalVisible(false)}
                            >
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: defaultColors.primary }]}
                                onPress={handleSaveLogo}
                            >
                                <Text style={[styles.buttonText, { color: 'white' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    infoCard: {
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.md,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    schoolName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    schoolId: {
        fontSize: 12,
    },
    menuContainer: {
        paddingHorizontal: spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: 12,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 14,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 14,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
        gap: 6
    },
    statText: {
        fontSize: 14,
        fontWeight: '600'
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        gap: 16
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4
    },
    statusDesc: {
        fontSize: 13
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        borderRadius: 16,
        padding: spacing.xl,
        ...shadows.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 16,
        marginBottom: spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
