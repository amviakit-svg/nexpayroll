import AdminSidebar from '@/components/AdminSidebar';
import SignOutButton from '@/components/SignOutButton';
import { requireAdmin } from '@/lib/session';
import { APP_NAME } from '@/lib/brand';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const config = await prisma.tenantConfig.findFirst();
  const toolName = config?.toolName || APP_NAME;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 p-4 md:p-6">
      <AdminSidebar appName={toolName} />

      <main className="flex-1 min-w-0 space-y-6">
        <header className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-slate-100 bg-white shadow-sm rounded-2xl">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400">Current Session</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-normal">
                {session.user.name?.charAt(0) || 'A'}
              </div>
              <p className="text-slate-700 font-normal">{session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-blue-300 uppercase tracking-widest italic leading-tight">Administrator Access</p>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div className="min-h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
