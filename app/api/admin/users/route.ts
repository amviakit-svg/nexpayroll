import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(users);
}
