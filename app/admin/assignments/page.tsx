import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function toggleEmployeeActive(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const currentStatus = formData.get('currentStatus') === 'true';

  await prisma.user.update({
    where: { id },
    data: { isActive: !currentStatus }
  });

  revalidatePath('/admin/assignments');
  redirect(`/admin/assignments?success=true&message=Status updated for ${currentStatus ? 'disabled' : 'enabled'}`);
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: { q?: string; success?: string; message?: string };
}) {
  await requireAdmin();
  const query = searchParams.q || '';

  const employees = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { employeeCode: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      componentValues: {
        include: {
          component: true
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="panel">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl tracking-tighter text-blue-900 font-normal">Salary Assignments</h1>
            <p className="text-sm text-slate-400 font-medium">Manage fixed components and account status for your team.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/assignments/bulk" className="btn-secondary h-12 px-8 rounded-xl text-[10px] uppercase tracking-widest flex items-center shadow-lg shadow-slate-50">Bulk CSV Upload</Link>
          </div>
        </div>

        <div className="mb-8">
          <form className="relative max-w-sm">
            <input
              name="q"
              type="text"
              placeholder="Search by name or code..."
              defaultValue={query}
              className="input w-full pl-11 bg-slate-50 border-transparent focus:bg-white focus:border-slate-900 transition-all shadow-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            {query && (
              <Link href="/admin/assignments" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-900 font-bold">✕</Link>
            )}
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-[10px] uppercase tracking-widest text-blue-400 border-b border-blue-50">
              <tr>
                <th className="px-6 py-5">Employee Details</th>
                <th className="px-6 py-5">Fixed Pay Items</th>
                <th className="px-6 py-5">Monthly Net Fixed</th>
                <th className="px-6 py-5">Account Status</th>
                <th className="px-6 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {employees.map((emp) => {
                const fixedItems = emp.componentValues.filter(cv => !cv.component.isVariable);
                const totalFixed = fixedItems.reduce((acc, curr) => {
                  return curr.component.type === 'EARNING' ? acc + Number(curr.amount) : acc - Number(curr.amount);
                }, 0);

                return (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="text-slate-900 group-hover:text-blue-700 transition-colors">{emp.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 tracking-wider">{emp.employeeCode || 'No Code'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {fixedItems.length > 0 ? (
                          fixedItems.slice(0, 3).map(fi => (
                            <span key={fi.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white text-slate-500 border border-slate-200">
                              {fi.component.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 italic text-xs">No assignments</span>
                        )}
                        {fixedItems.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold self-center">+{fixedItems.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-slate-900">
                      ₹ {totalFixed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5">
                      <form action={toggleEmployeeActive}>
                        <input type="hidden" name="id" value={emp.id} />
                        <input type="hidden" name="currentStatus" value={String(emp.isActive)} />
                        <button
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest border transition-all active:scale-95 ${emp.isActive
                            ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${emp.isActive ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
                          {emp.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end items-center gap-2">
                      <Link
                        href={`/admin/assignments/${emp.id}`}
                        className="inline-flex items-center h-9 px-5 border border-slate-200 shadow-sm text-[10px] uppercase tracking-widest rounded-xl text-slate-500 bg-white hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all active:scale-95"
                      >
                        Edit Structure
                      </Link>
                      <Link
                        href={`/admin/employees/${emp.id}/tax`}
                        className="inline-flex items-center h-9 px-5 border border-slate-200 shadow-sm text-[10px] uppercase tracking-widest rounded-xl text-slate-500 bg-white hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all active:scale-95"
                      >
                        Manage Tax
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
