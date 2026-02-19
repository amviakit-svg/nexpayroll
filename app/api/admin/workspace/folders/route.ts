import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get('parentId');

        const folders = await prisma.folder.findMany({
            where: {
                parentId: parentId || null
            },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { documents: true, children: true }
                }
            }
        });
        return NextResponse.json(folders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await requireAdmin();
        const { name, parentId } = await req.json();

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const folder = await prisma.folder.create({
            data: {
                name,
                parentId: parentId || null
            }
        });

        return NextResponse.json(folder);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A folder with this name already exists here' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
