import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ComponentType } from '@prisma/client';

async function bulkSaveAssignments(formData: FormData) {
    'use server';
    await requireAdmin();
    const employeeId = String(formData.get('employeeId'));

    const components = await prisma.salaryComponent.findMany({
        where: { isActive: true, isVariable: false }
    });

    const updates = components.map(async (comp) => {
        const amountStr = formData.get(`comp_${comp.id}`);
        const amount = amountStr !== null && amountStr !== '' ? Number(amountStr) : 0;

        return prisma.employeeComponentValue.upsert({
            where: {
                employeeId_componentId: {
                    employeeId,
                    componentId: comp.id
                }
            },
            update: { amount, isActive: true },
            create: {
                employeeId,
                componentId: comp.id,
                amount
            }
        });
    });

    await Promise.all(updates);

    revalidatePath('/admin/assignments');
    revalidatePath(`/admin/assignments/${employeeId}`);
    redirect(`/admin/assignments?success=true&message=Salary structure updated for the employee`);
}

export default async function EditEmployeeAssignmentsPage({ params }: { params: { id: string } }) {
    await requireAdmin();

    const employee = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            componentValues: {
                include: { component: true }
            }
        }
    });

    if (!employee) {
        return redirect('/admin/assignments');
    }

    const allFixedComponents = await prisma.salaryComponent.findMany({
        where: { isActive: true, isVariable: false },
        orderBy: { name: 'asc' }
    });

    const earnings = allFixedComponents.filter(c => c.type === ComponentType.EARNING);
    const deductions = allFixedComponents.filter(c => c.type === ComponentType.DEDUCTION);

    const renderComponentList = (components: typeof allFixedComponents, title: string, badgeColor: string) => (
        <div className="panel border-0 bg-white shadow-md shadow-slate-100/50">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <span className={`w-2 h-6 rounded-full ${badgeColor}`}></span>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h3>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">Monthly Setup</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((comp) => {
                    const existingValue = employee.componentValues.find(cv => cv.componentId === comp.id);

                    return (
                        <div key={comp.id} className="relative group p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
                            <label htmlFor={`comp_${comp.id}`} className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-slate-600 transition-colors">
                                {comp.name}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                <input
                                    id={`comp_${comp.id}`}
                                    name={`comp_${comp.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={existingValue ? Number(existingValue.amount) : ''}
                                    placeholder="0.00"
                                    className="input w-full pl-9 bg-white border-slate-200 focus:border-slate-900 focus:ring-slate-100 font-mono text-base font-bold transition-all"
                                />
                            </div>
                        </div>
                    );
                })}

                {components.length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-300 italic font-medium bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                        No {title.toLowerCase()} items found.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/admin/assignments" className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 hover:shadow-md transition-all active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Edit Structure</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Payroll Module / Assignments</p>
                    </div>
                </div>

                <Link
                    href={`/admin/employees/${employee.id}/tax`}
                    className="inline-flex items-center h-12 px-8 rounded-2xl bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] hover:bg-blue-800 hover:shadow-2xl hover:shadow-blue-300 transition-all active:scale-95 shadow-xl shadow-blue-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Manage Tax
                </Link>
            </div>

            {/* Profile Highlight Card */}
            <div className="panel bg-blue-50 border-blue-200 shadow-xl shadow-blue-100 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Payroll Subject</span>
                            <span className="w-1 h-1 rounded-full bg-blue-200"></span>
                            <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">{employee.employeeCode || 'System ID: ' + employee.id.slice(0, 5)}</span>
                        </div>
                        <h2 className="text-5xl font-black text-blue-900 tracking-tighter leading-none mb-3 italic uppercase">
                            {employee.name}
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-blue-700 flex items-center bg-blue-600/5 px-3 py-1 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                                {employee.designation || 'Staff Member'}
                            </span>
                            <span className="text-sm font-bold text-blue-700 flex items-center bg-blue-600/5 px-3 py-1 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                {employee.department || 'General Client'}
                            </span>
                        </div>
                    </div>
                    <div className={`px-6 py-2 rounded-2xl text-[11px] font-black tracking-[0.2em] border shadow-xl shadow-blue-100/50 transform hover:scale-105 transition-all ${employee.isActive ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50' : 'border-red-500/50 text-red-600 bg-red-50'}`}>
                        {employee.isActive ? 'ACCOUNT ACTIVE' : 'ACCOUNT DISABLED'}
                    </div>
                </div>
            </div>

            <form action={bulkSaveAssignments} className="space-y-8">
                <input type="hidden" name="employeeId" value={employee.id} />

                <div className="grid grid-cols-1 gap-8">
                    {renderComponentList(earnings, "Earnings Structure", "bg-emerald-500")}
                    {renderComponentList(deductions, "Deductions Structure", "bg-amber-500")}
                </div>

                {/* Sticky Action Footer */}
                <div className="sticky bottom-8 z-50 transform hover:translate-y-[-4px] transition-all duration-300">
                    <div className="p-4 bg-blue-50/80 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center gap-4">
                        <button type="submit" className="btn-primary w-full md:flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-200/50 active:bg-blue-800">
                            Save Final Structure
                        </button>
                        <Link href="/admin/assignments" className="w-full md:w-auto px-10 h-14 inline-flex items-center justify-center font-black uppercase tracking-[0.2em] text-xs text-blue-500 border-2 border-blue-100 rounded-2xl hover:bg-white hover:text-blue-700 transition-all active:scale-95">
                            Cancel Changes
                        </Link>
                    </div>
                </div>
            </form>

            {/* Info Message */}
            <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-3xl border-2 border-dashed border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <p className="text-xs font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                    Changes will be applied to <span className="text-blue-900 underline font-black">future</span> payroll cycles. Existing draft payrolls must be re-processed to reflect new amounts.
                </p>
            </div>
        </div>
    );
}
