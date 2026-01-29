import prisma from '../config/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export const createUser = async (tenantId: string, data: { email: string, password: string, name: string, role: Role, classId?: string, subjectIds?: string[] }) => {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            tenantId: tenantId,
            classId: data.classId,
            subjects: data.subjectIds ? {
                connect: data.subjectIds.map(id => ({ id }))
            } : undefined
        }
    });
};

export const getUserById = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
            classId: true,
            subjects: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
};

export const getUsersByRole = async (tenantId: string, role: Role | Role[]) => {
    const roleCondition = Array.isArray(role) ? { in: role } : role;
    return await prisma.user.findMany({
        where: {
            tenantId,
            role: roleCondition
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            classId: true,
            subjects: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            class: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

export const updateUser = async (tenantId: string | undefined, userId: string, data: {
    email?: string,
    password?: string,
    name?: string,
    classId?: string | null,
    subjectIds?: string[]
}) => {
    // If tenantId is provided, verify user belongs to tenant.
    // If tenantId is undefined (e.g. Owner self-update), just find the user by ID.
    const whereClause: any = { id: userId };
    if (tenantId) {
        whereClause.tenantId = tenantId;
    }

    const user = await prisma.user.findFirst({
        where: whereClause
    });

    if (!user) {
        throw new Error('User not found or access denied');
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.classId !== undefined) updateData.classId = data.classId || null;
    if (data.subjectIds) {
        updateData.subjects = {
            set: data.subjectIds.map(id => ({ id }))
        };
    }

    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
    }

    return await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            classId: true,
            subjects: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
};

export const deleteUser = async (tenantId: string, userId: string) => {
    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
        where: { id: userId, tenantId }
    });

    if (!user) {
        throw new Error('User not found or access denied');
    }

    // Use transaction to clean up related records and then delete the user
    return await prisma.$transaction(async (tx) => {
        // 1. Delete records where user is a student
        await tx.attendance.deleteMany({
            where: { studentId: userId }
        });

        await tx.grade.deleteMany({
            where: { studentId: userId }
        });

        // 2. Handle teacher relations
        if (user.role === 'TEACHER') {
            // Find all schedules belonging to this teacher
            const schedules = await tx.schedule.findMany({
                where: { teacherId: userId },
                select: { id: true }
            });
            const scheduleIds = schedules.map(s => s.id);

            if (scheduleIds.length > 0) {
                // Delete attendance and grades related to ini-schedules
                await tx.attendance.deleteMany({
                    where: { scheduleId: { in: scheduleIds } }
                });
                await tx.grade.deleteMany({
                    where: { scheduleId: { in: scheduleIds } }
                });

                // Now safe to delete schedules
                await tx.schedule.deleteMany({
                    where: { id: { in: scheduleIds } }
                });
            }

            // Delete teaching materials
            await tx.teachingMaterial.deleteMany({
                where: { teacherId: userId }
            });
        }

        // Finally delete the user
        return await tx.user.delete({
            where: { id: userId }
        });
    });
};

export const getStudentsByClass = async (tenantId: string, classId: string) => {
    return await prisma.user.findMany({
        where: {
            tenantId,
            role: Role.STUDENT,
            classId
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            classId: true
        },
        orderBy: {
            name: 'asc'
        }
    });
};
