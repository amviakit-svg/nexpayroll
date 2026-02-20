import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Users ---');
    try {
        const count = await prisma.user.count();
        console.log('Total Users:', count);

        const samples = await prisma.user.findMany({
            take: 5,
            select: { id: true, name: true, email: true, role: true }
        });

        console.log('Samples:');
        samples.forEach(u => console.log(u.id, u.name, u.email, u.role));
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
