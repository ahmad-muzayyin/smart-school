import { useThemeStore } from '../store/useThemeStore';

export const palette = {
    brandGreen: '#10B981',
    brandGreenDark: '#059669',
    brandGreenSoft: '#D1FAE5',

    brandBlue: '#0c884aff',
    brandBlueSoft: '#23dd3cff',

    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',

    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',

    green50: '#F0FDF4',
    green500: '#22C55E',
    green600: '#16A34A',

    red50: '#FEF2F2',
    red500: '#EF4444',
    red600: '#DC2626',

    yellow50: '#FEFCE8',
    yellow500: '#EAB308',
    yellow600: '#CA8A04',

    white: '#FFFFFF',
    black: '#000000',

    // Dark Mode Specific
    darkBackground: '#121212',
    darkSurface: '#1E1E1E',
    darkBorder: '#333333',
};

const lightColors = {
    background: palette.gray50,
    surface: palette.white,
    primary: palette.brandGreen,
    primaryDark: palette.brandGreenDark,
    primaryLight: palette.brandGreenSoft,
    text: palette.slate900,
    textSecondary: palette.gray500,
    border: palette.gray200,
    inputBackground: palette.white,
    success: palette.green500,
    successBackground: palette.green50,
    error: palette.red500,
    errorBackground: palette.red50,
    warning: palette.yellow500,
    warningBackground: palette.yellow50,
    gray300: palette.gray300,
};

const darkColors = {
    background: palette.darkBackground,
    surface: palette.darkSurface,
    primary: palette.brandGreen, // Keep brand color or adjust slightly
    primaryDark: palette.brandGreenDark,
    primaryLight: '#064E3B', // Darker green for background consistency
    text: palette.slate100,
    textSecondary: palette.gray400,
    border: palette.darkBorder,
    inputBackground: palette.darkSurface,
    success: palette.green500,
    successBackground: '#064E3B',
    error: palette.red500,
    errorBackground: '#450A0A',
    warning: palette.yellow500,
    warningBackground: '#422006',
    gray300: palette.gray600,
};

// We act as if 'colors' is static for existing imports, BUT we really should use a hook or helper.
// Since refactoring the whole app to use a hook is huge, we'll keep `colors` as the default light theme
// and export a helper `getColors(isDark)` for components that want to support it.

export const colors = lightColors;

export const getThemeColors = (isDark: boolean) => (isDark ? darkColors : lightColors);

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const layout = {
    borderRadius: {
        sm: 6,
        md: 12,
        lg: 16,
        xl: 24,
    },
    headerHeight: 64,
};

export const typography = {
    fontFamily: 'System',
    h1: { fontSize: 28, fontWeight: '700' as '700', letterSpacing: -0.5, lineHeight: 34 },
    h2: { fontSize: 24, fontWeight: '600' as '600', letterSpacing: -0.5, lineHeight: 30 },
    h3: { fontSize: 18, fontWeight: '600' as '600', lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as '400', lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400' as '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '600' as '600', lineHeight: 16, textTransform: 'uppercase' as 'uppercase', letterSpacing: 0.5 },
    button: { fontSize: 16, fontWeight: '600' as '600', letterSpacing: 0.2 },
};

export const shadows = {
    none: { elevation: 0, shadowOpacity: 0 },
    sm: {
        shadowColor: palette.brandGreenDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: palette.brandGreenDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: palette.brandGreenDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    }
};
