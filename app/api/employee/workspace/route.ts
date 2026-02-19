import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await requireAuth();

        const sharedDocs = await prisma.documentShare.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                document: {
                    include: {
                        uploader: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { sharedAt: 'desc' }
        });

        const docs = sharedDocs.map(s => ({
            ...s.document,
            sharedAt: s.sharedAt
        }));

        return NextResponse.json(docs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
