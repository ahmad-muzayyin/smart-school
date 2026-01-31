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

    // 1. Fetch Tenant Details for Header
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
    });

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

    // 2. Setup ExcelJS Workbook
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Absensi');

    // Setup Columns
    worksheet.columns = [
        { header: '', key: 'no', width: 5 },
        { header: '', key: 'date', width: 15 },
        { header: '', key: 'student', width: 25 },
        { header: '', key: 'class', width: 15 },
        { header: '', key: 'subject', width: 25 },
        { header: '', key: 'status', width: 15 },
        { header: '', key: 'notes', width: 30 },
    ];

    // 3. Add Logo & Header (Kop Surat)
    let hasLogo = false;

    // Try to fetch logo if exists
    if (tenant?.logo) {
        try {
            const axios = require('axios');
            // Add timeout and validate status
            const response = await axios.get(tenant.logo, {
                responseType: 'arraybuffer',
                timeout: 5000
            });

            if (response.status === 200 && response.data.length > 0) {
                const imageId = workbook.addImage({
                    buffer: response.data,
                    extension: 'png',
                });

                // Insert logo at A1 with decent size (approx 100x100px)
                worksheet.addImage(imageId, {
                    tl: { col: 0.2, row: 0.2 }, // Slightly padded
                    ext: { width: 80, height: 80 },
                    editAs: 'absolute'
                });
                hasLogo = true;
            }
        } catch (e: any) { // Explicitly type 'e' as 'any' or 'Error'
            console.error('Failed to load logo for excel (URL: ' + tenant.logo + '):', e.message);
            // Fallback: If fetch fails, we simply don't show the broken image icon.
            // In ExcelJS, if we don't addImage, nothing shows up (clean).
        }
    }

    // Set Row Height for Kop Surat
    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(3).height = 20;
    worksheet.getRow(4).height = 10; // Spacing

    // Header Text - Center Aligned properly
    // School Name
    worksheet.mergeCells('B1:G1'); // Shifted to B to leave A for Logo space visual
    const nameCell = worksheet.getCell('B1');
    nameCell.value = (tenant?.name || 'SEKOLAH').toUpperCase();
    nameCell.font = { name: 'Arial', size: 16, bold: true };
    nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Address
    if (tenant?.address) {
        worksheet.mergeCells('B2:G2');
        const addrCell = worksheet.getCell('B2');
        addrCell.value = tenant.address;
        addrCell.font = { name: 'Arial', size: 10 };
        addrCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Report Title
    worksheet.mergeCells('B3:G3');
    worksheet.getCell('B3').value = `LAPORAN PRESENSI HARIAN`;
    worksheet.getCell('B3').font = { name: 'Arial', size: 12, bold: true, underline: true };
    worksheet.getCell('B3').alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateStr = req.query.date ? new Date(req.query.date as string).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Semua Periode';
    worksheet.mergeCells('B4:G4');
    worksheet.getCell('B4').value = `Tanggal: ${dateStr}`;
    worksheet.getCell('B4').alignment = { vertical: 'middle', horizontal: 'center' };


    // 4. Data Table Header
    const headerRowIdx = 5;
    const headerValues = ['No', 'Tanggal', 'Siswa', 'Kelas', 'Mapel', 'Status', 'Catatan'];

    worksheet.getRow(headerRowIdx).values = headerValues;

    // Style Header Row
    worksheet.getRow(headerRowIdx).font = { bold: true };
    worksheet.getRow(headerRowIdx).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' }
    };

    headerValues.forEach((_, idx) => {
        const cell = worksheet.getCell(headerRowIdx, idx + 1);
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });


    // 5. Populate Data
    let currentRowIdx = headerRowIdx + 1;
    attendance.forEach((a, index) => {
        const row = worksheet.getRow(currentRowIdx);
        row.values = [
            index + 1,
            new Date(a.date).toLocaleDateString('id-ID'),
            a.student?.name || 'N/A',
            (a.student as any)?.class?.name || 'N/A',
            a.schedule?.subject || 'N/A',
            a.status,
            a.notes || '-'
        ];

        // Border for data cells
        for (let i = 1; i <= 7; i++) {
            const cell = row.getCell(i);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            if (i === 1 || i === 2 || i === 6) { // Center No, Date, Status
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
        }

        currentRowIdx++;
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Absensi.xlsx');
    res.send(buffer);
});
