import { Request, Response, NextFunction } from 'express';
import * as classService from '../services/classService';
import { catchAsync } from '../utils/catchAsync';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import * as XLSX from 'xlsx';
import prisma from '../config/db';
import { Role } from '@prisma/client';
import { getTenantId } from './userController'; // We can reuse this helper if we export it, but for now I'll just redefine it or use req.user.tenantId

// Schemas
const createClassSchema = z.object({
    name: z.string().min(1),
    homeRoomTeacherId: z.string().uuid().optional()
});

const updateClassSchema = z.object({
    name: z.string().min(1).optional(),
    homeRoomTeacherId: z.string().uuid().optional().nullable()
});

const createScheduleSchema = z.object({
    classId: z.string().uuid(),
    teacherId: z.string().uuid(),
    subject: z.string().min(1),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
});

const updateScheduleSchema = z.object({
    classId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
    subject: z.string().min(1).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

export const createClass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const data = createClassSchema.parse(req.body);
    const newClass = await classService.createClass(tenantId, data);
    res.status(201).json({ status: 'success', data: { class: newClass } });
});

export const getClasses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const classes = await classService.getAllClasses(tenantId);
    res.status(200).json({ status: 'success', data: { classes } });
});

export const updateClass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    const data = updateClassSchema.parse(req.body);
    const updatedClass = await classService.updateClass(tenantId, id, data);
    res.status(200).json({ status: 'success', data: { class: updatedClass } });
});

export const deleteClass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    await classService.deleteClass(tenantId, id);
    res.status(204).json({ status: 'success', data: null });
});

export const createSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const data = createScheduleSchema.parse(req.body);
    const schedule = await classService.createSchedule(tenantId, data);
    res.status(201).json({ status: 'success', data: { schedule } });
});

export const updateSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    const data = updateScheduleSchema.parse(req.body);
    const updatedSchedule = await classService.updateSchedule(tenantId, id, data);
    res.status(200).json({ status: 'success', data: { schedule: updatedSchedule } });
});

export const deleteSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    await classService.deleteSchedule(tenantId, id);
    res.status(204).json({ status: 'success', data: null });
});

export const getTodaySchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { teacherId, classId, dayOfWeek } = req.query;

    let filters: any = {};
    if (dayOfWeek) filters.dayOfWeek = Number(dayOfWeek);
    if (classId) filters.classId = classId as string;

    if (teacherId) {
        filters.teacherId = teacherId;
    } else if (req.user?.role === 'TEACHER') {
        filters.teacherId = req.user.id;
    }

    if (req.user?.role === 'STUDENT') {
        const student = req.user as any;
        if (student.classId) {
            filters.classId = student.classId;
        } else {
            filters.classId = "none";
        }
    }

    const schedules = await classService.getSchedules(tenantId, filters);
    res.status(200).json({ status: 'success', data: { schedules } });
});

export const getScheduleById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    const schedule = await classService.getScheduleById(tenantId, id);

    if (!schedule) {
        return next(new AppError('Schedule not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { schedule }
    });
});

