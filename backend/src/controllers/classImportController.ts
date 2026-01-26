import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as XLSX from 'xlsx';
import prisma from '../config/db';
import { getTenantId } from './userController';

export const importClasses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = getTenantId(req);

    if (!tenantId) return next(new AppError('Tenant context missing', 400));

    if (!req.file) {
        return next(new AppError('Please upload an excel/csv file', 400));
    }

    console.log('--- Import Classes Request Received ---');
    console.log(`File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Successfully parsed ${rawData.length} rows from file`);

    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const row of rawData as any[]) {
        try {
            // Handle CSV format where all data might be in one column
            const keys = Object.keys(row);
            if (keys.length === 1 && (keys[0].includes(',') || keys[0].includes(';'))) {
                const delimiter = keys[0].includes(',') ? ',' : ';';
                const headerParts = keys[0].split(delimiter);
                const valueParts = String(row[keys[0]]).split(delimiter);
                const newRow: any = {};
                headerParts.forEach((h, i) => {
                    newRow[h.trim()] = valueParts[i]?.trim();
                });
                Object.assign(row, newRow);
            }

            const className = row.ClassName || row.NamaKelas || row.Kelas;

            if (!className) {
                throw new Error('Nama kelas wajib diisi (ClassName/NamaKelas)');
            }

            // Check if class already exists
            const existingClass = await prisma.class.findFirst({
                where: {
                    tenantId,
                    name: String(className).trim()
                }
            });

            if (!existingClass) {
                // Create new class
                await prisma.class.create({
                    data: {
                        tenantId,
                        name: String(className).trim()
                    }
                });
                imported++;
            } else {
                // Class already exists, skip
                console.log(`Class "${className}" already exists, skipping...`);
            }
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
