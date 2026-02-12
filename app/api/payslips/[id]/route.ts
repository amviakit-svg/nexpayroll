import fs from 'fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entry = await prisma.payrollEntry.findUnique({
    where: { id: params.id },
    include: { employee: true }
  });

  if (!entry?.payslipPath) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.user.role !== 'ADMIN' && session.user.id !== entry.employeeId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const buf = await fs.promises.readFile(entry.payslipPath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip-${entry.employee.name}.pdf"`
    }
  });
}
