import prisma from '../config/db';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const signToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '90d',
    });
};

export const login = async (email: string, password: string) => { // Removed tenantId
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenant: {
                select: {
                    name: true,
                    isActive: true
                }
            },
            subjects: {
                select: {
                    id: true,
                    name: true
                }
            },
            class: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    // Check if tenant is active (skip for OWNER)
    // Use strict check === false to avoid blocking if isActive is undefined/null (e.g. migration quirks)
    // Default is active.
    if (user.role !== 'OWNER' && user.tenant && user.tenant.isActive === false) {
        throw new AppError('Sekolah anda sedang tidak aktif/ditangguhkan. Hubungi pemilik sekolah.', 403);
    }

    const token = signToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    const userWithClassName = {
        ...userWithoutPassword,
        className: user.class?.name
    };

    return { token, user: userWithClassName };
};

export const updatePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        throw new AppError('Password saat ini salah', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword
        }
    });

    return signToken(user.id);
};
