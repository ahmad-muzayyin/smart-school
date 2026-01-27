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
    class?: {
        name: string;
    };
    subjects?: {
        id: string;
        name: string;
        code?: string;
    }[];
    className?: string; // Flattened for easier access
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

                    // Attempt to extract the target URL for debugging context
                    const baseURL = err.config?.baseURL || '';
                    const url = err.config?.url || '';
                    const fullUrl = baseURL ? `${baseURL}${url}` : url;

                    if (err.response) {
                        // Server responded with error code (4xx, 5xx)
                        message = err.response.data?.message || `Server Error (${err.response.status}). Please try again.`;
                    } else if (err.request) {
                        // Request made but no response (Network error, Timeout, etc.)
                        // This is common when IP is wrong, server is down, or firewall blocks it.
                        message = `Koneksi Gagal!\n\nTidak dapat menghubungi server di:\n${fullUrl || 'URL tidak diketahui'}\n\nDetail Error: ${err.message}\n\nSolusi:\n1. Pastikan server Backend berjalan.\n2. Pastikan IP Address di client.ts benar.\n3. Pastikan HP dan Server di jaringan yang sama (jika lokal).`;
                    } else {
                        // Other errors (setup, etc.)
                        message = `Terjadi Kesalahan: ${err.message}`;
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
