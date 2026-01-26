import { Request, Response, NextFunction } from 'express';
import * as materialService from '../services/materialService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const createMaterialSchema = z.object({
    classId: z.string().uuid().optional(),
    subject: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    fileUrl: z.union([z.string().url(), z.literal('')]).optional(),
    fileName: z.string().optional(),
    fileSize: z.number().int().optional(),
    fileType: z.enum(['PDF', 'PPT', 'DOC', 'VIDEO', 'LINK', 'IMAGE']).optional(),
    category: z.enum(['Materi', 'Tugas', 'Latihan', 'Video', 'Referensi']),
    isPublic: z.boolean().default(false)
});

export const createMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id;

    const data = createMaterialSchema.parse(req.body);

    const material = await materialService.createMaterial(tenantId, teacherId, data);

    res.status(201).json({
        status: 'success',
        data: { material }
    });
});

export const getMaterials = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let filters: any = {};

    // Teachers can see their own materials
    if (userRole === 'TEACHER' && !req.query.teacherId) {
        filters.teacherId = userId;
    } else if (req.query.teacherId) {
        filters.teacherId = req.query.teacherId;
    }

    if (req.query.classId) {
        filters.classId = req.query.classId;
    }

    if (req.query.subject) {
        filters.subject = req.query.subject;
    }

    if (req.query.category) {
        filters.category = req.query.category;
    }

    if (req.query.fileType) {
        filters.fileType = req.query.fileType;
    }

    const materials = await materialService.getMaterials(tenantId, filters);

    res.status(200).json({
        status: 'success',
        results: materials.length,
        data: { materials }
    });
});

export const getMaterialById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    const material = await materialService.getMaterialById(tenantId, id);

    if (!material) {
        return next(new AppError('Material not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { material }
    });
});

const updateMaterialSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    fileUrl: z.union([z.string().url(), z.literal('')]).optional(),
    fileName: z.string().optional(),
    fileSize: z.number().int().optional(),
    fileType: z.enum(['PDF', 'PPT', 'DOC', 'VIDEO', 'LINK', 'IMAGE']).optional(),
    category: z.enum(['Materi', 'Tugas', 'Latihan', 'Video', 'Referensi']).optional(),
    isPublic: z.boolean().optional()
});

export const updateMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateMaterialSchema.parse(req.body);

    // Verify ownership
    const existing = await materialService.getMaterialById(tenantId, id);
    if (!existing) {
        return next(new AppError('Material not found', 404));
    }

    if (existing.teacherId !== userId && req.user!.role !== 'SCHOOL_ADMIN') {
        return next(new AppError('You can only update your own materials', 403));
    }

    const material = await materialService.updateMaterial(tenantId, id, data);

    res.status(200).json({
        status: 'success',
        data: { material }
    });
});

export const deleteMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await materialService.getMaterialById(tenantId, id);
    if (!existing) {
        return next(new AppError('Material not found', 404));
    }

    if (existing.teacherId !== userId && req.user!.role !== 'SCHOOL_ADMIN') {
        return next(new AppError('You can only delete your own materials', 403));
    }

    await materialService.deleteMaterial(tenantId, id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
