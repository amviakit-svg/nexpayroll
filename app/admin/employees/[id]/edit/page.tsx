import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { editEmployee } from '../../actions';

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
    await requireAdmin();
    const { id } = params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: { manager: true }
    });

    if (!user) notFound();

    const potentialManagers = await prisma.user.findMany({
        where: { isActive: true, id: { not: id } },
        orderBy: { name: 'asc' }
    });

    const formSections = await prisma.formSection.findMany({
        orderBy: { order: 'asc' }
    });

    const isSectionVisible = (identifier: string) => {
        const sec = formSections.find(s => s.identifier === identifier);
        return sec ? sec.isVisible : true;
    };

    const getSectionName = (identifier: string, defaultName: string) => {
        const sec = formSections.find(s => s.identifier === identifier);
        return sec ? sec.name : defaultName;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/employees" className="w-12 h-12 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all shadow-sm" title="Back to Directory">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </Link>
                    <div>
                        <h1 className="text-4xl tracking-tighter text-blue-900 font-normal">Profile Edit</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60 italic">Updating records for {user.name}</p>
                    </div>
                </div>
            </div>

            <div className="panel bg-white border border-blue-50 shadow-xl shadow-blue-100/30 rounded-[2.5rem] p-8 md:p-12">
                <form action={editEmployee} className="space-y-12">
                    <input type="hidden" name="id" value={user.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                        {isSectionVisible('basic') && (
                            <>
                                <SectionHeader title={getSectionName('basic', 'Identity & Access')} />
                                <Field label="Full Name" name="name" defaultValue={user.name} required />
                                <Field label="Email Address" name="email" type="email" defaultValue={user.email} required />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</label>
                                    <select name="role" defaultValue={user.role} className="input w-full h-12 bg-slate-50 focus:bg-white border-slate-100 focus:border-blue-200 transition-all">
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {isSectionVisible('client') && (
                            <>
                                <SectionHeader title={getSectionName('client', 'Client Assignment')} />
                                <Field label="Client / Dept" name="department" defaultValue={user.department || ''} placeholder="Enter Client Name" />
                                <Field label="Designation" name="designation" defaultValue={user.designation || ''} placeholder="Senior Architect" />
                                <Field label="Employee Code" name="employeeCode" defaultValue={user.employeeCode || ''} placeholder="NX-001" />
                                <Field label="Join Date" name="dateOfJoining" type="date" defaultValue={user.dateOfJoining ? new Date(user.dateOfJoining).toISOString().split('T')[0] : ''} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reporting Manager</label>
                                    <select name="managerId" defaultValue={user.managerId || ''} className="input w-full h-12 bg-slate-50 focus:bg-white border-slate-100 focus:border-blue-200 transition-all">
                                        <option value="">Select Manager</option>
                                        {potentialManagers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {isSectionVisible('compliance') && (
                            <>
                                <SectionHeader title={getSectionName('compliance', 'Compliance')} />
                                <Field label="PAN Card" name="pan" defaultValue={user.pan || ''} placeholder="ABCDE1234F" />
                                <Field label="PF Number" name="pfNumber" defaultValue={user.pfNumber || ''} placeholder="MH/BAN/00123" />
                            </>
                        )}

                        {isSectionVisible('bank') && (
                            <>
                                <SectionHeader title={getSectionName('bank', 'Banking Details')} />
                                <Field label="Bank Name" name="bankName" defaultValue={user.bankName || ''} placeholder="HDFC Bank" />
                                <Field label="Account No" name="accountNumber" defaultValue={user.accountNumber || ''} placeholder="00012345..." />
                                <Field label="IFSC Code" name="ifscCode" defaultValue={user.ifscCode || ''} placeholder="HDFC0000..." />
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-12 border-t border-slate-100">
                        <Link href="/admin/employees" className="h-16 px-10 rounded-2xl text-[11px] uppercase tracking-widest text-slate-400 hover:text-blue-900 transition-all flex items-center justify-center">
                            Discard Changes
                        </Link>
                        <button className="btn-primary h-16 px-12 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100">
                            Sync Profile Data
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="col-span-full border-l-4 border-blue-700 pl-4 py-1 bg-blue-50/30 mb-2 mt-4 first:mt-0">
            <h3 className="text-[11px] uppercase tracking-widest text-blue-900">{title}</h3>
        </div>
    );
}

function Field({ label, name, type = "text", ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-400">{label}</label>
            <input
                type={type}
                name={name}
                className="input w-full h-12 bg-slate-50 border-slate-100 focus:border-blue-200 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300 rounded-xl"
                {...props}
            />
        </div>
    );
}
