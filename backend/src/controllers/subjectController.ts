import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as subjectService from '../services/subjectService';
import { z } from 'zod';

const createSubjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1).optional(),
    description: z.string().optional()
});

export const getSubjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // For Owner, allow tenantId via query param. For others, use their own tenantId.
    let tenantId = req.user!.tenantId;

    // If user is Owner and tenantId is provided in query, use that
    if (req.user!.role === 'OWNER' && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
    }

    if (!tenantId) {
        return res.status(400).json({
            status: 'error',
            message: 'Tenant context required. Please provide tenantId.'
        });
    }

    const subjects = await subjectService.getSubjectsByTenant(tenantId);
    res.status(200).json({ status: 'success', data: { subjects } });
});

export const createSubject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const data = createSubjectSchema.parse(req.body);
    const subject = await subjectService.createSubject(tenantId, data);
    res.status(201).json({ status: 'success', data: { subject } });
});

export const updateSubject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    const data = createSubjectSchema.partial().parse(req.body);
    const subject = await subjectService.updateSubject(tenantId, id, data);
    res.status(200).json({ status: 'success', data: { subject } });
});

export const deleteSubject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    await subjectService.deleteSubject(tenantId, id);
    res.status(204).send();
});

export const syncSubjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let tenantId = req.user!.tenantId;
    if (req.user!.role === 'OWNER' && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
    }

    if (!tenantId) {
        return res.status(400).json({ status: 'error', message: 'Tenant context required' });
    }

    const createdCount = await subjectService.syncSubjectsFromSchedule(tenantId);
    const linkedCount = await subjectService.syncTeacherSubjects(tenantId);

    res.status(200).json({
        status: 'success',
        data: {
            createdSubjects: createdCount,
            linkedTeachers: linkedCount,
            message: `Berhasil sinkronisasi: ${createdCount} mapel baru, ${linkedCount} guru dihubungkan.`
        }
    });
});
