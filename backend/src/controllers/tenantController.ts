import { Request, Response, NextFunction } from 'express';
import * as tenantService from '../services/tenantService';
import { catchAsync } from '../utils/catchAsync';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const createTenantSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    adminEmail: z.string().email(),
    adminName: z.string().min(1),
    adminPassword: z.string().min(6),
});

export const createTenant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = createTenantSchema.parse(req.body);
    const result = await tenantService.createTenant(
        data.name,
        data.address,
        data.adminEmail,
        data.adminName,
        data.adminPassword
    );

    res.status(201).json({
        status: 'success',
        data: result,
    });
});

export const getAllTenants = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenants = await tenantService.getAllTenants();
    res.status(200).json({
        status: 'success',
        results: tenants.length,
        data: { tenants }
    });
});

export const getTenantStatistics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const statistics = await tenantService.getTenantStatistics();
    res.status(200).json({
        status: 'success',
        data: { statistics }
    });
});

export const getTenant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
        return next(new AppError('School not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { tenant }
    });
});

const updateTenantSchema = z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    website: z.union([z.string().url(), z.literal('')]).optional(),
    logo: z.string().optional(),
    isActive: z.boolean().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    allowedRadius: z.number().int().optional(),
});

export const updateTenant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    let processedBody = { ...req.body };

    // Handle Logo Upload
    if (req.file) {
        const protocol = req.secure ? 'https' : 'http';
        const fileUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        processedBody.logo = fileUrl;
    }

    // Handle Type Coercion for FormData (since everything is string)
    if (processedBody.latitude) processedBody.latitude = parseFloat(processedBody.latitude);
    if (processedBody.longitude) processedBody.longitude = parseFloat(processedBody.longitude);
    if (processedBody.allowedRadius) processedBody.allowedRadius = parseInt(processedBody.allowedRadius, 10);

    if (processedBody.isActive === 'true') processedBody.isActive = true;
    if (processedBody.isActive === 'false') processedBody.isActive = false;

    // Handle empty strings as undefined for optional fields to avoid validation errors or overwriting with empty
    // Actually Zod .optional() handles undefined, but empty string might be invalid for url or email
    if (processedBody.email === '') processedBody.email = undefined;
    if (processedBody.website === '') processedBody.website = undefined;

    const data = updateTenantSchema.parse(processedBody);

    const tenant = await tenantService.updateTenant(id, data);

    res.status(200).json({
        status: 'success',
        data: { tenant }
    });
});
