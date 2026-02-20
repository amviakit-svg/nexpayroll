import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    if (!employeeId) {
        return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
    }

    // Check permissions (Admin can see all, Manager can see their team)
    if (session.user.role !== 'ADMIN') {
        const isManagerRes = await prisma.user.findFirst({
            where: { id: employeeId, managerId: session.user.id }
        });
        if (!isManagerRes && employeeId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    try {
        let startDate, endDate;
        if (month) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59);
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59);
        }

        // 1. Fetch Attendance
        const attendance = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' }
        });

        // 2. Fetch Leaves
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId,
                startDate: { lte: endDate },
                endDate: { gte: startDate },
                status: { in: ['APPROVED', 'APPROVED_BY_MANAGER' as any] }
            },
            include: { leaveType: true },
            orderBy: { startDate: 'asc' }
        });

        const source = searchParams.get('source');
        const isManagerRequest = source === 'manager' || (session.user.role === 'MANAGER' as any);

        // 3. Fetch Payroll (Only for Admin or Self, NOT for Manager viewing team)
        let payroll = [];
        if (!isManagerRequest || employeeId === session.user.id) {
            payroll = await prisma.payrollEntry.findMany({
                where: {
                    employeeId,
                    payrollCycle: {
                        year: year
                    }
                },
                include: {
                    payrollCycle: true
                },
                orderBy: {
                    payrollCycle: {
                        month: 'asc'
                    }
                }
            });
        }

        return NextResponse.json({
            attendance,
            leaves,
            payroll: isManagerRequest && employeeId !== session.user.id ? [] : payroll
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
