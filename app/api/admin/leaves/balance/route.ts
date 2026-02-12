import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

  if (!employeeId) return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });

  const balances = await prisma.employeeBalance.findMany({
    where: { employeeId, year, month },
    include: { leaveType: true }
  });

  return NextResponse.json(balances);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { employeeId, leaveTypeId, year, month, amount, action } = await req.json();
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;

    const existing = await prisma.employeeBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year_month: {
          employeeId,
          leaveTypeId,
          year: yr,
          month: mth
        }
      }
    });

    let newBalance = existing ? existing.balanceDays : 0;

    if (action === 'SET') newBalance = Number(amount);
    else if (action === 'CREDIT') newBalance += Number(amount);
    else if (action === 'DEBIT') newBalance -= Number(amount);

    const result = await prisma.employeeBalance.upsert({
      where: {
        employeeId_leaveTypeId_year_month: {
          employeeId,
          leaveTypeId,
          year: yr,
          month: mth
        }
      },
      update: { balanceDays: newBalance },
      create: {
        employeeId,
        leaveTypeId,
        year: yr,
        month: mth,
        balanceDays: newBalance
      }
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
