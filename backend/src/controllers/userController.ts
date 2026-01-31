import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import * as XLSX from 'xlsx';

const createUserSchema = z.object({
    email: z.string({ required_error: "Email wajib diisi" }).email("Format email tidak valid"),
    password: z.string({ required_error: "Password wajib diisi" }).min(6, "Password minimal 6 karakter"),
    name: z.string({ required_error: "Nama wajib diisi" }).min(1, "Nama tidak boleh kosong"),
    role: z.enum([Role.TEACHER, Role.STUDENT, Role.SCHOOL_ADMIN, Role.OWNER], { required_error: "Role wajib dipilih" }),
    classId: z.preprocess(
        (val) => (val === '' || val === 'null' || val === null) ? undefined : val,
        z.string().optional()
    ),
    subjectIds: z.array(z.string()).optional()
});

// ... (in createUser function later if I can find it)

// Helper to get tenantId
export const getTenantId = (req: Request) => {
    if (req.user?.role === Role.OWNER && req.query.tenantId) {
        return req.query.tenantId as string;
    }
    if (req.user?.role === Role.OWNER && req.body.tenantId) {
        return req.body.tenantId as string;
    }
    return req.user?.tenantId;
};

export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user!.role !== Role.SCHOOL_ADMIN && req.user!.role !== Role.OWNER) {
        return next(new AppError('Not authorized to create users', 403));
    }

    const tenantId = getTenantId(req);
    const targetRole = req.body.role;

    if (!tenantId && req.user!.role !== Role.OWNER) {
        return next(new AppError('Tenant context missing', 400));
    }

    if (!tenantId && (targetRole === Role.SCHOOL_ADMIN || targetRole === Role.TEACHER || targetRole === Role.STUDENT)) {
        return next(new AppError(`Mohon pilih sekolah terlebih dahulu untuk menambahkan ${targetRole}`, 400));
    }

    const data = createUserSchema.parse(req.body);

    // Validate classId if provided
    if (data.classId) {
        if (!tenantId) {
            return next(new AppError('Kelas harus terikat dengan sekolah (Tenant ID missing)', 400));
        }
        const classExists = await prisma.class.findFirst({
            where: { id: data.classId, tenantId: tenantId }
        });
        if (!classExists) {
            return next(new AppError('Kelas tidak ditemukan', 400));
        }
    }

    const newUser = await userService.createUser(tenantId || undefined, data);

    res.status(201).json({
        status: 'success',
        data: { user: newUser }
    });
});

export const getTeachers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    // Include Admin and Owner as they might be teachers/homeroom teachers too
    const users = await userService.getUsersByRole(tenantId, [Role.TEACHER, Role.SCHOOL_ADMIN, Role.OWNER]);
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

export const getStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const users = await userService.getUsersByRole(tenantId, Role.STUDENT);
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

export const getAdmins = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const users = await userService.getUsersByRole(tenantId, Role.SCHOOL_ADMIN);
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

export const getStudentsByClass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const { classId } = req.params;

    const users = await userService.getStudentsByClass(tenantId, classId);
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

export const getSystemUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only OWNER can access this
    if (req.user!.role !== Role.OWNER) {
        return next(new AppError('Not authorized', 403));
    }

    const users = await userService.getGlobalUsersByRole([Role.OWNER, Role.SCHOOL_ADMIN]);

    // Map tenant name for better display
    const formattedUsers = users.map((u: any) => ({
        ...u,
        tenantName: u.tenant?.name || 'System (Global)'
    }));

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users: formattedUsers }
    });
});

const updateUserSchema = z.object({
    email: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : val,
        z.string().email("Format email tidak valid").optional()
    ),
    password: z.preprocess(
        (val) => (val === '' || val === null || val === undefined) ? undefined : val,
        z.string().min(6, "Password minimal 6 karakter").optional()
    ),
    name: z.string().min(1, "Nama tidak boleh kosong").optional(),
    classId: z.preprocess(
        (val) => (val === '' || val === 'null' || val === null) ? null : val,
        z.string().optional().nullable()
    ),
    subjectIds: z.array(z.string()).optional()
});

