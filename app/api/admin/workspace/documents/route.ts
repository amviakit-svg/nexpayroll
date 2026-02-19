import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');

        const documents = await prisma.document.findMany({
            where: {
                folderId: folderId && folderId !== 'root' ? folderId : null
            },
            include: {
                shares: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await requireAdmin();
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folderId = formData.get('folderId') as string;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename to avoid path traversal or issues
        const cleanFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const storageFileName = `${Date.now()}-${cleanFileName}`;
        const relativePath = `public/uploads/workspace/${storageFileName}`;
        const absolutePath = path.join(process.cwd(), relativePath);

        // Ensure directory exists (just in case)
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await fs.promises.writeFile(absolutePath, buffer);

        const doc = await prisma.document.create({
            data: {
                name: file.name,
                filePath: relativePath,
                fileSize: file.size,
                fileType: file.type || path.extname(file.name),
                folderId: folderId && folderId !== 'root' ? folderId : null,
                uploaderId: session.user.id
            }
        });

        return NextResponse.json(doc);
    } catch (error: any) {
        console.error('[WORKSPACE_UPLOAD_ERROR]', error);
        return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
    }
}
