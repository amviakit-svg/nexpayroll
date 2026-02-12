import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function saveAssignment(formData: FormData) {
  'use server';
  await requireAdmin();
  const employeeId = String(formData.get('employeeId'));
  const componentId = String(formData.get('componentId'));
  const amount = Number(formData.get('amount'));

  await prisma.employeeComponentValue.upsert({
    where: { employeeId_componentId: { employeeId, componentId } },
    update: { amount, isActive: true },
    create: { employeeId, componentId, amount }
  });
  revalidatePath('/admin/assignments');
}

export default async function AssignmentsPage() {
  await requireAdmin();
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, orderBy: { name: 'asc' } });
  const components = await prisma.salaryComponent.findMany({ where: { isActive: true, isVariable: false }, orderBy: { name: 'asc' } });
  const assignments = await prisma.employeeComponentValue.findMany({
    include: { employee: true, component: true },
    where: { isActive: true, component: { isVariable: false } },
    orderBy: { employee: { name: 'asc' } }
  });

  return (
    <div className="space-y-6">
      <div className="panel">
        <h2 className="mb-4">Assign Fixed Amount Component</h2>
        <form action={saveAssignment} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select name="employeeId" required>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select name="componentId" required>
            <option value="">Select fixed component</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
          <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required />
          <button className="btn-primary">Save assignment</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4">Current Fixed Assignments</h2>
        <div className="space-y-2 text-sm">
          {assignments.map((a) => (
            <p key={a.id} className="rounded-lg border border-slate-200 p-3">
              <span className="font-medium">{a.employee.name}</span> — {a.component.name} ({a.component.type}) : {Number(a.amount).toFixed(2)}
            </p>
          ))}
          {assignments.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-slate-500">No fixed assignments yet.</p>}
        </div>
      </div>
    </div>
  );
}
