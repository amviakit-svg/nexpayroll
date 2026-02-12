import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export default async function EmployeePayslipsPage() {
  const session = await requireAuth();
  const slips = await prisma.payrollEntry.findMany({
    where: {
      employeeId: session.user.id,
      payrollCycle: { status: 'SUBMITTED' }
    },
    include: { payrollCycle: true },
    orderBy: [{ payrollCycle: { year: 'desc' } }, { payrollCycle: { month: 'desc' } }]
  });

  return (
    <div className="panel">
      <h1 className="mb-5">My Payslips</h1>
      <div className="space-y-3">
        {slips.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium">
                {String(s.payrollCycle.month).padStart(2, '0')}/{s.payrollCycle.year}
              </p>
              <p className="text-sm text-slate-600">Final payable: {Number(s.finalPayable).toFixed(2)}</p>
            </div>
            <a className="btn-primary" href={`/api/payslips/${s.id}`}>
              Download PDF
            </a>
          </div>
        ))}
        {slips.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">No submitted payslips yet.</p>}
      </div>
    </div>
  );
}
