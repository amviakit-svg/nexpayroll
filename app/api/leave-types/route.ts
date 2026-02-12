import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all active leave types (for employees to apply leave)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(leaveTypes);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch leave types' }, { status: 400 });
  }
}
