import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, AnimatableNumericValue } from 'react-native';
import { colors, layout, typography, shadows } from '../../theme/theme';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
}

export const Button = ({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    style,
    icon
}: ButtonProps) => {

    const getBackgroundColor = () => {
        if (disabled) return colors.border;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.primaryLight;
            case 'danger': return colors.error;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return colors.primary; // Blue text on light blue bg
            case 'danger': return '#FFFFFF';
            case 'outline': return colors.primary;
            case 'ghost': return colors.textSecondary;
            default: return '#FFFFFF';
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'sm': return 36;
            case 'lg': return 56;
            default: return 48; // md
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return 14;
            default: return 16;
        }
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getHeight(),
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                    borderColor: variant === 'outline' ? (disabled ? colors.border : colors.primary) : 'transparent',
                },
                // Shadows only for solid buttons
                (variant === 'primary' || variant === 'danger') && !disabled ? shadows.sm : {},
                style,
            ]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && icon}
                    <Text style={[
                        styles.text,
                        { color: getTextColor(), fontSize: getFontSize(), marginLeft: icon ? 8 : 0 }
                    ]}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: layout.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    text: {
        ...typography.button,
    },
});
