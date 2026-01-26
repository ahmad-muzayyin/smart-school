import prisma from '../config/db';
import bcrypt from 'bcrypt';
import { Role, AttendanceStatus } from '@prisma/client';

const seed = async () => {
    console.log('🌱 Starting comprehensive seed...');

    // Clear existing data
    await prisma.attendance.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: Role.OWNER } } });
    await prisma.class.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 1. Create Platform Owner
    const ownerEmail = 'owner@platform.com';
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const owner = await prisma.user.upsert({
        where: { email: ownerEmail },
        update: {},
        create: {
            email: ownerEmail,
            password: hashedPassword,
            name: 'Platform Owner',
            role: Role.OWNER,
        }
    });
    console.log('✅ Owner ready');

    // 2. Create First Tenant (SMA Global Madani)
    const tenant1 = await prisma.tenant.create({
        data: {
            name: 'SMA Global Madani',
            address: 'Jl. Pendidikan No. 123, Jakarta',
            email: 'info@globalmadani.sch.id',
            phone: '021-12345678'
        }
    });
    console.log('✅ Tenant "SMA Global Madani" created');

    // 3. Create School Admin for Tenant 1
    await prisma.user.create({
        data: {
            email: 'admin@globalmadani.sch.id',
            password: hashedPassword,
            name: 'Dr. Ahmad Yani',
            role: Role.SCHOOL_ADMIN,
            tenantId: tenant1.id
        }
    });

    // 4. Create Teachers for Tenant 1
    const teacher1 = await prisma.user.create({
        data: {
            email: 'guru.matematika@globalmadani.sch.id',
            password: hashedPassword,
            name: 'Budi Santoso, S.Pd',
            role: Role.TEACHER,
            tenantId: tenant1.id
        }
    });

    const teacher2 = await prisma.user.create({
        data: {
            email: 'guru.fisika@globalmadani.sch.id',
            password: hashedPassword,
            name: 'Siti Nurhaliza, M.Pd',
            role: Role.TEACHER,
            tenantId: tenant1.id
        }
    });

    // 5. Create Classes for Tenant 1
    const class10A = await prisma.class.create({
        data: { name: 'X IPA 1', tenantId: tenant1.id }
    });
    const class10B = await prisma.class.create({
        data: { name: 'X IPA 2', tenantId: tenant1.id }
    });
    const class11A = await prisma.class.create({
        data: { name: 'XI IPA 1', tenantId: tenant1.id }
    });

    // 6. Create Students for Tenant 1
    const studentsData = [
        // Class 10A (X IPA 1)
        { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@student.com', classId: class10A.id },
        { name: 'Siti Aisyah', email: 'siti.aisyah@student.com', classId: class10A.id },
        { name: 'Muhammad Rizki', email: 'muhammad.rizki@student.com', classId: class10A.id },
        { name: 'Nur Azizah', email: 'nur.azizah@student.com', classId: class10A.id },
        { name: 'Dimas Prasetyo', email: 'dimas.prasetyo@student.com', classId: class10A.id },
        { name: 'Fitri Handayani', email: 'fitri.handayani@student.com', classId: class10A.id },
        { name: 'Reza Pahlevi', email: 'reza.pahlevi@student.com', classId: class10A.id },
        { name: 'Dewi Lestari', email: 'dewi.lestari@student.com', classId: class10A.id },

        // Class 10B (X IPA 2)
        { name: 'Andi Wijaya', email: 'andi.wijaya@student.com', classId: class10B.id },
        { name: 'Maya Sari', email: 'maya.sari@student.com', classId: class10B.id },
        { name: 'Budi Hartono', email: 'budi.hartono@student.com', classId: class10B.id },
        { name: 'Rina Susanti', email: 'rina.susanti@student.com', classId: class10B.id },
        { name: 'Agus Setiawan', email: 'agus.setiawan@student.com', classId: class10B.id },

        // Class 11A (XI IPA 1)
        { name: 'Hendra Gunawan', email: 'hendra.gunawan@student.com', classId: class11A.id },
        { name: 'Lina Marlina', email: 'lina.marlina@student.com', classId: class11A.id },
        { name: 'Fajar Ramadhan', email: 'fajar.ramadhan@student.com', classId: class11A.id },
        { name: 'Indah Permata', email: 'indah.permata@student.com', classId: class11A.id },
    ];

    const students = [];
    for (const s of studentsData) {
        const student = await prisma.user.create({
            data: {
                email: s.email,
                password: hashedPassword,
                name: s.name,
                role: Role.STUDENT,
                tenantId: tenant1.id,
                classId: s.classId
            }
        });
        students.push(student);
    }
    console.log(`✅ Created ${students.length} students`);

    // 7. Create Schedules for Tenant 1
    const schedules = [];
    for (let day = 0; day <= 6; day++) {
        // Mathematics for Class 10A
        const s1 = await prisma.schedule.create({
            data: {
                tenantId: tenant1.id,
                classId: class10A.id,
                teacherId: teacher1.id,
                subject: 'Matematika',
                dayOfWeek: day,
                startTime: '08:00',
                endTime: '09:30'
            }
        });
        schedules.push(s1);

        // Physics for Class 10A
        await prisma.schedule.create({
            data: {
                tenantId: tenant1.id,
                classId: class10A.id,
                teacherId: teacher2.id,
                subject: 'Fisika',
                dayOfWeek: day,
                startTime: '10:00',
                endTime: '11:30'
            }
        });

        // Mathematics for Class 10B
        await prisma.schedule.create({
            data: {
                tenantId: tenant1.id,
                classId: class10B.id,
                teacherId: teacher1.id,
                subject: 'Matematika',
                dayOfWeek: day,
                startTime: '13:00',
                endTime: '14:30'
            }
        });
    }
    console.log('✅ Schedules created');

    // 8. Create Second Tenant (SMK Teknologi Nusantara)
    const tenant2 = await prisma.tenant.create({
        data: {
            name: 'SMK Teknologi Nusantara',
            address: 'Jl. Industri No. 456, Bandung',
            email: 'info@smkteknologi.sch.id',
            phone: '022-87654321'
        }
    });
    console.log('✅ Tenant "SMK Teknologi Nusantara" created');

    // 9. Create School Admin for Tenant 2
    await prisma.user.create({
        data: {
            email: 'admin@smkteknologi.sch.id',
            password: hashedPassword,
            name: 'Ir. Bambang Suryanto',
            role: Role.SCHOOL_ADMIN,
            tenantId: tenant2.id
        }
    });

    // 10. Create Classes and Students for Tenant 2
    const classRPL = await prisma.class.create({
        data: { name: 'XII RPL 1', tenantId: tenant2.id }
    });

    const teacher3 = await prisma.user.create({
        data: {
            email: 'guru.pemrograman@smkteknologi.sch.id',
            password: hashedPassword,
            name: 'Eko Prasetyo, S.Kom',
            role: Role.TEACHER,
            tenantId: tenant2.id
        }
    });

    const smkStudents = [
        { name: 'Arif Rahman', email: 'arif.rahman@smk.com' },
        { name: 'Dina Amelia', email: 'dina.amelia@smk.com' },
        { name: 'Fikri Hakim', email: 'fikri.hakim@smk.com' },
        { name: 'Gita Savitri', email: 'gita.savitri@smk.com' },
    ];

    for (const s of smkStudents) {
        await prisma.user.create({
            data: {
                email: s.email,
                password: hashedPassword,
                name: s.name,
                role: Role.STUDENT,
                tenantId: tenant2.id,
                classId: classRPL.id
            }
        });
    }

    // Create schedule for SMK
    for (let day = 0; day <= 6; day++) {
        await prisma.schedule.create({
            data: {
                tenantId: tenant2.id,
                classId: classRPL.id,
                teacherId: teacher3.id,
                subject: 'Pemrograman Web',
                dayOfWeek: day,
                startTime: '08:00',
                endTime: '10:00'
            }
        });
    }

    // 11. Create Attendance History
    console.log('Creating attendance history...');
    const schedule = schedules[0];
    for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        for (const st of students.slice(0, 8)) { // Only for Class 10A students
            const status = Math.random() > 0.2 ? AttendanceStatus.PRESENT : (Math.random() > 0.5 ? AttendanceStatus.ABSENT : AttendanceStatus.LATE);

            await prisma.attendance.create({
                data: {
                    tenantId: tenant1.id,
                    scheduleId: schedule.id,
                    studentId: st.id,
                    classId: class10A.id,
                    date: d,
                    status: status
                }
            });
        }
    }

    console.log('✅ Seeding complete!');
    console.log('\n📚 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Owner: owner@platform.com / admin123');
    console.log('\n🏫 SMA Global Madani:');
    console.log('Admin: admin@globalmadani.sch.id / admin123');
    console.log('Teacher: guru.matematika@globalmadani.sch.id / admin123');
    console.log('Student: ahmad.fauzi@student.com / admin123');
    console.log('\n🏫 SMK Teknologi Nusantara:');
    console.log('Admin: admin@smkteknologi.sch.id / admin123');
    console.log('Teacher: guru.pemrograman@smkteknologi.sch.id / admin123');
    console.log('Student: arif.rahman@smk.com / admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
