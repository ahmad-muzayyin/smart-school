import { Request, Response, NextFunction } from 'express';
import * as gradeService from '../services/gradeService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const createGradeSchema = z.object({
    studentId: z.string().uuid(),
    scheduleId: z.string().uuid(),
    classId: z.string().uuid(),
    subject: z.string().min(1),
    semester: z.number().int().min(1).max(2),
    category: z.enum(['UTS', 'UAS', 'Tugas', 'Quiz', 'Praktek']),
    score: z.number().min(0),
    maxScore: z.number().min(1).default(100),
    notes: z.string().optional()
});

export const createGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const data = createGradeSchema.parse(req.body);

    // Validate that teacher owns the schedule
    if (userRole === 'TEACHER') {
        const schedule = await gradeService.validateScheduleOwnership(tenantId, data.scheduleId, userId);
        if (!schedule) {
            return next(new AppError('You can only create grades for your own classes', 403));
        }
    }

    const grade = await gradeService.createGrade(tenantId, data);

    res.status(201).json({
        status: 'success',
        data: { grade }
    });
});

export const getGrades = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let filters: any = {};

    // Students can only see their own grades
    if (userRole === 'STUDENT') {
        filters.studentId = userId;
    } else if (req.query.studentId) {
        filters.studentId = req.query.studentId;
    }

    if (req.query.scheduleId) {
        filters.scheduleId = req.query.scheduleId;
    }

    if (req.query.classId) {
        filters.classId = req.query.classId;
    }

    if (req.query.subject) {
        filters.subject = req.query.subject;
    }

    if (req.query.semester) {
        filters.semester = parseInt(req.query.semester as string);
    }

    if (req.query.category) {
        filters.category = req.query.category;
    }

    const grades = await gradeService.getGrades(tenantId, filters);

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: { grades }
    });
});

export const getGradesByStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { studentId } = req.params;
    const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;

    const grades = await gradeService.getGradesByStudent(tenantId, studentId, semester);

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: { grades }
    });
});

export const getGradesByClass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { classId } = req.params;
    const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
    const subject = req.query.subject as string | undefined;

    const grades = await gradeService.getGradesByClass(tenantId, classId, semester, subject);

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: { grades }
    });
});

export const getGradeStatistics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { classId } = req.params;
    const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
    const subject = req.query.subject as string | undefined;

    const statistics = await gradeService.getGradeStatistics(tenantId, classId, semester, subject);

    res.status(200).json({
        status: 'success',
        data: { statistics }
    });
});

const updateGradeSchema = z.object({
    score: z.number().min(0).optional(),
    maxScore: z.number().min(1).optional(),
    notes: z.string().optional()
});

export const updateGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    const data = updateGradeSchema.parse(req.body);

    const grade = await gradeService.updateGrade(tenantId, id, data);

    if (!grade) {
        return next(new AppError('Grade not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { grade }
    });
});

export const deleteGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    await gradeService.deleteGrade(tenantId, id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
