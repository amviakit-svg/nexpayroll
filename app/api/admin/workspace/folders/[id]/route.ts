import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
        const { name } = await req.json();

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const folder = await prisma.folder.update({
            where: { id: params.id },
            data: { name }
        });

        return NextResponse.json(folder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();

        // Deleting the folder will now automatically cascade and delete all
        // child subfolders and documents due to the updated Prisma schema.
        const folder = await prisma.folder.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Folder deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
