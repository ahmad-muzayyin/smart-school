import { Request, Response, NextFunction } from 'express';
import * as teacherAttendanceService from '../services/teacherAttendanceService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const checkInSchema = z.object({
    checkInLat: z.number(),
    checkInLong: z.number(),
    checkInPhoto: z.string().min(1, "Photo is required"),
    checkInAddress: z.string().optional()
});

const checkOutSchema = z.object({
    checkOutLat: z.number(),
    checkOutLong: z.number(),
    checkOutPhoto: z.string().min(1, "Photo is required"),
    checkOutAddress: z.string().optional()
});

export const checkIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id;

    try {
        const data = checkInSchema.parse(req.body);
        const attendance = await teacherAttendanceService.checkIn(tenantId, teacherId, data);

        res.status(201).json({
            status: 'success',
            data: { attendance }
        });
    } catch (err: any) {
        if (err.message === 'Already checked in for today') {
            return next(new AppError('Already checked in for today', 400));
        }
        throw err;
    }
});

export const checkOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id;

    try {
        const data = checkOutSchema.parse(req.body);
        const attendance = await teacherAttendanceService.checkOut(tenantId, teacherId, data);

        res.status(200).json({
            status: 'success',
            data: { attendance }
        });
    } catch (err: any) {
        if (err.message === 'You have not checked in yet today') {
            return next(new AppError('You have not checked in yet today', 400));
        }
        if (err.message === 'Already checked out for today') {
            return next(new AppError('Already checked out for today', 400));
        }
        throw err;
    }
});

export const getHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id;

    // Allow users to see their own history. 
    // If admin wants to see, we might need a different endpoint or query params.
    // Assuming this is "My Attendance" for now.

    const history = await teacherAttendanceService.getHistory(tenantId, teacherId);

    res.status(200).json({
        status: 'success',
        results: history.length,
        data: { history }
    });
});

export const getTodayStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const teacherId = req.user!.id;

    const attendance = await teacherAttendanceService.getTodayStatus(tenantId, teacherId);

    res.status(200).json({
        status: 'success',
        data: {
            checkedIn: !!attendance,
            checkedOut: !!attendance?.checkOutTime,
            attendance
        }
    });
});
