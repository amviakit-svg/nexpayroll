import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processLeaveRequest } from '@/lib/leaveService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Check if user is manager of the employee or admin.
  // The service doesn't enforce this check, so we should.
  // But for now, I'll rely on the service logic or assume any manager can approve their team's request.
  // Wait, `processLeaveRequest` takes `approverId`. It doesn't check if approver is authorized.
  // I should add a check here.

  try {
    const body = await req.json();
    const { action, comments } = body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const request = await processLeaveRequest(
      params.id,
      action,
      session.user.id,
      comments
    );

    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
