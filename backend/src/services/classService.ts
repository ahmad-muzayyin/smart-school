import prisma from '../config/db';

export const createClass = async (tenantId: string, data: { name: string, homeRoomTeacherId?: string }) => {
    return await prisma.class.create({
        data: {
            tenantId,
            name: data.name,
            homeRoomTeacherId: data.homeRoomTeacherId
        }
    });
};

export const getAllClasses = async (tenantId: string) => {
    return await prisma.class.findMany({
        where: { tenantId },
        include: {
            students: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            homeRoomTeacher: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    students: true
                }
            }
        }
    });
};

export const getClassById = async (tenantId: string, classId: string) => {
    return await prisma.class.findFirst({
        where: { id: classId, tenantId },
        include: {
            homeRoomTeacher: true
        }
    });
};

export const updateClass = async (tenantId: string, classId: string, data: { name?: string, homeRoomTeacherId?: string | null }) => {
    // Verify class belongs to tenant
    const existingClass = await prisma.class.findFirst({
        where: { id: classId, tenantId }
    });

    if (!existingClass) {
        throw new Error('Class not found or access denied');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.homeRoomTeacherId !== undefined) updateData.homeRoomTeacherId = data.homeRoomTeacherId;

    return await prisma.class.update({
        where: { id: classId },
        data: updateData
    });
};

export const deleteClass = async (tenantId: string, classId: string) => {
    // Verify class belongs to tenant
    const existingClass = await prisma.class.findFirst({
        where: { id: classId, tenantId }
    });

    if (!existingClass) {
        throw new Error('Class not found or access denied');
    }

    return await prisma.class.delete({
        where: { id: classId }
    });
};

export const createSchedule = async (tenantId: string, data: any) => {
    return await prisma.schedule.create({
        data: {
            ...data,
            tenantId
        }
    });
};

export const getSchedules = async (tenantId: string, filters: any = {}) => {
    return await prisma.schedule.findMany({
        where: {
            tenantId,
            ...filters
        },
        include: {
            class: {
                include: {
                    students: true
                }
            },
            teacher: {
                select: { name: true, id: true, email: true }
            }
        }
    });
};

export const getScheduleById = async (tenantId: string, scheduleId: string) => {
    return await prisma.schedule.findFirst({
        where: {
            id: scheduleId,
            tenantId
        },
        include: {
            class: {
                include: {
                    students: true
                }
            },
            teacher: {
                select: { name: true, id: true, email: true }
            }
        }
    });
};

export const updateSchedule = async (tenantId: string, scheduleId: string, data: any) => {
    // Verify schedule belongs to tenant
    const existingSchedule = await prisma.schedule.findFirst({
        where: { id: scheduleId, tenantId }
    });

    if (!existingSchedule) {
        throw new Error('Schedule not found or access denied');
    }

    // Only update valid scalar fields
    const updateData: any = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;

    // For relations, we need to use connect/disconnect
    if (data.classId !== undefined) {
        updateData.class = { connect: { id: data.classId } };
    }
    if (data.teacherId !== undefined) {
        updateData.teacher = { connect: { id: data.teacherId } };
    }

    return await prisma.schedule.update({
        where: { id: scheduleId },
        data: updateData,
        include: {
            class: {
                include: {
                    students: true
                }
            },
            teacher: {
                select: { name: true, id: true, email: true }
            }
        }
    });
};

export const deleteSchedule = async (tenantId: string, scheduleId: string) => {
    // Verify schedule belongs to tenant
    const existingSchedule = await prisma.schedule.findFirst({
        where: { id: scheduleId, tenantId }
    });

    if (!existingSchedule) {
        throw new Error('Schedule not found or access denied');
    }

    return await prisma.schedule.delete({
        where: { id: scheduleId }
    });
};

export const getAttendanceRecap = async (tenantId: string, classId: string, monthStr: string) => {
    // monthStr format 'YYYY-MM'
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const classData = await prisma.class.findFirst({
        where: { id: classId, tenantId },
        include: {
            homeRoomTeacher: true
        }
    });

    if (!classData) throw new Error('Class not found');

    const students = await prisma.user.findMany({
        where: {
            classId: classId,
            role: 'STUDENT',
            tenantId
        },
        orderBy: { name: 'asc' }
    });

    const attendances = await prisma.attendance.findMany({
        where: {
            classId: classId,
            tenantId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    return {
        classData,
        students,
        attendances,
        period: {
            month: month,
            year: year,
            daysInMonth: endDate.getDate()
        }
    };
};
