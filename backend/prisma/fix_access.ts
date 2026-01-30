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

    // 2. Reset ALL users password to 'password123' (Optional, safer to just log found users)
    // Uncomment the below block if you really want to reset EVERYONE.
    /*
    console.log('\n🔄 Resetting ALL users passwords to "password123"...');
    const updateResult = await prisma.user.updateMany({
        data: { password: hashedPassword }
    });
    console.log(`✅ Updated ${updateResult.count} users.`);
    */

    // 3. List some users to help debug
    console.log('\n📋 Listing first 5 users in database for verification:');
    const users = await prisma.user.findMany({
        take: 5,
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
