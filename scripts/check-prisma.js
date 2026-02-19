const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Checking Folder model...');
        const folderCount = await prisma.folder.count();
        console.log('Folder count:', folderCount);

        console.log('Checking Document model...');
        const docCount = await prisma.document.count();
        console.log('Document count:', docCount);

        console.log('Prisma Client is healthy.');
    } catch (err) {
        console.error('Prisma Client Error:', err.message);
        if (err.message.includes('is not defined on model')) {
            console.log('\nDIAGNOSIS: Prisma Client needs regeneration.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

check();
