import { ApiError } from '../types';

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class NetworkError extends AppError {
    constructor(message: string = 'Network error. Please check your connection.') {
        super(message, 'NETWORK_ERROR', 0, true);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed. Please login again.') {
        super(message, 'AUTH_ERROR', 401, true);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed. Please check your input.') {
        super(message, 'VALIDATION_ERROR', 400, true);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found.') {
        super(message, 'NOT_FOUND', 404, true);
    }
}

export function transformApiError(error: any): ApiError {
    if (error.response) {
        return {
            message: error.response.data?.message || 'An error occurred',
            code: error.response.data?.code || 'API_ERROR',
            statusCode: error.response.status,
        };
    }

    if (error.request) {
        return {
            message: 'Network error. Please check your connection.',
            code: 'NETWORK_ERROR',
            statusCode: 0,
        };
    }

    return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
    };
}

export function getUserFriendlyErrorMessage(error: ApiError): string {
    const errorMessages: Record<string, string> = {
        NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        AUTH_ERROR: 'Sesi Anda telah berakhir. Silakan login kembali.',
        VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
        NOT_FOUND: 'Data tidak ditemukan.',
        UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
        SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
    };

    return errorMessages[error.code || ''] || error.message || 'Terjadi kesalahan. Silakan coba lagi.';
}

export function logError(error: Error | ApiError, context?: string): void {
    if (__DEV__) {
        console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
    }
}
