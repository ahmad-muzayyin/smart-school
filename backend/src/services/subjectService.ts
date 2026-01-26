import prisma from '../config/db';

export const getSubjectsByTenant = async (tenantId: string) => {
    return await prisma.subject.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    });
};

export const createSubject = async (tenantId: string, data: { name: string; code?: string; description?: string }) => {
    return await prisma.subject.create({
        data: {
            tenantId,
            name: data.name,
            code: data.code || data.name.substring(0, 3).toUpperCase(),
            description: data.description
        }
    });
};

export const updateSubject = async (tenantId: string, id: string, data: Partial<{ name: string; code?: string; description?: string }>) => {
    return await prisma.subject.update({
        where: { id, tenantId },
        data
    });
};

export const deleteSubject = async (tenantId: string, id: string) => {
    return await prisma.subject.delete({
        where: { id, tenantId }
    });
};

export const syncSubjectsFromSchedule = async (tenantId: string) => {
    // 1. Get all distinct subjects from Schedule
    const schedules = await prisma.schedule.findMany({
        where: { tenantId },
        select: { subject: true },
        distinct: ['subject']
    });

    const scheduleSubjects = schedules.map(s => s.subject);

    // 2. Get existing subjects
    const existing = await prisma.subject.findMany({
        where: { tenantId },
        select: { name: true }
    });
    const existingNames = new Set(existing.map(e => e.name.toLowerCase()));

    // 3. Determine new subjects
    const newSubjects = scheduleSubjects.filter(name => !existingNames.has(name.toLowerCase()));

    // 4. Create new subjects
    let createdCount = 0;
    for (const name of newSubjects) {
        const code = name.substring(0, 3).toUpperCase();
        await prisma.subject.create({
            data: {
                tenantId,
                name,
                code
            }
        });
        createdCount++;
    }

    return createdCount;
};

export const syncTeacherSubjects = async (tenantId: string) => {
    // 1. Get all schedules with teacherId and subject name
    const schedules = await prisma.schedule.findMany({
        where: { tenantId },
        select: { teacherId: true, subject: true },
        distinct: ['teacherId', 'subject']
    });

    // 2. Get all subjects map (name -> id)
    const allSubjects = await prisma.subject.findMany({
        where: { tenantId },
        select: { id: true, name: true }
    });

    const subjectMap = new Map<string, string>();
    allSubjects.forEach(s => subjectMap.set(s.name.toLowerCase(), s.id));

    let linkedCount = 0;

    // 3. Link teachers
    for (const sch of schedules) {
        const subjectId = subjectMap.get(sch.subject.toLowerCase());
        if (subjectId) {
            // Check if already connected to avoid unnecessary writes/errors
            // Actually, using connect on a set that might already exist doesn't throw if we use 'connect' with unique input, 
            // but for M-N it's safer to just try/catch or assume it's idempotent if we use ignore. 
            // Prisma doesn't have 'connectOrIgnore'. 
            // Let's just do an update with connect. Prisma handles "already connected" gracefully usually, 
            // or we can check first. 

            // To be safe and efficient: fetch user's subjects first? No, that's N+1.
            // Let's just try to connect.
            try {
                // We check if the connection exists to be "clean"
                const user = await prisma.user.findUnique({
                    where: { id: sch.teacherId },
                    select: { subjects: { where: { id: subjectId } } }
                });

                if (user && user.subjects.length === 0) {
                    await prisma.user.update({
                        where: { id: sch.teacherId },
                        data: {
                            subjects: {
                                connect: { id: subjectId }
                            }
                        }
                    });
                    linkedCount++;
                }
            } catch (e) {
                console.error(`Failed to link teacher ${sch.teacherId} to subject ${sch.subject}`, e);
            }
        }
    }

    return linkedCount;
};
