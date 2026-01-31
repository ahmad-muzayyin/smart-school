import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as XLSX from 'xlsx';
import prisma from '../config/db';
import { getTenantId } from './userController';
import ExcelJS from 'exceljs';

// --- HELPER: Normalize Strings ---
const normalize = (str: string) => str?.toString().toUpperCase().trim().replace(/\s+/g, ' ');

export const downloadImportTemplate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    const { type } = req.query; // 'schedules', 'students', 'teachers'

    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const workbook = new ExcelJS.Workbook();

    // 1. DATA SHEET (For User Input)
    const worksheet = workbook.addWorksheet('TEMPLATE_ISIAN');

    // 2. REFERENCE SHEET (Read Only Data)
    const refSheet = workbook.addWorksheet('REFERENSI_DATA');
    refSheet.state = 'hidden'; // Hide it to keep it clean, or 'visible' if you want user to copy-paste

    // --- FETCH DATA FOR REFS ---
    const classes = await prisma.class.findMany({ where: { tenantId }, select: { name: true } });
    const subjects = await prisma.subject.findMany({ where: { tenantId }, select: { name: true, code: true } });
    const teachers = await prisma.user.findMany({ where: { tenantId, role: 'TEACHER' }, select: { name: true, email: true } });

    // --- POPULATE REFS ---
    // Classes in Col A
    refSheet.getCell('A1').value = 'DAFTAR KELAS';
    classes.forEach((c, i) => { refSheet.getCell(`A${i + 2}`).value = c.name; });
    const classRange = `REFERENSI_DATA!$A$2:$A$${classes.length + 1}`;

    // Subjects in Col B
    refSheet.getCell('B1').value = 'DAFTAR MAPEL';
    subjects.forEach((s, i) => { refSheet.getCell(`B${i + 2}`).value = `${s.name} (${s.code})`; });
    const subjectRange = `REFERENSI_DATA!$B$2:$B$${subjects.length + 1}`;

    // Teachers in Col C
    refSheet.getCell('C1').value = 'DAFTAR GURU';
    teachers.forEach((t, i) => { refSheet.getCell(`C${i + 2}`).value = `${t.name} [${t.email}]`; });
    const teacherRange = `REFERENSI_DATA!$C$2:$C$${teachers.length + 1}`;

    // --- CONFIGURE MAIN SHEET BASED ON TYPE ---
    if (type === 'schedules') {
        worksheet.columns = [
            { header: 'HARI', key: 'day', width: 15 },
            { header: 'JAM MULAI (HH:MM)', key: 'start', width: 15 },
            { header: 'JAM SELESAI (HH:MM)', key: 'end', width: 15 },
            { header: 'KELAS', key: 'class', width: 20 },
            { header: 'MAPEL', key: 'subject', width: 30 },
            { header: 'GURU', key: 'teacher', width: 30 },
        ];

        // Add Data Validations (Dropdowns)
        // Note: ExcelJS validation formulas must refer to ranges
        for (let r = 2; r <= 100; r++) {
            // Day Dropdown
            worksheet.getCell(`A${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"SENIN,SELASA,RABU,KAMIS,JUMAT,SABTU,MINGGU"'],
                showErrorMessage: true,
                errorTitle: 'Hari Salah',
                error: 'Pilih hari dari dropdown'
            };

            // Class Dropdown
            worksheet.getCell(`D${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [classRange],
                showErrorMessage: true,
                error: 'Kelas tidak ada di database'
            };

            // Subject Dropdown
            worksheet.getCell(`E${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [subjectRange],
                showErrorMessage: true,
                error: 'Mapel tidak valid'
            };

            // Teacher Dropdown
            worksheet.getCell(`F${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [teacherRange],
                showErrorMessage: true,
                error: 'Guru tidak valid'
            };
        }

        // Add Example Row
        worksheet.getRow(2).values = ['SENIN', '07:00', '08:30', classes[0]?.name || 'X-A', subjects[0] ? `${subjects[0].name} (${subjects[0].code})` : 'MATEMATIKA', teachers[0] ? `${teachers[0].name} [${teachers[0].email}]` : ''];
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Template_${type}_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
});

export const importSchedules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));
    if (!req.file) return next(new AppError('Upload file excel', 400));

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    // Pre-fetch references for fast lookup
    const classMap = new Map();
    (await prisma.class.findMany({ where: { tenantId } })).forEach(c => classMap.set(normalize(c.name), c.id));

    // For subjects and teachers, user might upload "Name (Code)" format from template. We need to parse.
    const subjects = await prisma.subject.findMany({ where: { tenantId } });
    const teachers = await prisma.user.findMany({ where: { tenantId, role: 'TEACHER' } });

    // Helper to find ID fuzzily
    const findSubjectId = (input: string) => {
        if (!input) return null;
        const norm = normalize(input); // e.g., "MATEMATIKA (MTK01)"
        // Try strict match
        let found = subjects.find(s => normalize(s.name) === norm || normalize(s.code) === norm);
        // Try match within string (if template format used)
        if (!found) found = subjects.find(s => norm.includes(normalize(s.code)) || norm.includes(normalize(s.name)));
        return found?.id;
    };

    const findTeacherId = (input: string) => {
        if (!input) return null;
        const norm = normalize(input);
        // Try match email inside brackets
        const emailMatch = input.match(/\[(.*?)\]/);
        if (emailMatch) {
            const email = emailMatch[1];
            const byEmail = teachers.find(t => t.email === email);
            if (byEmail) return byEmail.id;
        }
        // Try name match
        return teachers.find(t => normalize(t.name) === norm)?.id;
    };

    const dayMap: Record<string, number> = {
        'SENIN': 1, 'SELASA': 2, 'RABU': 3, 'KAMIS': 4, 'JUMAT': 5, 'SABTU': 6, 'MINGGU': 7
    };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1-based, +header)

        try {
            // Flexible keys (User might change header case)
            const dayStr = normalize(row['HARI'] || row['Hari'] || row['day']);
            const start = row['JAM MULAI (HH:MM)'] || row['Start'] || row['Mulai'];
            const end = row['JAM SELESAI (HH:MM)'] || row['End'] || row['Selesai'];
            const className = normalize(row['KELAS'] || row['Kelas']);
            const subjectRaw = row['MAPEL'] || row['Mapel'] || row['Subject'];
            const teacherRaw = row['GURU'] || row['Guru'] || row['Teacher'];

            // Validation
            if (!dayStr || !start || !end || !className || !subjectRaw || !teacherRaw) {
                throw new Error('Data tidak lengkap (Wajib: Hari, Jam, Kelas, Mapel, Guru)');
            }

            const dayOfWeek = dayMap[dayStr];
            if (!dayOfWeek) throw new Error(`Hari '${dayStr}' tidak valid (Gunakan SENIN-MINGGU)`);

            const classId = classMap.get(className);
            if (!classId) throw new Error(`Kelas '${className}' tidak ditemukan di database`);

            const subjectId = findSubjectId(subjectRaw);
            if (!subjectId) throw new Error(`Mapel '${subjectRaw}' tidak ditemukan`);

            const teacherId = findTeacherId(teacherRaw);
            if (!teacherId) throw new Error(`Guru '${teacherRaw}' tidak ditemukan`);

            // Let's retrieve real Subject Name from DB found
            const realSubject = subjects.find(s => s.id === subjectId);

            // Correct update
            await prisma.schedule.create({
                data: {
                    tenantId,
                    classId,
                    subject: realSubject ? realSubject.name : String(subjectRaw),
                    teacherId,
                    dayOfWeek,
                    startTime: String(start).replace('.', ':'),
                    endTime: String(end).replace('.', ':')
                }
            });

            success++;
        } catch (err: any) {
            failed++;
            errors.push({ row: rowNum, error: err.message, data: row });
        }
    }

    res.json({
        success: true,
        summary: { total: rows.length, imported: success, failed },
        errors
    });
});
