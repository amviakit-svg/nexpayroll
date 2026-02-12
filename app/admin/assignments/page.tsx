import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

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

async function deleteAssignment(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  await prisma.employeeComponentValue.delete({ where: { id } });
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

  // Group assignments by Employee
  const groupedAssignments: Record<string, typeof assignments> = {};
  assignments.forEach(a => {
    if (!groupedAssignments[a.employeeId]) {
      groupedAssignments[a.employeeId] = [];
    }
    groupedAssignments[a.employeeId].push(a);
  });

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Assign Fixed Component</h2>
            <Link href="/admin/assignments/bulk" className="btn-secondary text-sm">Bulk Upload CSV</Link>
        </div>
        
        <form action={saveAssignment} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select name="employeeId" required className="input">
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select name="componentId" required className="input">
            <option value="">Select fixed component</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
          <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required className="input" />
          <button className="btn-primary">Save Assignment</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4 text-xl font-bold">Current Fixed Assignments</h2>
        <div className="space-y-6">
          {Object.entries(groupedAssignments).map(([empId, items]) => (
            <div key={empId} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-3 font-semibold border-b border-slate-200">
                {items[0].employee.name}
              </div>
              <div className="p-3 space-y-2 bg-white">
                {items.map(a => (
                   <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-50">
                      <span className="text-slate-700">{a.component.name} <span className="text-xs text-slate-500">({a.component.type})</span></span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-medium">{Number(a.amount).toFixed(2)}</span>
                        <form action={deleteAssignment}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                        </form>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No fixed assignments yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
