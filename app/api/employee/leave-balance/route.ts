import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmployeeBalances } from '@/lib/leaveService';

// GET - Get employee leave balances
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year')) || new Date().getFullYear();
    const month = Number(searchParams.get('month')) || (new Date().getMonth() + 1);

    const balances = await getEmployeeBalances(session.user.id, year, month);
    return NextResponse.json(balances);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch balances' }, { status: 400 });
  }
}
