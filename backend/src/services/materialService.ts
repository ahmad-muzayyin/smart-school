import prisma from '../config/db';

export const createMaterial = async (tenantId: string, teacherId: string, data: {
    classId?: string;
    subject: string;
    title: string;
    description?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    category: string;
    isPublic: boolean;
}) => {
    return await prisma.teachingMaterial.create({
        data: {
            tenantId,
            teacherId,
            ...data
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const getMaterials = async (tenantId: string, filters: any = {}) => {
    return await prisma.teachingMaterial.findMany({
        where: {
            tenantId,
            ...(filters.studentAccess ? {
                OR: [
                    { isPublic: true },
                    { classId: filters.studentAccess.classId }
                ]
            } : filters)
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

export const getMaterialById = async (tenantId: string, materialId: string) => {
    return await prisma.teachingMaterial.findFirst({
        where: {
            id: materialId,
            tenantId
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const updateMaterial = async (tenantId: string, materialId: string, data: {
    title?: string;
    description?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    category?: string;
    isPublic?: boolean;
}) => {
    return await prisma.teachingMaterial.update({
        where: { id: materialId },
        data,
        include: {
            teacher: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const deleteMaterial = async (tenantId: string, materialId: string) => {
    return await prisma.teachingMaterial.delete({
        where: { id: materialId }
    });
};
