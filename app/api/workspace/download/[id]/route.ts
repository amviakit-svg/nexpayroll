import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(_: Request, { params }: { params: { id: string } }) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(_.url);
        const isPreview = searchParams.get('preview') === 'true';

        const doc = await prisma.document.findUnique({
            where: { id: params.id },
            include: { shares: true }
        });

        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

        // Permission check
        const isAdmin = session.user.role === 'ADMIN';
        const isUploader = doc.uploaderId === session.user.id;
        const isSharedWithMe = doc.shares.some(s => s.userId === session.user.id);

        if (!isAdmin && !isUploader && !isSharedWithMe) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const absolutePath = path.join(process.cwd(), doc.filePath);
        if (!fs.existsSync(absolutePath)) {
            return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
        }

        const buf = await fs.promises.readFile(absolutePath);

        // Map file extensions to content types if needed, or use doc.fileType if it's reliable
        const contentType = doc.fileType.includes('/') ? doc.fileType : 'application/octet-stream';

        return new NextResponse(buf, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': isPreview ? 'inline' : `attachment; filename="${doc.name}"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
