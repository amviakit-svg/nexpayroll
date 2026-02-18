import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { generateICardPdf } from '@/lib/icard-pdf';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await requireAuth();
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const company = await prisma.tenantConfig.findFirst() || {
            companyName: 'NexPayroll',
            companyAddress: null,
            companyLogoUrl: null
        };

        const pdfBuffer = await generateICardPdf({
            user: {
                name: user.name,
                employeeCode: user.employeeCode,
                designation: user.designation,
                department: user.department,
                dateOfJoining: user.dateOfJoining as any,
                photoUrl: user.photoUrl,
                pfNumber: user.pfNumber,
                pan: user.pan
            },
            company: {
                companyName: company.companyName,
                companyAddress: company.companyAddress,
                companyLogoUrl: company.companyLogoUrl
            }
        });

        const safeName = user.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="icard_${safeName}.pdf"`
            }
        });
    } catch (error) {
        console.error('I-Card Download Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
