import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
        const { name, folderId } = await req.json();

        const data: any = {};
        if (name) data.name = name;
        if (folderId !== undefined) data.folderId = folderId === 'root' ? null : folderId;

        const doc = await prisma.document.update({
            where: { id: params.id },
            data
        });

        return NextResponse.json(doc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();

        const doc = await prisma.document.findUnique({
            where: { id: params.id }
        });

        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

        // Delete file from disk
        const absolutePath = path.join(process.cwd(), doc.filePath);
        if (fs.existsSync(absolutePath)) {
            await fs.promises.unlink(absolutePath);
        }

        await prisma.document.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
