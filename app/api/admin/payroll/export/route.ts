export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import Papa from 'papaparse';

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
                        employee: true,
                        lineItems: true
                    }
                }
            }
        });

        if (!cycle) {
            return NextResponse.json({ error: 'Payroll cycle not found' }, { status: 404 });
        }

        // Prepare data for CSV
        const csvData = cycle.entries.map(entry => {
            const data: any = {
                'Employee ID': entry.employee.employeeCode || entry.employee.id,
                'Employee Name': entry.employee.name,
                'PAN': entry.employee.pan || '',
                'Designation': entry.employee.designation || '',
                'Department': entry.employee.department || '',
                'Leaves': entry.leaves,
                'Working Days': entry.workingDays,
            };

            // Add earnings and deductions from line items
            entry.lineItems.forEach(item => {
                data[item.componentNameSnapshot] = Number(item.amount);
            });

            data['Gross Earnings'] = Number(entry.grossEarnings);
            data['Total Deductions'] = Number(entry.totalDeductions);
            data['Net Salary'] = Number(entry.netMonthlySalary);
            data['Final Payable'] = Number(entry.finalPayable);

            return data;
        });

        const csv = Papa.unparse(csvData);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="payroll-${year}-${month}.csv"`
            }
        });
    } catch (error: any) {
        console.error('Export payroll error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
