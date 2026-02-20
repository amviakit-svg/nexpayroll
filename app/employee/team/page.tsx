import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import TeamPortal from './TeamPortal';

export default async function ManagerTeamPage() {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { managerId: true }
    });

    const directReports = await prisma.user.findMany({
        where: {
            managerId: session.user.id,
            id: { not: user?.managerId || undefined },
            isActive: true
        },
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
        <TeamPortal initialReports={directReports} />
    );
}
