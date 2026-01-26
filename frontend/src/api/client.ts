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
        // Log the error for debugging
        if (error.config) {
            console.log(`API Error [${error.config.method?.toUpperCase()} ${error.config.url}]:`, error.message);
        }

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log('Response Data:', error.response.data);
            console.log('Response Status:', error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.log('No response received (Network Error)');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error Config:', error.message);
        }

        // Pass the error through so the store can handle it specifically
        return Promise.reject(error);
    }
);

export default client;
