import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
}

export function LoadingState({ message = 'Memuat...', size = 'large' }: LoadingStateProps): JSX.Element {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    message: {
        marginTop: spacing.md,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
