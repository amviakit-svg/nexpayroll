import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Leave Application ---');
    try {
        const user = await prisma.user.findFirst();
        const leafType = await prisma.leaveType.findFirst();

        if (!user || !leafType) {
            console.error('Missing user or leaf type');
            return;
        }

        console.log(`Applying for user: ${user.name}, Type: ${leafType.name}`);

        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 1);

        const res = await (prisma.leaveRequest as any).create({
            data: {
                employeeId: user.id,
                leaveTypeId: leafType.id,
                startDate: start,
                endDate: end,
                daysRequested: 1,
                status: 'PENDING',
                stage: 1
            }
        });
        console.log('Successfully created:', res.id);
    } catch (err: any) {
        console.error('Application error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
