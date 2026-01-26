import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

type Role = 'OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    tenantId?: string;
    classId?: string;
    tenant?: {
        name: string;
        isActive?: boolean;
    };
    subjects?: {
        id: string;
        name: string;
        code?: string;
    }[];
}

interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    isInitialized?: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    setUser: (user: User) => void;
}

const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isLoading: false,
            error: null,
            isInitialized: false,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    console.log('Attempting login to:', client.defaults.baseURL);
                    const response = await client.post('/auth/login', { email, password });

                    console.log('Login success:', response.status);
                    const { token, data } = response.data;

                    await SecureStore.setItemAsync('auth_token', token);

                    set({ token, user: data.user, isLoading: false, error: null });
                } catch (err: any) {
                    console.error('Login Error detailed:', err);
                    let message = 'Login failed';

                    if (err.response) {
                        // Server responded with error code
                        message = err.response.data?.message || `Server error (${err.response.status})`;
                    } else if (err.request) {
                        // Request made but no response (Network error)
                        message = 'Unable to connect to server. Check your internet or server status.';
                    } else {
                        message = err.message;
                    }

                    set({ error: message, isLoading: false });
                }
            },

            logout: async () => {
                await SecureStore.deleteItemAsync('auth_token');
                set({ token: null, user: null });
            },

            clearError: () => set({ error: null }),

            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => secureStorage),
            onRehydrateStorage: () => (state) => {
                console.log('Auth Store Hydrated');
                if (state) {
                    (state as AuthState).isInitialized = true; // Set isInitialized to true after hydration
                }
            }
        }
    )
);
