import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, palette, shadows } from '../theme/theme';

// Screens
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TeacherScheduleScreen from '../screens/teacher/TeacherScheduleScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: palette.brandBlue, // Teacher uses Blue
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    borderRadius: 24,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    position: 'absolute',
                    bottom: 50,
                    left: 20,
                    right: 20,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 0
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Beranda') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Jadwal') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Profil') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Absen') {
                        iconName = focused ? 'location' : 'location-outline';
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Beranda" component={TeacherDashboard} />
            <Tab.Screen name="Jadwal" component={TeacherScheduleScreen} />
            <Tab.Screen name="Absen" component={TeacherAttendanceScreen} />
            <Tab.Screen name="Profil" component={TeacherProfileScreen} />
        </Tab.Navigator>
    );
}
