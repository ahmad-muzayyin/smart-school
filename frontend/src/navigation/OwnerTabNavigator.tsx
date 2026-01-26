import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, shadows } from '../theme/theme';

// Screens
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import OwnerProfileScreen from '../screens/owner/OwnerProfileScreen';

const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    borderRadius: 24, // Rounded all around
                    height: 70,       // Fixed height
                    paddingBottom: 10, // Internal padding for label
                    paddingTop: 10,    // Internal padding for icon
                    position: 'absolute',
                    bottom: 50,       // Lifted up to clear physical navigation keys
                    left: 20,         // Float from left
                    right: 20,        // Float from right
                    elevation: 10,    // Shadow
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

                    if (route.name === 'Showroom') {
                        iconName = focused ? 'cube' : 'cube-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Showroom" component={OwnerDashboard} options={{ title: 'Schools' }} />
            <Tab.Screen name="Profile" component={OwnerProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({});
