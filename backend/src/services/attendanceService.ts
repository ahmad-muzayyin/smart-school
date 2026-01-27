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

export const createPermissionForDay = async (tenantId: string, studentId: string, date: Date, reason: string, notes?: string) => {
    // 1. Get student's class
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { classId: true }
    });

    if (!student || !student.classId) {
        throw new Error('Student not found or not assigned to a class');
    }

    // 2. Find all schedules for this class on this day of week
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 1-7 (Mon-Sun). JS getDay is 0 (Sun) to 6 (Sat)
    // If backend uses 1=Mon...7=Sun
    // Check Schedule model? Assuming standard 1=Mon.

    // JS: 0=Sun, 1=Mon, 2=Tue...
    // Let's assume standard ISO: 1-7. If Sunday(0) -> 7.

    const schedules = await prisma.schedule.findMany({
        where: {
            tenantId,
            classId: student.classId,
            dayOfWeek: dayOfWeek
        }
    });

    if (schedules.length === 0) {
        return 0; // No schedules, nothing to mark
    }

    // 3. Upsert attendance for all schedules
    // Status is EXCUSED. Notes will contain reason + user notes
    const finalNotes = `[${reason}] ${notes || ''}`;

    let count = 0;

    // Prisma doesn't have createMany with upsert logic easily for different IDs. 
    // Loop transaction is safer.
    await prisma.$transaction(async (tx) => {
        for (const sched of schedules) {
            await tx.attendance.upsert({
                where: {
                    scheduleId_studentId_date: {
                        scheduleId: sched.id,
                        studentId,
                        date
                    }
                },
                update: {
                    status: 'EXCUSED',
                    notes: finalNotes
                },
                create: {
                    tenantId,
                    scheduleId: sched.id,
                    studentId,
                    classId: student.classId!,
                    date,
                    status: 'EXCUSED',
                    notes: finalNotes
                }
            });
            count++;
        }
    });

    return count;
};
