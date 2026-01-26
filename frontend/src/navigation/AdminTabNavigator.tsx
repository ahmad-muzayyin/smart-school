import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, palette } from '../theme/theme';

// Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: colors.primary, // Admin uses default (Green)
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    borderRadius: 24,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    position: 'absolute',
                    bottom: 50, // Floating consistent with Owner/Teacher
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
                    } else if (route.name === 'Profil') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Beranda" component={AdminDashboard} />
            <Tab.Screen name="Profil" component={AdminProfileScreen} />
        </Tab.Navigator>
    );
}