export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Allow user to update their own profile OR admin/owner to update others
    const isSelfUpdate = req.user!.id === id;

    if (!isSelfUpdate && req.user!.role !== Role.SCHOOL_ADMIN && req.user!.role !== Role.OWNER) {
        return next(new AppError('Not authorized to update users', 403));
    }

    const data = updateUserSchema.parse(req.body);

    // Determine tenantId for the update
    let tenantId: string | undefined;

    if (req.user!.role === Role.OWNER) {
        // Owner can update any user
        // If updating someone else, get the target user's tenantId
        if (!isSelfUpdate) {
            const targetUser = await userService.getUserById(id);
            if (!targetUser) {
                return next(new AppError('User not found', 404));
            }
            tenantId = targetUser.tenantId ? targetUser.tenantId : undefined;
        } else {
            // Owner updating themselves - no tenantId needed
            tenantId = undefined;
        }
    } else {
        // School Admin or self-update by other roles
        const tid = getTenantId(req);
        tenantId = tid ? tid : undefined;
        if (!tenantId) {
            return next(new AppError('Tenant context missing', 400));
        }
    }

    const updatedUser = await userService.updateUser(tenantId, id, data);

    res.status(200).json({
        status: 'success',
        data: { user: updatedUser }
    });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user!.role !== Role.SCHOOL_ADMIN && req.user!.role !== Role.OWNER) {
        return next(new AppError('Not authorized to delete users', 403));
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
        return next(new AppError('Tenant context missing', 400));
    }

    const { id } = req.params;

    const result = await userService.deleteUser(tenantId, id);
    res.status(200).json({
        status: 'success',
        data: null
    });
});

export const importUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    console.log('--- Import Request Received ---');
    if (req.file) console.log(`File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Allow tenantId from body (for Owner) or from token context
    const tenantId = req.body.tenantId || getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));
    console.log(`Target Tenant ID: ${tenantId}`);

    if (!req.file) {
        return next(new AppError('Please upload an excel file', 400));
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    // Assuming columns: Name, Email, Password, Role (TEACHER/STUDENT), ClassID (optional)
    // Map to user creation
    const results: any[] = [];
    const errors: any[] = [];

    for (const rowObj of rawData) {
        const row = rowObj as any;
        try {
            // Basic mapping
            let role = (row['Role'] || row['role'] || 'STUDENT').toUpperCase();
            // Validate Role
            if (role !== 'TEACHER' && role !== 'STUDENT') {
                role = 'STUDENT'; // Default fallback or error? Let's fallback for now or error. 
                // Using fallback to STUDENT if invalid.
            }

            let classId = row['ClassID'] || row['classId'] || row['class_id'];
            const className = row['ClassName'] || row['className'] || row['Kelas'];

            if (!classId && className && role === 'STUDENT') {
                // Try to find class by name within tenant
                const foundClass = await prisma.class.findFirst({
                    where: {
                        tenantId,
                        name: {
                            equals: className,
                        }
                    }
                });
                if (foundClass) {
                    classId = foundClass.id;
                }
            }

            const userPayload = {
                name: row['Name'] || row['name'] || row['Nama'],
                email: row['Email'] || row['email'],
                password: String(row['Password'] || row['password'] || '123456'),
                role: role,
                classId: classId
            };

            // Validate minimal requirements
            if (!userPayload.name || !userPayload.email) {
                throw new Error('Nama dan Email wajib diisi');
            }

            // Create user
            const newUser = await userService.createUser(tenantId, userPayload as any);
            results.push(newUser);

        } catch (e: any) {
            console.error('Row import error:', e);
            errors.push({ row: rowObj, error: e.message });
        }
    }

    res.status(200).json({
        status: 'success',
        imported: results.length,
        failed: errors.length,
        errors
    });
});
export const exportStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    const { classId } = req.query;
    let users;

    if (classId) {
        users = await userService.getStudentsByClass(tenantId, classId as string);
    } else {
        users = await userService.getUsersByRole(tenantId, Role.STUDENT);
    }

    // Format data for Excel
    const data = users.map(u => ({
        Nama: u.name,
        Email: u.email,
        Kelas: (u as any).class?.name || 'N/A'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=daftar_siswa.xlsx');
    res.send(buffer);
});

export const exportTeachers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);
    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    // Fetch tenant name
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true }
    });
    const schoolName = tenant?.name || 'Unknown School';

    const users = await userService.getUsersByRole(tenantId, Role.TEACHER);

    // Format data for Excel
    const data = users.map(u => ({
        "Nama Sekolah": schoolName,
        Nama: u.name,
        Username_Email: u.email,
        Password: '(Terenkripsi/Hidden)',
        MataPelajaran: u.subjects && u.subjects.length > 0 ? u.subjects.map(s => s.name).join(', ') : '-'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Adjust column widths
    const wscols = [
        { wch: 25 }, // Sekolah
        { wch: 30 }, // Nama
        { wch: 30 }, // Email
        { wch: 20 }, // Password
        { wch: 20 }  // Mapel
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guru');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=daftar_guru.xlsx');
    res.send(buffer);
});
