export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET() {
    try {
        await requireAdmin();

        const users = await prisma.user.findMany({
            include: {
                manager: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        const data = users.map(user => ({
            'Employee Code': user.employeeCode || '',
            'Full Name': user.name,
            'Email Address': user.email,
            'Role': user.role,
            'Status': user.isActive ? 'Active' : 'Inactive',
            'Designation': user.designation || '',
            'Department/Client': user.department || '',
            'Reporting Manager': user.manager?.name || '',
            'Date of Joining': user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-IN') : '',
            'PAN Card': user.pan || '',
            'PF Number': user.pfNumber || '',
            'Bank Name': user.bankName || '',
            'Account Number': user.accountNumber || '',
            'IFSC Code': user.ifscCode || '',
            'Created At': new Date(user.createdAt).toLocaleDateString('en-IN')
        }));

        const csv = Papa.unparse(data);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="personnel_directory_export.csv"'
            }
        });
    } catch (error) {
        console.error('Employee Export Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
