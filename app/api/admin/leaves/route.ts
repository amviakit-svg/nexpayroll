import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllLeaveRequests, processLeaveRequest } from '@/lib/leaveService';

// GET - Get all leave requests (admin view)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const employeeId = searchParams.get('employeeId') || undefined;

    const requests = await getAllLeaveRequests({
      status: status || undefined,
      employeeId
    });

    return NextResponse.json(requests);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch leave requests' }, { status: 400 });
  }
}

// POST - Approve or reject any leave request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId, action, comments } = body;

    if (!requestId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await processLeaveRequest(requestId, action, session.user.id, comments);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to process request' }, { status: 400 });
  }
}
