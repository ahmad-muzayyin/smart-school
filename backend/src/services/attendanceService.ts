import prisma from '../config/db';
import { AttendanceStatus } from '@prisma/client';

export const submitAttendance = async (tenantId: string, scheduleId: string, studentId: string, date: Date, status: AttendanceStatus, notes?: string) => {
    const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { classId: true }
    });

    if (!schedule) {
        throw new Error('Schedule not found');
    }

    return await prisma.attendance.upsert({
        where: {
            scheduleId_studentId_date: {
                scheduleId,
                studentId,
                date
            }
        },
        update: {
            status,
            notes
        },
        create: {
            tenantId,
            scheduleId,
            studentId,
            classId: schedule.classId,
            date,
            status,
            notes
        },
        include: {
            student: {
                select: { name: true }
            }
        }
    });
};

export const getAttendanceHistory = async (tenantId: string, filters: any) => {
    const { subjectName, ...otherFilters } = filters;

    const whereClause: any = {
        tenantId,
        ...otherFilters
    };

    if (subjectName) {
        whereClause.schedule = {
            subject: subjectName
        };
    }

    return await prisma.attendance.findMany({
        where: whereClause,
        include: {
            student: {
                select: {
                    name: true,
                    classId: true,
                    class: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            schedule: { select: { subject: true } }
        }
    });
};

export const getScheduleForValidation = async (tenantId: string, scheduleId: string) => {
    return await prisma.schedule.findFirst({
        where: {
            id: scheduleId,
            tenantId
        },
        select: {
            id: true,
            teacherId: true,
            classId: true
        }
    });
};

export const getStudentForValidation = async (tenantId: string, studentId: string) => {
    return await prisma.user.findFirst({
        where: {
            id: studentId,
            tenantId,
            role: 'STUDENT'
        },
        select: {
            id: true,
            classId: true
        }
    });
};
