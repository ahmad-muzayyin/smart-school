import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeState {
    isDarkMode: boolean;
    useSystemTheme: boolean;
    toggleTheme: () => void;
    setTheme: (mode: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDarkMode: false,
            useSystemTheme: false, // Default updated to false based on user preference or requirement

            toggleTheme: () => {
                set((state) => ({
                    isDarkMode: !state.isDarkMode,
                    useSystemTheme: false
                }));
            },

            setTheme: (mode) => {
                if (mode === 'system') {
                    const colorScheme = Appearance.getColorScheme();
                    set({
                        useSystemTheme: true,
                        isDarkMode: colorScheme === 'dark'
                    });
                } else {
                    set({
                        useSystemTheme: false,
                        isDarkMode: mode === 'dark'
                    });
                }
            }
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
