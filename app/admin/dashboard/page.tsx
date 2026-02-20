import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    await requireAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Stats
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } });

    const attendanceToday = await prisma.attendance.count({
        where: {
            date: today,
            status: 'P'
        }
    });

    const pendingLeaves = await (prisma.leaveRequest as any).count({
        where: {
            status: { in: ['PENDING', 'APPROVED_BY_MANAGER'] }
        }
    });

    const onLeaveToday = await (prisma.leaveRequest as any).count({
        where: {
            status: 'APPROVED',
            startDate: { lte: today },
            endDate: { gte: today }
        }
    });

    const config = await prisma.tenantConfig.findFirst();

    const stats = {
        totalEmployees,
        presentToday: attendanceToday,
        onLeaveToday,
        pendingLeaves,
        companyTitle: config?.companyName || 'NexPayroll'
    };

    // 2. Hierarchy
    const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            managerId: true,
            designation: true,
            photoUrl: true,
            department: true
        }
    });

    // Robust Map-based tree construction
    const userNodes = new Map();
    allUsers.forEach(u => {
        userNodes.set(u.id, {
            ...u,
            children: []
        });
    });

    const roots: any[] = [];
    allUsers.forEach(u => {
        const node = userNodes.get(u.id);
        if (u.managerId && userNodes.has(u.managerId)) {
            userNodes.get(u.managerId).children.push(node);
        } else {
            // This is a CEO/Root level human
            roots.push(node);
        }
    });

    // Grouping the root humans by Client (Department)
    const clientStructure: Record<string, any[]> = {};
    roots.forEach(rootNode => {
        const clientName = rootNode.department || 'Direct / General';
        if (!clientStructure[clientName]) clientStructure[clientName] = [];
        clientStructure[clientName].push(rootNode);
    });

    const hierarchy = Object.entries(clientStructure).map(([clientName, nodes]) => ({
        id: `client-${clientName}`,
        name: clientName,
        isClient: true,
        children: nodes
    }));

    // For server components, we need to handle serialization of any non-plain objects if they exist
    // But here everything is simple primitives or simple arrays/objects.

    return (
        <DashboardClient
            initialStats={stats}
            initialHierarchy={JSON.parse(JSON.stringify(hierarchy))}
        />
    );
}
