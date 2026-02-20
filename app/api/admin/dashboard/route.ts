import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Stats
        const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } });

        const attendanceToday = await prisma.attendance.count({
            where: {
                date: today,
                status: 'P' // Assuming 'P' for Present
            }
        });

        const pendingLeaves = await (prisma.leaveRequest as any).count({
            where: {
                status: { in: ['PENDING', 'APPROVED_BY_MANAGER'] }
            }
        });

        const onLeaveToday = await (prisma.leaveRequest as any).count({
            where: {
                status: 'APPROVED',
                startDate: { lte: today },
                endDate: { gte: today }
            }
        });

        const stats = {
            totalEmployees,
            presentToday: attendanceToday,
            onLeaveToday,
            pendingLeaves
        };

        // 2. Hierarchy
        const allUsers = await prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                managerId: true,
                designation: true,
                photoUrl: true
            }
        });

        // Build tree
        const buildTree = (managerId: string | null): any[] => {
            return allUsers
                .filter(u => u.managerId === managerId)
                .map(u => ({
                    ...u,
                    children: buildTree(u.id)
                }));
        };

        const hierarchy = buildTree(null);

        return NextResponse.json({ stats, hierarchy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
