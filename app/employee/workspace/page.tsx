import EmployeeWorkspaceClient from './EmployeeWorkspaceClient';
import { requireAuth } from '@/lib/session';

export default async function EmployeeWorkspacePage() {
    await requireAuth();
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="border-b border-slate-100 pb-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shared Documents</h1>
                <p className="text-sm text-slate-500 font-medium">Access company policies, documents and resources shared with you.</p>
            </header>
            <EmployeeWorkspaceClient />
        </div>
    );
}
