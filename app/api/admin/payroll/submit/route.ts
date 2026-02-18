import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitPayroll } from '@/lib/payrollService';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    const leavesByEmployee = body.leavesByEmployee ?? {};
    const variableByEmployee = body.variableByEmployee ?? {};

    await submitPayroll(year, month, leavesByEmployee, variableByEmployee, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[PAYROLL_SUBMIT_ERROR]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 400 });
  }
}
