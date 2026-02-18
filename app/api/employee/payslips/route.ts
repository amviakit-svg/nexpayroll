import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!year || !month) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const slips = await prisma.payrollEntry.findMany({
        where: {
            employeeId: session.user.id,
            payrollCycle: {
                year,
                month,
                status: 'SUBMITTED'
            }
        },
        include: { payrollCycle: true }
    });

    return NextResponse.json(slips);
}
