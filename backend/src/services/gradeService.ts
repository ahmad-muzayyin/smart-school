import prisma from '../config/db';

export const validateScheduleOwnership = async (tenantId: string, scheduleId: string, teacherId: string) => {
    return await prisma.schedule.findFirst({
        where: {
            id: scheduleId,
            tenantId,
            teacherId
        }
    });
};

export const createGrade = async (tenantId: string, data: {
    studentId: string;
    scheduleId: string;
    classId: string;
    subject: string;
    semester: number;
    category: string;
    score: number;
    maxScore: number;
    notes?: string;
}) => {
    return await prisma.grade.create({
        data: {
            tenantId,
            ...data
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const getGrades = async (tenantId: string, filters: any = {}) => {
    return await prisma.grade.findMany({
        where: {
            tenantId,
            ...filters
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            class: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: [
            { semester: 'desc' },
            { subject: 'asc' },
            { category: 'asc' }
        ]
    });
};

export const getGradesByStudent = async (tenantId: string, studentId: string, semester?: number) => {
    const where: any = {
        tenantId,
        studentId
    };

    if (semester) {
        where.semester = semester;
    }

    return await prisma.grade.findMany({
        where,
        include: {
            class: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: [
            { semester: 'desc' },
            { subject: 'asc' },
            { category: 'asc' }
        ]
    });
};

export const getGradesByClass = async (tenantId: string, classId: string, semester?: number, subject?: string) => {
    const where: any = {
        tenantId,
        classId
    };

    if (semester) {
        where.semester = semester;
    }

    if (subject) {
        where.subject = subject;
    }

    return await prisma.grade.findMany({
        where,
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: [
            { student: { name: 'asc' } },
            { category: 'asc' }
        ]
    });
};

export const getGradeStatistics = async (tenantId: string, classId: string, semester?: number, subject?: string) => {
    const where: any = {
        tenantId,
        classId
    };

    if (semester) {
        where.semester = semester;
    }

    if (subject) {
        where.subject = subject;
    }

    const grades = await prisma.grade.findMany({
        where,
        select: {
            score: true,
            maxScore: true,
            category: true,
            subject: true
        }
    });

    // Calculate statistics
    const stats: any = {
        totalGrades: grades.length,
        byCategory: {} as any,
        bySubject: {} as any,
        overall: {
            average: 0,
            highest: 0,
            lowest: 100
        }
    };

    if (grades.length === 0) {
        return stats;
    }

    let totalScore = 0;
    let totalMaxScore = 0;

    grades.forEach(grade => {
        const percentage = (grade.score / grade.maxScore) * 100;

        // Overall stats
        totalScore += grade.score;
        totalMaxScore += grade.maxScore;
        if (percentage > stats.overall.highest) stats.overall.highest = percentage;
        if (percentage < stats.overall.lowest) stats.overall.lowest = percentage;

        // By category
        if (!stats.byCategory[grade.category]) {
            stats.byCategory[grade.category] = {
                count: 0,
                totalScore: 0,
                totalMaxScore: 0,
                average: 0
            };
        }
        stats.byCategory[grade.category].count++;
        stats.byCategory[grade.category].totalScore += grade.score;
        stats.byCategory[grade.category].totalMaxScore += grade.maxScore;

        // By subject
        if (!stats.bySubject[grade.subject]) {
            stats.bySubject[grade.subject] = {
                count: 0,
                totalScore: 0,
                totalMaxScore: 0,
                average: 0
            };
        }
        stats.bySubject[grade.subject].count++;
        stats.bySubject[grade.subject].totalScore += grade.score;
        stats.bySubject[grade.subject].totalMaxScore += grade.maxScore;
    });

    // Calculate averages
    stats.overall.average = (totalScore / totalMaxScore) * 100;

    Object.keys(stats.byCategory).forEach(category => {
        const cat = stats.byCategory[category];
        cat.average = (cat.totalScore / cat.totalMaxScore) * 100;
    });

    Object.keys(stats.bySubject).forEach(subject => {
        const subj = stats.bySubject[subject];
        subj.average = (subj.totalScore / subj.totalMaxScore) * 100;
    });

    return stats;
};

export const updateGrade = async (tenantId: string, gradeId: string, data: {
    score?: number;
    maxScore?: number;
    notes?: string;
}) => {
    const grade = await prisma.grade.findFirst({
        where: { id: gradeId, tenantId }
    });

    if (!grade) {
        return null;
    }

    return await prisma.grade.update({
        where: { id: gradeId },
        data,
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const deleteGrade = async (tenantId: string, gradeId: string) => {
    const grade = await prisma.grade.findFirst({
        where: { id: gradeId, tenantId }
    });

    if (!grade) {
        throw new Error('Grade not found');
    }

    return await prisma.grade.delete({
        where: { id: gradeId }
    });
};
