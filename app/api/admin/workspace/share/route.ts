import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        await requireAdmin();
        const { documentId, userId, action } = await req.json();

        if (!documentId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        if (action === 'share') {
            await prisma.documentShare.upsert({
                where: {
                    documentId_userId: { documentId, userId }
                },
                create: { documentId, userId },
                update: {}
            });
        } else {
            await prisma.documentShare.deleteMany({
                where: { documentId, userId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
