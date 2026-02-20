import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Diagnostics ---');
    try {
        const userCount = await (prisma as any).user.count();
        const leafCount = await (prisma as any).leaveRequest.count();
        const attendanceCount = await (prisma as any).attendance.count();
        const payrollCount = await (prisma as any).payrollEntry.count();

        console.log('User Count:', userCount);
        console.log('Leave Request Count:', leafCount);
        console.log('Attendance Record Count:', attendanceCount);
        console.log('Payroll Entry Count:', payrollCount);

        if (userCount > 0) {
            const users = await (prisma as any).user.findMany({ take: 5, select: { id: true, email: true, name: true, role: true } });
            console.log('Sample Users:');
            users.forEach((u: any) => console.log(` - ${u.name} (${u.email}) [${u.role}]`));
        }

    } catch (err: any) {
        console.error('Diagnostic error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
