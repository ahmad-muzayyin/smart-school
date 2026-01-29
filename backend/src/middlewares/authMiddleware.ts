import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import prisma from '../config/db';

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let token;
    console.log(`Auth Check for: ${req.method} ${req.originalUrl}`);
    // console.log('Headers:', JSON.stringify(req.headers)); // Too verbose
    console.log('Auth Header:', req.headers.authorization ? 'Present' : 'MISSING');

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.log('Auth Failed: No token provided');
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        console.log('Token Decoded:', decoded.id, decoded.role);

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!currentUser) {
            console.log('Auth Failed: User not found in DB');
            return next(
                new AppError(
                    'The user belonging to this token does no longer exist.',
                    401
                )
            );
        }

        req.user = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            tenantId: currentUser.tenantId,
        };
        next();
    } catch (err) {
        console.log('Auth Failed: Token verification error', err);
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};
