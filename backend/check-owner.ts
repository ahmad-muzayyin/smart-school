import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOwner() {
    const owner = await prisma.user.findFirst({
        where: { role: 'OWNER' }
    });

    if (owner) {
        console.log('✅ OWNER FOUND:');
        console.log('   ID:', owner.id);
        console.log('   Email:', owner.email);
        console.log('   Name:', owner.name);
        console.log('   Role:', owner.role);
        console.log('   TenantId:', owner.tenantId);
    } else {
        console.log('❌ OWNER NOT FOUND');
    }

    const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
    });

    console.log('\n📋 All users in database:');
    allUsers.forEach(u => {
        console.log(`   ${u.role}: ${u.email} (${u.name})`);
    });

    await prisma.$disconnect();
}

checkOwner();
