import prisma from '../config/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export const createTenant = async (name: string, address: string, adminEmail: string, adminName: string, adminPassword: string) => {
    // Transaction to create tenant and initial admin
    return await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
            data: {
                name,
                address,
            },
        });

        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        const admin = await tx.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                role: Role.SCHOOL_ADMIN,
                tenantId: tenant.id,
            },
        });

        return { tenant, admin };
    });
};

export const getTenantById = async (id: string) => {
    return await prisma.tenant.findUnique({
        where: { id },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            },
            classes: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

export const updateTenant = async (id: string, data: any) => {
    return await prisma.tenant.update({
        where: { id },
        data
    });
};

export const getAllTenants = async () => {
    return await prisma.tenant.findMany({
        include: {
            users: {
                where: { role: Role.SCHOOL_ADMIN },
                select: { email: true, name: true }
            }
        }
    });
};

export const getTenantStatistics = async () => {
    const tenants = await prisma.tenant.findMany({
        include: {
            users: {
                select: {
                    role: true
                }
            },
            classes: {
                select: {
                    id: true
                }
            }
        }
    });

    return tenants.map(tenant => {
        const studentCount = tenant.users.filter(u => u.role === 'STUDENT').length;
        const teacherCount = tenant.users.filter(u => u.role === 'TEACHER').length;
        const classCount = tenant.classes.length;

        return {
            id: tenant.id,
            name: tenant.name,
            studentCount,
            teacherCount,
            classCount,
            totalUsers: tenant.users.length,
            isActive: (tenant as any).isActive ?? true
        };
    });
};
