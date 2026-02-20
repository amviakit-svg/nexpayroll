import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
    await requireAdmin();

    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <ReportsClient initialUsers={users} />
    );
}
