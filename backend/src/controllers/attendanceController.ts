import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendanceService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { z } from 'zod';
import { AttendanceStatus, Role } from '@prisma/client';
import * as XLSX from 'xlsx';
import prisma from '../config/db';

const getTenantId = (req: Request) => {
    return req.user?.tenantId;
};

const submitAttendanceSchema = z.object({
    scheduleId: z.string().uuid(),
    studentId: z.string().uuid(),
    date: z.string().datetime(), // ISO string
    status: z.nativeEnum(AttendanceStatus),
    notes: z.string().optional()
});


export const submitAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const data = submitAttendanceSchema.parse(req.body);

    // Convert date string to Date object
    const dateObj = new Date(data.date);
    dateObj.setUTCHours(0, 0, 0, 0);

    // Validate that the schedule belongs to the teacher (if user is a teacher)
    if (userRole === 'TEACHER') {
        const schedule = await attendanceService.getScheduleForValidation(tenantId, data.scheduleId);

        if (!schedule) {
            console.error('Schedule not found:', data.scheduleId);
            return next(new AppError('Schedule not found', 404));
        }

        // Check if teacher owns this schedule
        if (schedule.teacherId !== userId) {
            console.error('Unauthorized attendance submission:', {
                userId,
                scheduleTeacherId: schedule.teacherId
            });
            return next(new AppError('You can only submit attendance for your own classes', 403));
        }

        // Validate that student belongs to the class in this schedule
        const student = await attendanceService.getStudentForValidation(tenantId, data.studentId);

        if (!student) {
            console.error('Student not found:', data.studentId);
            return next(new AppError('Student not found', 404));
        }

        if (student.classId !== schedule.classId) {
            console.error('Student not in class:', {
                studentId: data.studentId,
                studentClassId: student.classId,
                scheduleClassId: schedule.classId
            });
            return next(new AppError('Student does not belong to this class', 400));
        }

        console.log('Attendance validation passed:', {
            userId,
            scheduleId: data.scheduleId,
            studentId: data.studentId
        });
    }

    const result = await attendanceService.submitAttendance(
        tenantId,
        data.scheduleId,
        data.studentId,
        dateObj,
        data.status,
        data.notes
    );

    res.status(200).json({ status: 'success', data: { attendance: result } });
});

export const createPermission = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== Role.STUDENT) {
        return next(new AppError('Only students can request permission', 403));
    }

    const { date, reason, notes } = req.body; // reason: "Sakit", "Izin", etc.

    if (!date || !reason) {
        return next(new AppError('Date and Reason are required', 400));
    }

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    // Call service to create attendance records for all schedules on that day
    const count = await attendanceService.createPermissionForDay(tenantId, userId, dateObj, reason, notes);

    res.status(201).json({
        status: 'success',
        message: `Permission submitted for ${count} classes`,
        data: { count }
    });
});

export const getAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    let filters: any = {};

    if (req.user!.role === 'STUDENT') {
        filters.studentId = req.user!.id;
    } else if (req.query.studentId) {
        filters.studentId = req.query.studentId;
    }

    if (req.query.date) {
        const d = new Date(req.query.date as string);
        d.setUTCHours(0, 0, 0, 0);
        filters.date = d;
    }

    if (req.query.scheduleId) {
        filters.scheduleId = req.query.scheduleId;
    }

    const attendance = await attendanceService.getAttendanceHistory(tenantId, filters);
    res.status(200).json({ status: 'success', data: { attendance } });
});

export const exportAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    let filters: any = {};
    if (req.user!.role === 'STUDENT') {
        filters.studentId = req.user!.id;
    } else if (req.query.studentId) {
        filters.studentId = req.query.studentId;
    }

    if (req.query.date) {
        const d = new Date(req.query.date as string);
        d.setUTCHours(0, 0, 0, 0);
        filters.date = d;
    }

    if (req.query.scheduleId) {
        filters.scheduleId = req.query.scheduleId;
    }

    if (req.query.classId) {
        filters.classId = req.query.classId;
    }

    const attendance = await attendanceService.getAttendanceHistory(tenantId, filters);

    // Format data for Excel
    const data = attendance.map(a => ({
        Tanggal: new Date(a.date).toLocaleDateString('id-ID'),
        Siswa: a.student?.name || 'N/A',
        Kelas: (a.student as any)?.class?.name || 'N/A',
        Mapel: a.schedule?.subject || 'N/A',
        Status: a.status,
        Catatan: a.notes || '-'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Absensi');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=laporan_absensi.xlsx');
    res.send(buffer);
});
