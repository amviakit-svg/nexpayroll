export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET(req: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || '');
        const month = parseInt(searchParams.get('month') || '');

        if (isNaN(year) || isNaN(month)) {
            return NextResponse.json({ error: 'Valid year and month are required' }, { status: 400 });
        }

        const cycle = await prisma.payrollCycle.findUnique({
            where: { year_month: { year, month } },
            include: {
                entries: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true,
                                employeeCode: true,
                                pan: true,
                                designation: true,
                                department: true,
                            }
                        },
                        lineItems: true
                    }
                }
            }
        });

        if (!cycle) {
            return NextResponse.json({ error: 'Payroll cycle not found' }, { status: 404 });
        }

        return NextResponse.json(cycle);
    } catch (error: any) {
        console.error('Fetch payroll data error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
