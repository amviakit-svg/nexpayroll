import PayrollRunner from '@/components/PayrollRunner';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export default async function PayrollPage() {
  await requireAdmin();
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });

  const submitted = await prisma.payrollCycle.findMany({
    where: { status: 'SUBMITTED' },
    select: { year: true, month: true }
  });

  const variableComponents = await prisma.salaryComponent.findMany({
    where: { isActive: true, isVariable: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });

  const lockedMonths = submitted.map((s) => `${s.year}-${s.month}`);

  return (
    <div className="space-y-4">
      <h1>Monthly Payroll Cycle</h1>
      <PayrollRunner employees={employees} variableComponents={variableComponents} lockedMonths={lockedMonths} />
    </div>
  );
}
