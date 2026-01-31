import prisma from '../config/db';

export const createJournal = async (tenantId: string, data: {
    teacherId: string;
    classId: string;
    scheduleId?: string;
    subject: string;
    date: Date;
    topic: string;
    notes?: string;
}) => {
    return await prisma.journal.create({
        data: {
            tenantId,
            ...data
        }
    });
};

export const getJournals = async (tenantId: string, filters: {
    teacherId?: string;
    classId?: string;
    date?: string; // YYYY-MM-DD
    month?: string; // YYYY-MM
}) => {
    const where: any = { tenantId };

    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.classId) where.classId = filters.classId;

    if (filters.date) {
        where.date = new Date(filters.date);
    } else if (filters.month) {
        const [year, month] = filters.month.split('-');
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0);
        where.date = { gte: startDate, lte: endDate };
    }

    return await prisma.journal.findMany({
        where,
        include: {
            class: true,
            teacher: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const deleteJournal = async (tenantId: string, id: string) => {
    return await prisma.journal.delete({
        where: { id, tenantId }
    });
};
