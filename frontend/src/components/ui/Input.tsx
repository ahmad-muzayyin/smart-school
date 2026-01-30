import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, layout, spacing, typography, getThemeColors } from '../../theme/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input = ({ label, error, containerStyle, style, onFocus, onBlur, secureTextEntry, ...props }: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { isDarkMode } = useThemeStore();
    const colors = getThemeColors(isDarkMode);

    // If secureTextEntry is passed originally (like for password), we control it with isPasswordVisible
    const isPasswordInput = secureTextEntry;
    const isSecure = isPasswordInput && !isPasswordVisible;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <View style={{ justifyContent: 'center' }}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: colors.inputBackground || colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                            paddingRight: isPasswordInput ? 45 : spacing.md, // Make room for eye icon
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
                    secureTextEntry={isSecure}
                    {...props}
                />
                {isPasswordInput && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
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
    eyeIcon: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
    },
});
