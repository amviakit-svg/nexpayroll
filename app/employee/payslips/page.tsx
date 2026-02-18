import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import PayslipExplorer from '@/components/PayslipExplorer';

export default async function EmployeePayslipsPage() {
  const session = await requireAuth();

  // Initial fetch for current/latest slips (optional, Explorer fetches on mount anyway)
  const slips = await prisma.payrollEntry.findMany({
    where: {
      employeeId: session.user.id,
      payrollCycle: { status: 'SUBMITTED' }
    },
    include: { payrollCycle: true },
    take: 5,
    orderBy: [{ payrollCycle: { year: 'desc' } }, { payrollCycle: { month: 'desc' } }]
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Electronic Payslips</h1>
        <p className="text-sm text-slate-500 font-medium">Access and download your comprehensive salary statements by period.</p>
      </header>

      <PayslipExplorer initialSlips={slips} />
    </div>
  );
}
