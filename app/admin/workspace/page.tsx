import { prisma } from '@/lib/prisma';
import AdminWorkspaceClient from './AdminWorkspaceClient';
import { requireAdmin } from '@/lib/session';

export default async function AdminWorkspacePage() {
    await requireAdmin();
    const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE', isActive: true },
        select: { id: true, name: true, employeeCode: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage company documents and employee shared workspace.</p>
                </div>
            </header>
            <AdminWorkspaceClient employees={employees} />
        </div>
    );
}
