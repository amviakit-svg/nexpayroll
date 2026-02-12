import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamCalendar } from '@/lib/leaveService';

// GET - Get all employees leave calendar (admin view)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year')) || new Date().getFullYear();
    const month = Number(searchParams.get('month')) || (new Date().getMonth() + 1);

    // Pass null to get all employees (admin view)
    const calendar = await getTeamCalendar(null, year, month);
    return NextResponse.json(calendar);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch calendar' }, { status: 400 });
  }
}
