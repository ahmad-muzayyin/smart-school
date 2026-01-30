import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Starting SAFE access repair...');
    console.log('⚠️  This script will NOT delete any data.');
    console.log('🔑 It will only ensure accounts exist and reset passwords to "password123"');

    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Ensure OWNER exists or reset password
    const ownerEmail = 'owner@attendance.com';
    const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });

    if (owner) {
        console.log(`\n👤 Found OWNER (${ownerEmail}). Resetting password...`);
        await prisma.user.update({
            where: { email: ownerEmail },
            data: { password: hashedPassword }
        });
        console.log('✅ OWNER password reset to: password123');
    } else {
        console.log(`\n👤 OWNER (${ownerEmail}) not found. Creating...`);
        await prisma.user.create({
            data: {
                email: ownerEmail,
                password: hashedPassword,
                name: 'Super Admin Owner',
                role: 'OWNER',
                tenantId: null
            }
        });
        console.log('✅ OWNER account created. Login: owner@attendance.com / password123');
    }

    // 2. Ensure at least one TENANT exists
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('\n🏫 No Tenant found. Creating "SMA Negeri 1 Jakarta"...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'SMA Negeri 1 Jakarta',
                address: 'Jl. Pendidikan No. 1',
                latitude: -6.2088,
                longitude: 106.8456
            }
        });
        console.log('✅ Created Tenant: SMA Negeri 1 Jakarta');
    } else {
        console.log(`\n🏫 Found existing Tenant: ${tenant.name}`);
    }

    // 3. Ensure TEACHER exists (teacher1.1@school.com)
    const teacherEmail = 'teacher1.1@school.com';
    const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    if (teacher) {
        console.log(`\n👩‍🏫 Found TEACHER (${teacherEmail}). Resetting password...`);
        await prisma.user.update({
            where: { email: teacherEmail },
            data: { password: hashedPassword }
        });
        console.log('✅ TEACHER password reset to: password123');
    } else {
        console.log(`\n👩‍🏫 Creating TEACHER (${teacherEmail})...`);
        const subject = await prisma.subject.findFirst({ where: { tenantId: tenant.id } });
        // Create subject if needed, but for now just null is okay or create simple

        await prisma.user.create({
            data: {
                email: teacherEmail,
                password: hashedPassword,
                name: 'Guru Fisika',
                role: 'TEACHER',
                tenantId: tenant.id
            }
        });
        console.log('✅ TEACHER account created. Login: teacher1.1@school.com / password123');
    }

    // 4. Reset ALL users password to 'password123' (Optional, safer to just log found users)
    // Uncomment the below block if you really want to reset EVERYONE.
    /*
    console.log('\n🔄 Resetting ALL users passwords to "password123"...');
    const updateResult = await prisma.user.updateMany({
        data: { password: hashedPassword }
    });
    console.log(`✅ Updated ${updateResult.count} users.`);
    */

    // 5. List ALL users to help debug
    console.log('\n📋 Listing users in database (Email | Role | Name):');
    const users = await prisma.user.findMany({
        take: 100,
        orderBy: { role: 'asc' },
        select: { email: true, role: true, name: true }
    });

    if (users.length === 0) {
        console.log('⚠️  No users found in database! You might need to seed initial data if this is a fresh install.');
        // Note: We are respecting "Do not delete data", so we won't auto-seed here.
    } else {
        users.forEach(u => console.log(`   - [${u.role}] ${u.email} (${u.name})`));
    }
}

main()
    .catch(e => {
        console.error('❌ Error during fix:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
