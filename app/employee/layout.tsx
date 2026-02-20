import SignOutButton from '@/components/SignOutButton';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import EmployeeNav from '@/components/EmployeeNav';
import { prisma } from '@/lib/prisma';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  if (session.user.role !== 'EMPLOYEE') redirect('/admin/dashboard');

  const config = await prisma.tenantConfig.findFirst();
  const toolName = config?.toolName || 'NexPayroll';

  const directReportsCount = await prisma.user.count({
    where: { managerId: session.user.id, isActive: true }
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl space-y-6 p-4 md:p-6 pb-20">
      <div className="flex items-center justify-between panel sticky top-4 z-50 bg-white/80 backdrop-blur-md border border-slate-100/50 shadow-xl shadow-slate-200/20">
        <div>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none mb-1">{toolName} Node</p>
          <p className="font-bold text-slate-800 tracking-tight">{session.user.name}</p>
        </div>
        <div className="flex gap-6 items-center">
          <EmployeeNav directReportsCount={directReportsCount} />
          <div className="h-8 w-[1px] bg-slate-100"></div>
          <SignOutButton />
        </div>
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </div>
    </div>
  );
}
