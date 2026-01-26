export interface User {
    id: string;
    email: string;
    name: string;
    role: 'PLATFORM_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';
    tenantId?: string;
    classId?: string;
}

export interface Tenant {
    id: string;
    name: string;
    createdAt: string;
}

export interface Class {
    id: string;
    name: string;
    tenantId: string;
}

export interface Schedule {
    id: string;
    classId: string;
    teacherId: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    class: Class;
    teacher: User;
}

export interface Attendance {
    id: string;
    scheduleId: string;
    studentId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    schedule: Schedule;
    student: User;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    message: string;
    code?: string;
    statusCode?: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: 'TEACHER' | 'STUDENT';
    classId?: string;
}

export interface CreateTenantPayload {
    name: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}

export interface CreateSchedulePayload {
    classId: string;
    teacherId: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export interface SubmitAttendancePayload {
    scheduleId: string;
    studentId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}
