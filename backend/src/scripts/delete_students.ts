import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting deletion of all STUDENT users...');

    try {
        // 1. Find all students
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
            },
            select: {
                id: true,
            },
        });

        if (students.length === 0) {
            console.log('No students found to delete.');
            return;
        }

        const studentIds = students.map((s) => s.id);
        console.log(`Found ${studentIds.length} students.`);

        // 2. Delete related Attendance records
        const deletedAttendance = await prisma.attendance.deleteMany({
            where: {
                studentId: {
                    in: studentIds,
                },
            },
        });
        console.log(`Deleted ${deletedAttendance.count} attendance records.`);

        // 3. Delete related Grade records
        const deletedGrades = await prisma.grade.deleteMany({
            where: {
                studentId: {
                    in: studentIds,
                },
            },
        });
        console.log(`Deleted ${deletedGrades.count} grade records.`);

        // 4. Delete the students
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: 'STUDENT',
            },
        });
        console.log(`Deleted ${deletedUsers.count} student users.`);

        console.log('Successfully deleted all student data.');
    } catch (error) {
        console.error('Error deleting students:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
