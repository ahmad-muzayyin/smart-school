import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.grade.deleteMany();
    await prisma.teachingMaterial.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
    await prisma.tenant.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create 2 Schools (Tenants)
    console.log('🏫 Creating schools...');

    const school1 = await prisma.tenant.create({
        data: {
            name: 'SMA Negeri 1 Jakarta'
        }
    });

    const school2 = await prisma.tenant.create({
        data: {
            name: 'SMA Global Madani'
        }
    });

    console.log(`✅ Created: ${school1.name}`);
    console.log(`✅ Created: ${school2.name}`);

    // Create OWNER (Super Admin) - Can manage all tenants
    console.log('\n👑 Creating OWNER account...');
    const owner = await prisma.user.create({
        data: {
            email: 'owner@attendance.com',
            password: hashedPassword,
            name: 'Super Admin Owner',
            role: 'OWNER',
            tenantId: null // Owner tidak terikat ke tenant tertentu
        }
    });
    console.log(`✅ Created OWNER: ${owner.email}`);

    // Helper function to create school data
    async function createSchoolData(tenant: any, schoolNumber: number) {
        console.log(`\n📚 Setting up ${tenant.name}...`);

        // Create Admin
        const admin = await prisma.user.create({
            data: {
                email: `admin${schoolNumber}@school.com`,
                password: hashedPassword,
                name: `Admin Sekolah ${schoolNumber}`,
                role: 'SCHOOL_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log(`✅ Created admin: ${admin.email}`);

        // Create 3 Classes
        const classes = [];
        for (let i = 1; i <= 3; i++) {
            const className = `Kelas ${10 + i}`;
            const classData = await prisma.class.create({
                data: {
                    name: className,
                    tenantId: tenant.id
                }
            });
            classes.push(classData);
            console.log(`✅ Created class: ${className}`);
        }

        // Create Subjects
        const subjects = [
            { name: 'Matematika', code: 'MTK' },
            { name: 'Bahasa Indonesia', code: 'BIND' },
            { name: 'Bahasa Inggris', code: 'BING' },
            { name: 'Fisika', code: 'FIS' },
            { name: 'Kimia', code: 'KIM' }
        ];

        const createdSubjects = [];
        for (const subject of subjects) {
            const subjectData = await prisma.subject.create({
                data: {
                    ...subject,
                    tenantId: tenant.id
                }
            });
            createdSubjects.push(subjectData);
        }
        console.log(`✅ Created ${createdSubjects.length} subjects`);

        // Create 3 Teachers (one for each main subject)
        const teachers = [];
        for (let i = 0; i < 3; i++) {
            const teacher = await prisma.user.create({
                data: {
                    email: `teacher${schoolNumber}.${i + 1}@school.com`,
                    password: hashedPassword,
                    name: `Guru ${subjects[i].name} ${schoolNumber}`,
                    role: 'TEACHER',
                    tenantId: tenant.id,
                    subjectId: createdSubjects[i].id
                }
            });
            teachers.push(teacher);
            console.log(`✅ Created teacher: ${teacher.name}`);
        }

        // Create 10 Students for each class (total 30 students)
        const studentNames = [
            'Ahmad', 'Budi', 'Citra', 'Dedi', 'Eka',
            'Fani', 'Gita', 'Hadi', 'Indah', 'Joko'
        ];

        let totalStudents = 0;
        for (const classData of classes) {
            for (let i = 0; i < 10; i++) {
                const student = await prisma.user.create({
                    data: {
                        email: `student${schoolNumber}.${classData.name.replace(' ', '')}.${i + 1}@school.com`,
                        password: hashedPassword,
                        name: `${studentNames[i]} ${classData.name}`,
                        role: 'STUDENT',
                        tenantId: tenant.id,
                        classId: classData.id
                    }
                });
                totalStudents++;
            }
            console.log(`✅ Created 10 students for ${classData.name}`);
        }
        console.log(`✅ Total students created: ${totalStudents}`);

        // Create Schedules (3 schedules per class, one for each teacher)
        let totalSchedules = 0;
        for (const classData of classes) {
            for (let i = 0; i < 3; i++) {
                const schedule = await prisma.schedule.create({
                    data: {
                        tenantId: tenant.id,
                        classId: classData.id,
                        subject: subjects[i].name,
                        teacherId: teachers[i].id,
                        dayOfWeek: (i + 1) % 5 + 1, // Monday to Friday
                        startTime: `${8 + i * 2}:00`,
                        endTime: `${9 + i * 2}:30`
                    }
                });
                totalSchedules++;
            }
        }
        console.log(`✅ Created ${totalSchedules} schedules`);

        // Create sample attendance records
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules = await prisma.schedule.findMany({
            where: { tenantId: tenant.id },
            include: { class: { include: { students: true } } }
        });

        let totalAttendance = 0;
        for (const schedule of schedules) {
            const students = schedule.class.students;
            for (const student of students) {
                await prisma.attendance.create({
                    data: {
                        tenantId: tenant.id,
                        scheduleId: schedule.id,
                        studentId: student.id,
                        classId: schedule.classId,
                        date: today,
                        status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT' // 80% present
                    }
                });
                totalAttendance++;
            }
        }
        console.log(`✅ Created ${totalAttendance} attendance records`);

        // Create sample grades
        let totalGrades = 0;
        for (const schedule of schedules) {
            const students = schedule.class.students;
            const categories = ['UTS', 'UAS', 'Tugas', 'Quiz'];

            for (const student of students) {
                for (const category of categories) {
                    const score = Math.floor(Math.random() * 30) + 70; // 70-100
                    await prisma.grade.create({
                        data: {
                            tenantId: tenant.id,
                            studentId: student.id,
                            scheduleId: schedule.id,
                            classId: schedule.classId,
                            subject: schedule.subject,
                            semester: 1,
                            category,
                            score,
                            maxScore: 100
                        }
                    });
                    totalGrades++;
                }
            }
        }
        console.log(`✅ Created ${totalGrades} grade records`);

        // Create sample teaching materials
        let totalMaterials = 0;
        for (let i = 0; i < teachers.length; i++) {
            const teacher = teachers[i];
            const subjectName = createdSubjects[i].name;

            const materialTypes = [
                { title: 'Materi Pengenalan', category: 'Materi', fileType: 'PDF' },
                { title: 'Tugas Minggu 1', category: 'Tugas', fileType: 'DOC' },
                { title: 'Video Pembelajaran', category: 'Video', fileType: 'VIDEO' },
                { title: 'Latihan Soal', category: 'Latihan', fileType: 'PDF' }
            ];

            for (const material of materialTypes) {
                await prisma.teachingMaterial.create({
                    data: {
                        tenantId: tenant.id,
                        teacherId: teacher.id,
                        subject: subjectName,
                        title: material.title,
                        description: `${material.title} untuk pembelajaran`,
                        fileUrl: `https://example.com/files/${material.title.toLowerCase().replace(/ /g, '-')}.pdf`,
                        fileName: `${material.title}.${material.fileType.toLowerCase()}`,
                        fileSize: Math.floor(Math.random() * 5000000) + 100000,
                        fileType: material.fileType,
                        category: material.category,
                        isPublic: true
                    }
                });
                totalMaterials++;
            }
        }
        console.log(`✅ Created ${totalMaterials} teaching materials`);

        console.log(`\n✅ ${tenant.name} setup complete!`);
    }

    // Create data for both schools
    await createSchoolData(school1, 1);
    await createSchoolData(school2, 2);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 1 OWNER (Super Admin)');
    console.log('- 2 Schools (Tenants)');
    console.log('- 3 Classes per school (6 total)');
    console.log('- 10 Students per class (30 per school, 60 total)');
    console.log('- 3 Teachers per school (6 total)');
    console.log('- 5 Subjects per school');
    console.log('- Schedules, Attendance, Grades, and Materials created');
    console.log('\n🔐 Login Credentials:');
    console.log('Password for all users: password123');
    console.log('\n👑 OWNER (Super Admin):');
    console.log('  Email: owner@attendance.com');
    console.log('  Role: Can manage all schools');
    console.log('\nSchool 1 (SMA Negeri 1 Jakarta):');
    console.log('  Admin: admin1@school.com');
    console.log('  Teacher: teacher1.1@school.com, teacher1.2@school.com, teacher1.3@school.com');
    console.log('  Student: student1.Kelas11.1@school.com (and more...)');
    console.log('\nSchool 2 (SMA Global Madani):');
    console.log('  Admin: admin2@school.com');
    console.log('  Teacher: teacher2.1@school.com, teacher2.2@school.com, teacher2.3@school.com');
    console.log('  Student: student2.Kelas11.1@school.com (and more...)');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
