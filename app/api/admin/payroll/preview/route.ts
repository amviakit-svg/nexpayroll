import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildPayrollPreview } from '@/lib/payrollService';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    const leavesByEmployee = body.leavesByEmployee ?? {};
    const variableByEmployee = body.variableByEmployee ?? {};

    const cycle = await buildPayrollPreview(year, month, leavesByEmployee, variableByEmployee);

    return NextResponse.json(cycle);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Preview failed' }, { status: 400 });
  }
}
