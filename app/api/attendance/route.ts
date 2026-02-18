import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || '');
        const month = parseInt(searchParams.get('month') || '');
        let employeeId = searchParams.get('employeeId');

        if (!year || !month) {
            return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
        }

        // Authorization Logic:
        // 1. Admins can view anyone's attendance.
        // 2. Employees can ONLY view their own.
        // Note: getServerSession typically puts the user id in session.user.id if configured in callbacks
        if (session.user.role !== 'ADMIN') {
            // @ts-ignore
            employeeId = session.user.id || session.user.sub;
        } else if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID is required for admins' }, { status: 400 });
        }

        if (!employeeId) {
            return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
        }

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        const records = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });

        return NextResponse.json(records);

    } catch (error: any) {
        console.error('Attendance Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