export const importSchedules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);

    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    if (!req.file) {
        return next(new AppError('Please upload an excel/csv file', 400));
    }

    console.log('--- Import Schedule Request Received ---');
    console.log(`File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Successfully parsed ${rawData.length} rows from file`);

    const results: any[] = [];
    const errors: any[] = [];
    let imported = 0;
    let failed = 0;

    // Cache classes and teachers to avoid repetitive DB calls
    const classes = await prisma.class.findMany({ where: { tenantId } });
    const teachers = await prisma.user.findMany({
        where: { tenantId, role: Role.TEACHER },
        include: { subjects: true }
    });
    const subjects = await prisma.subject.findMany({ where: { tenantId } });

    const dayMap: { [key: string]: number } = {
        'senin': 0, 'monday': 0, '0': 0,
        'selasa': 1, 'tuesday': 1, '1': 1,
        'rabu': 2, 'wednesday': 2, '2': 2,
        'kamis': 3, 'thursday': 3, '3': 3,
        'jumat': 4, 'friday': 4, '4': 4,
        'sabtu': 5, 'saturday': 5, '5': 5,
        'minggu': 6, 'sunday': 6, '6': 6
    };

    for (let row of rawData as any[]) {
        try {
            // Check if row is a single string that needs splitting (common CSV-in-Excel issue)
            const keys = Object.keys(row);
            if (keys.length === 1 && (keys[0].includes(',') || keys[0].includes(';'))) {
                const delimiter = keys[0].includes(',') ? ',' : ';';
                const headerParts = keys[0].split(delimiter);
                const valueParts = String(row[keys[0]]).split(delimiter);
                const newRow: any = {};
                headerParts.forEach((h, i) => {
                    newRow[h.trim()] = valueParts[i]?.trim();
                });
                row = newRow;
            }

            const className = row.ClassName || row.Kelas;
            const teacherEmail = row.TeacherEmail || row.EmailGuru;
            const subjectName = row.Subject || row.MataPelajaran;
            const dayStr = String(row.Day || row.Hari).toLowerCase();
            const startTime = row.StartTime || row.JamMulai;
            const endTime = row.EndTime || row.JamSelesai;

            // Updated validation: TeacherEmail is optional IF Subject is present for auto-link
            if (!className || !subjectName || !dayStr || !startTime || !endTime) {
                console.log('Skipping row due to missing data:', row);
                throw new Error('Data tidak lengkap (ClassName, Subject, Day, StartTime, EndTime wajib ada)');
            }

            const targetClass = classes.find(c => c.name.toLowerCase() === String(className).toLowerCase());
            if (!targetClass) throw new Error(`Kelas "${className}" tidak ditemukan`);

            // 1. Handle Subject (Auto-create if missing)
            let subjectObj = subjects.find(s => s.name.toLowerCase() === String(subjectName).toLowerCase());
            if (!subjectObj) {
                const code = String(subjectName).substring(0, 3).toUpperCase();
                subjectObj = await prisma.subject.create({
                    data: { name: subjectName, code: code, tenantId }
                });
                subjects.push(subjectObj);
            }

            let targetTeacher: any;

            if (teacherEmail) {
                targetTeacher = teachers.find(t => t.email.toLowerCase() === String(teacherEmail).toLowerCase());
                if (!targetTeacher) throw new Error(`Guru dengan email "${teacherEmail}" tidak ditemukan`);

                // Auto-link Subject to Teacher if teacher has none
                // Auto-link Subject to Teacher if teacher matches but doesn't have it assigned
                const hasSubject = targetTeacher.subjects?.some((s: any) => s.id === subjectObj.id);
                if (!hasSubject) {
                    await prisma.user.update({
                        where: { id: targetTeacher.id },
                        data: {
                            subjects: {
                                connect: { id: subjectObj.id }
                            }
                        }
                    });
                    // Update cache
                    if (!targetTeacher.subjects) targetTeacher.subjects = [];
                    targetTeacher.subjects.push(subjectObj);
                }
            } else {
                // Auto-link by subject
                const matchingTeachers = teachers.filter(t => t.subjects?.some((s: any) => s.name?.toLowerCase() === String(subjectName).toLowerCase()));

                if (matchingTeachers.length === 0) {
                    throw new Error(`Tidak ditemukan guru pengampu mata pelajaran "${subjectName}". Harap isi EmailGuru secara manual.`);
                } else if (matchingTeachers.length > 1) {
                    throw new Error(`Ditemukan ${matchingTeachers.length} guru untuk mapel "${subjectName}". Harap isi EmailGuru secara spesifik.`);
                }

                targetTeacher = matchingTeachers[0];
            }

            const dayOfWeek = dayMap[dayStr];
            if (dayOfWeek === undefined) throw new Error(`Hari "${dayStr}" tidak valid`);

            // Validate time format HH:mm
            const timeRegex = /^\d{1,2}:\d{2}$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                throw new Error('Format jam harus HH:mm');
            }

            // Normalize time (add leading zero if needed)
            const normStart = startTime.length === 4 ? `0${startTime}` : startTime;
            const normEnd = endTime.length === 4 ? `0${endTime}` : endTime;

            // Check for existing schedule to prevent duplicates (Upsert logic)
            const existingSchedule = await prisma.schedule.findFirst({
                where: {
                    tenantId,
                    classId: targetClass.id,
                    dayOfWeek,
                    startTime: normStart
                }
            });

            if (existingSchedule) {
                // Update existing
                await prisma.schedule.update({
                    where: { id: existingSchedule.id },
                    data: {
                        teacherId: targetTeacher.id,
                        subject: subjectName,
                        endTime: normEnd
                    }
                });
            } else {
                // Create new
                await prisma.schedule.create({
                    data: {
                        tenantId,
                        classId: targetClass.id,
                        teacherId: targetTeacher.id,
                        subject: subjectName,
                        dayOfWeek,
                        startTime: normStart,
                        endTime: normEnd
                    }
                });
            }

            imported++;
        } catch (error: any) {
            failed++;
            errors.push({ row, message: error.message });
        }
    }

    res.status(200).json({
        status: 'success',
        imported,
        failed,
        errors
    });
});

export const exportSchedules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId || getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const { classId, dayOfWeek } = req.query;
    const filters: any = {};
    if (classId) filters.classId = classId as string;
    if (dayOfWeek !== undefined && dayOfWeek !== null) filters.dayOfWeek = Number(dayOfWeek);

    const schedules = await classService.getSchedules(tenantId, filters);

    const dayMap = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    const data = schedules.map(s => ({
        Hari: dayMap[s.dayOfWeek] || s.dayOfWeek,
        JamMulai: s.startTime,
        JamSelesai: s.endTime,
        Kelas: s.class?.name || 'Unknown',
        MataPelajaran: s.subject,
        Guru: s.teacher?.name || 'Unknown',
        EmailGuru: s.teacher?.email || 'Unknown'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=jadwal_pelajaran.xlsx');
    res.send(buffer);
});
