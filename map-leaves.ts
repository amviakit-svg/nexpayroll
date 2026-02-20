import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Leaves per User ---');
    try {
        const leaves = await (prisma.leaveRequest as any).findMany({
            include: { employee: true, leaveType: true }
        });

        leaves.forEach((l: any) => {
            console.log(`User: ${l.employee.name} (${l.employee.email}), Type: ${l.leaveType.name}, Status: ${l.status}, Date: ${l.startDate}`);
        });
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
