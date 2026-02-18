import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePayslipForEntry } from '@/lib/payrollService';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const entry = await generatePayslipForEntry(params.id);
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    if (session.user.role !== 'ADMIN' && session.user.id !== entry.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentEntry = entry;

    if (!currentEntry.payslipPath) {
      return NextResponse.json({ error: 'Payslip not yet generated' }, { status: 404 });
    }

    // Ensure we have an absolute path for reading
    const absolutePath = path.isAbsolute(currentEntry.payslipPath)
      ? currentEntry.payslipPath
      : path.join(process.cwd(), currentEntry.payslipPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const buf = await fs.promises.readFile(absolutePath);
    const filename = `payslip-${entry.employee?.name || 'employee'}.pdf`;

    const { searchParams } = new URL(_.url);
    const isPreview = searchParams.get('preview') === 'true';

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview ? 'inline' : `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (e: any) {
    console.error('[PAYSIP_GET_ERROR]', e);
    return NextResponse.json({ error: e?.message || 'Failed to generate or read payslip' }, { status: 500 });
  }
}
