import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ViewStyle } from 'react-native';
import { colors as defaultColors, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface ScreenProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    safeArea?: boolean; // Default true
}

export const Screen = ({ children, style, safeArea = true }: ScreenProps) => {
    const Container = safeArea ? SafeAreaView : View;
    const { isDarkMode } = useThemeStore();
    const themeColors = getThemeColors(isDarkMode);

    return (
        <Container style={[styles.container, { backgroundColor: themeColors.background }, style]}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={themeColors.background}
            />
            <View style={styles.content}>
                {children}
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor is now dynamic
    },
    content: {
        flex: 1,
    },
});
