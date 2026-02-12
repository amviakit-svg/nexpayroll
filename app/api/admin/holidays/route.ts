import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Get all holidays
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    let where: Prisma.HolidayWhereInput = {};
    if (year) {
      where.date = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(holidays);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch holidays' }, { status: 400 });
  }
}

// POST - Create new holiday
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, date } = body;

    if (!name || !date) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date)
      }
    });

    return NextResponse.json(holiday);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Holiday already exists for this date' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to create holiday' }, { status: 400 });
  }
}

// PUT - Update holiday
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    const updateData: Prisma.HolidayUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = new Date(date);

    const holiday = await prisma.holiday.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(holiday);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update holiday' }, { status: 400 });
  }
}

// DELETE - Delete holiday
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete holiday' }, { status: 400 });
  }
}
