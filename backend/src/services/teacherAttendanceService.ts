import { PrismaClient, TeacherAttendance, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckInDTO {
    checkInLat: number;
    checkInLong: number;
    checkInPhoto: string;
    checkInAddress?: string;
}

interface CheckOutDTO {
    checkOutLat: number;
    checkOutLong: number;
    checkOutPhoto: string;
    checkOutAddress?: string;
}

// Helper to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

const validateLocation = async (tenantId: string, lat: number, long: number) => {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (tenant && tenant.latitude && tenant.longitude) {
        const distance = getDistanceFromLatLonInM(tenant.latitude, tenant.longitude, lat, long);
        const limit = tenant.allowedRadius || 100;

        if (distance > limit) {
            throw new Error(`Location is too far from school. Distance: ${Math.round(distance)}m, Limit: ${limit}m`);
        }
    }
    // If tenant has no location set, we skip validation (or could enforce it if required)
};

export const checkIn = async (
    tenantId: string,
    teacherId: string,
    data: CheckInDTO
): Promise<TeacherAttendance> => {
    await validateLocation(tenantId, data.checkInLat, data.checkInLong);

    const today = new Date();
    // Normalize to date only (YYYY-MM-DD) or use Prisma's date matching
    // Prisma check:
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if already checked in
    const existing = await prisma.teacherAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId,
                date: startOfDay // Assuming date field is treated as midnight
            }
        }
    });

    if (existing) {
        throw new Error('Already checked in for today');
    }

    return await prisma.teacherAttendance.create({
        data: {
            tenantId,
            teacherId,
            date: startOfDay,
            status: 'PRESENT', // Default to present upon check-in
            checkInTime: new Date(),
            ...data
        }
    });
};

export const checkOut = async (
    tenantId: string,
    teacherId: string,
    data: CheckOutDTO
): Promise<TeacherAttendance> => {
    await validateLocation(tenantId, data.checkOutLat, data.checkOutLong);

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const existing = await prisma.teacherAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId,
                date: startOfDay
            }
        }
    });

    if (!existing) {
        throw new Error('You have not checked in yet today');
    }

    if (existing.checkOutTime) {
        throw new Error('Already checked out for today');
    }

    return await prisma.teacherAttendance.update({
        where: {
            id: existing.id
        },
        data: {
            checkOutTime: new Date(),
            ...data
        }
    });
};

export const getHistory = async (
    tenantId: string,
    teacherId: string,
    limit: number = 30
): Promise<TeacherAttendance[]> => {
    return await prisma.teacherAttendance.findMany({
        where: {
            tenantId,
            teacherId
        },
        orderBy: {
            date: 'desc'
        },
        take: limit
    });
};

export const getTodayStatus = async (
    tenantId: string,
    teacherId: string
): Promise<TeacherAttendance | null> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    return await prisma.teacherAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId,
                date: startOfDay
            }
        }
    });
};
