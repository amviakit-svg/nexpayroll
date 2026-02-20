import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Leave Requests ---');
    try {
        const counts = await (prisma.leaveRequest as any).count();
        console.log('Total Leave Requests:', counts);

        const samples = await (prisma.leaveRequest as any).findMany({
            take: 10,
            orderBy: { requestedAt: 'desc' }
        });

        console.log('Last 10 records:');
        samples.forEach((s: any) => {
            console.log(`ID: ${s.id}, Status: ${s.status}, Stage: ${s.stage}, Requested: ${s.requestedAt}`);
        });
    } catch (err: any) {
        console.error('Error fetching leave requests:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
