import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Get all leave types
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(leaveTypes);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch leave types' }, { status: 400 });
  }
}

// POST - Create new leave type
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, color, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        color: color || '#3B82F6',
        description,
        isActive: true
      }
    });

    return NextResponse.json(leaveType);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Leave type with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to create leave type' }, { status: 400 });
  }
}

// PUT - Update leave type
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, color, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Leave type ID is required' }, { status: 400 });
    }

    const updateData: Prisma.LeaveTypeUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(leaveType);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Leave type with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to update leave type' }, { status: 400 });
  }
}

// DELETE - Delete leave type
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Leave type ID is required' }, { status: 400 });
    }

    // Check if there are any leave requests using this type
    const requestCount = await prisma.leaveRequest.count({
      where: { leaveTypeId: id }
    });

    if (requestCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete leave type with existing leave requests' },
        { status: 400 }
      );
    }

    await prisma.leaveType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete leave type' }, { status: 400 });
  }
}
