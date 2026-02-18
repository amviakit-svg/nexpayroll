import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { reopenPayroll } from '@/lib/payrollService';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { year, month } = await req.json();

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
    }

    await reopenPayroll(year, month);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reopen payroll error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
