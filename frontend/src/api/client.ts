import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use your machine's local IP address for physical device access
const IP_ADDRESS = '34.126.121.250';
const BASE_URL = `http://${IP_ADDRESS}:3000/api`;

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error (no response received)
            // Modify the error message to be more user-friendly
            error.message = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau pastikan server berjalan.';
        } else {
            // Use server provided error message if available
            if (error.response.data && error.response.data.message) {
                error.message = error.response.data.message;
            }
        }

        // Handle 401 (Logout) if needed
        return Promise.reject(error);
    }
);

export default client;
