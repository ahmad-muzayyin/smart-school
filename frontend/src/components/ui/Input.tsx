import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors as defaultColors, layout, spacing, typography, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input = ({ label, error, containerStyle, style, onFocus, onBlur, ...props }: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.inputBackground || colors.background, // Fallback if inputBackground not defined
                        borderColor: colors.border,
                        color: colors.text,
                    },
                    isFocused ? {
                        borderColor: defaultColors.primary,
                        backgroundColor: colors.surface,
                    } : {},
                    error ? {
                        borderColor: defaultColors.error,
                    } : {},
                    style
                ]}
                placeholderTextColor={colors.textSecondary}
                onFocus={(e) => {
                    setIsFocused(true);
                    onFocus && onFocus(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    onBlur && onBlur(e);
                }}
                {...props}
            />
            {error && <Text style={[styles.error, { color: defaultColors.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: layout.borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 48,
        ...typography.body,
    },
    error: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
});
