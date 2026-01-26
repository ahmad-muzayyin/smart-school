import { ValidationError } from './errorHandler';

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
        return { isValid: false, message: 'Password harus minimal 6 karakter' };
    }
    return { isValid: true };
}

export function validateRequired(value: string, fieldName: string): string | null {
    if (!value || value.trim().length === 0) {
        return `${fieldName} wajib diisi`;
    }
    return null;
}

export function validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

export function validateLoginForm(email: string, password: string): ValidationResult {
    const errors: Record<string, string> = {};

    const emailError = validateRequired(email, 'Email');
    if (emailError) {
        errors.email = emailError;
    } else if (!validateEmail(email)) {
        errors.email = 'Format email tidak valid';
    }

    const passwordError = validateRequired(password, 'Password');
    if (passwordError) {
        errors.password = passwordError;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

export function validateUserForm(name: string, email: string, password: string): ValidationResult {
    const errors: Record<string, string> = {};

    const nameError = validateRequired(name, 'Nama');
    if (nameError) {
        errors.name = nameError;
    }

    const emailError = validateRequired(email, 'Email');
    if (emailError) {
        errors.email = emailError;
    } else if (!validateEmail(email)) {
        errors.email = 'Format email tidak valid';
    }

    const passwordError = validateRequired(password, 'Password');
    if (passwordError) {
        errors.password = passwordError;
    } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.message || 'Password tidak valid';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

export function validateScheduleForm(
    classId: string,
    teacherId: string,
    subject: string,
    startTime: string,
    endTime: string
): ValidationResult {
    const errors: Record<string, string> = {};

    if (!classId) {
        errors.classId = 'Kelas wajib dipilih';
    }

    if (!teacherId) {
        errors.teacherId = 'Guru wajib dipilih';
    }

    const subjectError = validateRequired(subject, 'Mata Pelajaran');
    if (subjectError) {
        errors.subject = subjectError;
    }

    if (!validateTimeFormat(startTime)) {
        errors.startTime = 'Format waktu tidak valid (HH:mm)';
    }

    if (!validateTimeFormat(endTime)) {
        errors.endTime = 'Format waktu tidak valid (HH:mm)';
    }

    if (validateTimeFormat(startTime) && validateTimeFormat(endTime)) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        if (end <= start) {
            errors.endTime = 'Waktu selesai harus lebih besar dari waktu mulai';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
