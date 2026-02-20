import { NextRequest, NextResponse } from 'next/server';
import { suggestLeaveType } from '@/lib/leaveService';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reason = searchParams.get('reason');

        if (!reason) {
            return NextResponse.json({ suggestion: null });
        }

        const suggestion = await suggestLeaveType(reason);
        return NextResponse.json({ suggestion });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
