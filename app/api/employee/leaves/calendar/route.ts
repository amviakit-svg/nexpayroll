import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmployeeLeaveCalendar } from '@/lib/leaveService';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    if (!year || !month) {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 });
    }

    const calendar = await getEmployeeLeaveCalendar(session.user.id, year, month);
    return NextResponse.json(calendar);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
