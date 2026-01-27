import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';

// Owner
import OwnerTabNavigator from './OwnerTabNavigator';
import CreateTenantScreen from '../screens/owner/CreateTenantScreen';
import SchoolManagementScreen from '../screens/owner/SchoolManagementScreen';

// Admin
import AdminTabNavigator from './AdminTabNavigator';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManageClassesScreen from '../screens/admin/ManageClassesScreen';
import CreateScheduleScreen from '../screens/admin/CreateScheduleScreen';
import ViewSchedulesScreen from '../screens/admin/ViewSchedulesScreen';
import AttendanceReportScreen from '../screens/admin/AttendanceReportScreen';
import ManageSubjectsScreen from '../screens/admin/ManageSubjectsScreen';
import SchoolSettingsScreen from '../screens/admin/SchoolSettingsScreen';

// Teacher
import TeacherTabNavigator from './TeacherTabNavigator';
import TakeAttendanceScreen from '../screens/teacher/TakeAttendanceScreen';
import TeacherGradesScreen from '../screens/teacher/TeacherGradesScreen';
import TeachingMaterialsScreen from '../screens/teacher/TeachingMaterialsScreen';
import TeacherStudentListScreen from '../screens/teacher/TeacherStudentListScreen';
import TeacherClassesScreen from '../screens/teacher/TeacherClassesScreen';
import ScanAttendanceScreen from '../screens/teacher/ScanAttendanceScreen';

// Student
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentMaterialsScreen from '../screens/student/StudentMaterialsScreen';
import StudentPermissionScreen from '../screens/student/StudentPermissionScreen';
import StudentScheduleScreen from '../screens/student/StudentScheduleScreen';

// Common
import SettingsScreen from '../screens/common/SettingsScreen';
import HelpScreen from '../screens/common/HelpScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
import LanguageSettingsScreen from '../screens/common/LanguageSettingsScreen';
import PrivacySettingsScreen from '../screens/common/PrivacySettingsScreen';
import PrivacyPolicyScreen from '../screens/common/PrivacyPolicyScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { token, user, isLoading, isInitialized } = useAuthStore();

    if (!isInitialized) {
        // Waiting for Zustand persist to rehydrate
        return null;
    }

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        {user?.role === 'OWNER' && (
                            <>
                                <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
                                <Stack.Screen name="CreateTenant" component={CreateTenantScreen} />
                                <Stack.Screen name="SchoolManagement" component={SchoolManagementScreen} />
                                <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
                                {/* Common Screens */}
                                <Stack.Screen name="Settings" component={SettingsScreen} />
                                <Stack.Screen name="Help" component={HelpScreen} />
                                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                                <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                                <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                            </>
                        )}
                        {user?.role === 'SCHOOL_ADMIN' && (
                            <>
                                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                                <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
                                <Stack.Screen name="ManageClasses" component={ManageClassesScreen} />
                                <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} />
                                <Stack.Screen name="ViewSchedules" component={ViewSchedulesScreen} />
                                <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} />
                                <Stack.Screen name="ManageSubjects" component={ManageSubjectsScreen} />
                                <Stack.Screen name="SchoolSettings" component={SchoolSettingsScreen} />
                                {/* Common Screens */}
                                <Stack.Screen name="Settings" component={SettingsScreen} />
                                <Stack.Screen name="Help" component={HelpScreen} />
                                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                                <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                                <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                            </>
                        )}
                        {user?.role === 'TEACHER' && (
                            <>
                                <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
                                <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
                                <Stack.Screen name="TeacherGrades" component={TeacherGradesScreen} />
                                <Stack.Screen name="TeachingMaterials" component={TeachingMaterialsScreen} />
                                <Stack.Screen name="TeacherStudents" component={TeacherStudentListScreen} />
                                <Stack.Screen name="TeacherClasses" component={TeacherClassesScreen} />
                                <Stack.Screen name="ScanAttendance" component={ScanAttendanceScreen} />
                                {/* Common Screens */}
                                <Stack.Screen name="Settings" component={SettingsScreen} />
                                <Stack.Screen name="Help" component={HelpScreen} />
                                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                                <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                                <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                            </>
                        )}
                        {user?.role === 'STUDENT' && (
                            <>
                                <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
                                <Stack.Screen name="StudentMaterials" component={StudentMaterialsScreen} />
                                <Stack.Screen name="StudentPermission" component={StudentPermissionScreen} />
                                <Stack.Screen name="StudentSchedule" component={StudentScheduleScreen} />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
