import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as journalService from '../services/journalService';
import { z } from 'zod';

const createJournalSchema = z.object({
    classId: z.string().uuid(),
    scheduleId: z.string().uuid().optional(),
    subject: z.string().min(1),
    date: z.string(), // YYYY-MM-DD
    topic: z.string().min(1),
    notes: z.string().optional()
});

export const createJournal = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id; // Assumes teacher is creating it
    const data = createJournalSchema.parse(req.body);

    const journal = await journalService.createJournal(tenantId, {
        teacherId,
        classId: data.classId,
        scheduleId: data.scheduleId,
        subject: data.subject,
        date: new Date(data.date),
        topic: data.topic,
        notes: data.notes
    });

    res.status(201).json({ status: 'success', data: { journal } });
});

export const getJournals = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { classId, date, month } = req.query;

    const filters: any = {};
    if (classId) filters.classId = classId as string;
    if (date) filters.date = date as string;
    if (month) filters.month = month as string;

    // If teacher, only show their journals? Or allow seeing all?
    // Usually admin sees all, teacher sees theirs.
    if (req.user!.role === 'TEACHER') {
        filters.teacherId = req.user!.id; // Force self
    }

    const journals = await journalService.getJournals(tenantId, filters);

    res.status(200).json({ status: 'success', data: { journals } });
});

export const deleteJournal = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    await journalService.deleteJournal(tenantId, id);

    res.status(204).json({ status: 'success', data: null });
});
