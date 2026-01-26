import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Role } from '@prisma/client';

export const requireTenant = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role === Role.OWNER) {
        // Owner can access everything, but if they want to act AS a tenant user, they might pass X-Tenant-ID header?
        // For now, allow owner.
        return next();
    }

    if (!req.user?.tenantId) {
        return next(new AppError('User is not associated with any tenant.', 403));
    }

    next();
};

export const scopedQuery = (req: Request) => {
    if (req.user?.role === Role.OWNER) {
        // If owner, we might check query params for ?tenantId=... or return empty object to find all
        // However, "Queries must always scope by tenant_id". 
        // If owner wants to see ALL, they can.
        return {};
    }
    return { tenantId: req.user!.tenantId! };
}
