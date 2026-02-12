import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateLeaveRequest, cancelLeaveRequest } from '@/lib/leaveService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { leaveTypeId, startDate, endDate, reason } = body;

    const request = await updateLeaveRequest(
      params.id,
      session.user.id,
      {
        leaveTypeId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        reason
      }
    );

    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const request = await cancelLeaveRequest(params.id, session.user.id);
    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
