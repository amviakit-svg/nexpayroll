'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    managerId: string | null;
    designation: string | null;
    employeeCode: string | null;
    pan: string | null;
    dateOfJoining: any;
    pfNumber: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
    department: string | null; // This is "Client" in the UI
    manager?: { name: string } | null;
}

export default function EmployeeDirectory({
    initialUsers,
    potentialManagers,
    toggleAction,
    editAction,
    resetPasswordAction,
    createAction,
    formSections = []
}: {
    initialUsers: User[],
    potentialManagers: any[],
    editAction: (formData: FormData) => Promise<any>,
    toggleAction: (formData: FormData) => Promise<any>,
    resetPasswordAction: (formData: FormData) => Promise<any>,
    createAction: (formData: FormData) => Promise<any>,
    formSections: { identifier: string, name: string, isVisible: boolean }[]
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isSectionVisible = (id: string) => {
        const sec = formSections.find(s => s.identifier === id);
        return sec ? sec.isVisible : true;
    };

    const getSectionName = (id: string, defaultName: string) => {
        const sec = formSections.find(s => s.identifier === id);
        return sec ? sec.name : defaultName;
    };

    const filteredUsers = useMemo(() => {
        return initialUsers.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.employeeCode && u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [initialUsers, searchQuery]);

    return (
        <div className="space-y-10 animate-in pb-24">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl tracking-tighter text-blue-900 font-normal">Personnel Hub</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">Workforce Directory</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={`${showAddForm ? 'bg-rose-500' : 'bg-blue-700'} text-white h-14 px-8 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-blue-50 transition-all active:scale-95 flex items-center justify-center gap-3`}
                    >
                        {showAddForm ? (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Close Entry</>
                        ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Create Record</>
                        )}
                    </button>
                    <Link href="/admin/employees/bulk" className="btn-secondary h-14 px-8 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center shadow-lg shadow-slate-50">
                        Bulk Batch
                    </Link>
                    <a
                        href="/api/admin/employees/export"
                        className="bg-emerald-600 text-white h-14 px-8 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Export Personnel
                    </a>
                </div>
            </div>

            {/* Dynamic Add Form */}
            {showAddForm && (
                <div className="panel bg-white border-2 border-slate-900/5 shadow-2xl shadow-slate-200 rounded-[2.5rem] p-8 md:p-12 animate-in slide-in-from-top-4 duration-500">
                    <form action={async (fd) => { await createAction(fd); setShowAddForm(false); }} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                            {isSectionVisible('basic') && (
                                <>
                                    <SectionHeader title={getSectionName('basic', 'Basic Credentials')} />
                                    <Field label="Full Name" name="name" required placeholder="John Doe" />
                                    <Field label="Email Address" name="email" type="email" required placeholder="john@company.com" />
                                    <Field label="Initial Password" name="password" required placeholder="••••••••" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</label>
                                        <select name="role" className="input w-full h-12 bg-slate-50 focus:bg-white border-transparent focus:border-slate-200 transition-all font-bold">
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="ADMIN">Administrator</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {isSectionVisible('client') && (
                                <>
                                    <SectionHeader title={getSectionName('client', 'Client & Role')} />
                                    <Field label="Designation" name="designation" placeholder="Senior Architect" />
                                    <Field label="Employee Code" name="employeeCode" placeholder="NX-001" />
                                    <Field label="Client / Dept" name="department" placeholder="Enter Client Name" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reporting Manager</label>
                                        <select name="managerId" className="input w-full h-12 bg-slate-50 focus:bg-white border-transparent focus:border-slate-200 transition-all font-bold">
                                            <option value="">Select Manager</option>
                                            {potentialManagers.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Field label="Join Date" name="dateOfJoining" type="date" />
                                </>
                            )}

                            {isSectionVisible('compliance') && (
                                <>
                                    <SectionHeader title={getSectionName('compliance', 'Compliance')} />
                                    <Field label="PAN Card" name="pan" placeholder="ABCDE1234F" />
                                    <Field label="PF Number" name="pfNumber" placeholder="MH/BAN/00123" />
                                </>
                            )}

                            {isSectionVisible('bank') && (
                                <>
                                    <SectionHeader title={getSectionName('bank', 'Banking')} />
                                    <Field label="Bank Name" name="bankName" placeholder="HDFC Bank" />
                                    <Field label="Account No" name="accountNumber" placeholder="00012345..." />
                                    <Field label="IFSC Code" name="ifscCode" placeholder="HDFC0000..." />
                                </>
                            )}
                        </div>

                        <div className="flex justify-end pt-10 border-t border-slate-100">
                            <button className="btn-primary h-16 px-12 rounded-2xl text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100">
                                Register Personnel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Directory Table */}
            <div className="panel bg-white border border-slate-100 shadow-sm shadow-slate-100 p-8 rounded-[2rem]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search personnel directory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input w-full h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm font-normal"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300">
                            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-900 p-1">✕</button>
                        )}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">
                        Records Count: <span className="text-blue-700">{filteredUsers.length}</span> / {initialUsers.length}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-50 bg-white">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-blue-50 text-[10px] uppercase tracking-widest text-blue-400 border-b border-blue-100">
                            <tr>
                                <th className="px-8 py-5">Personnel Name</th>
                                <th className="px-8 py-5">Client Segment</th>
                                <th className="px-8 py-5">Account Status</th>
                                <th className="px-8 py-5 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/70">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xs uppercase shadow-md group-hover:scale-105 transition-all font-normal">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-slate-900 group-hover:text-blue-700 transition-colors">{u.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <div className="text-slate-600 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
                                                {u.department || 'Direct Client'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 opacity-60 italic">
                                                {u.designation || 'Specialized Staff'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <form action={toggleAction}>
                                            <input type="hidden" name="id" value={u.id} />
                                            <input type="hidden" name="isActive" value={String(u.isActive)} />
                                            <button className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest border transition-all active:scale-95 ${u.isActive
                                                ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${u.isActive ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </form>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <Link
                                                href={`/admin/employees/${u.id}/edit`}
                                                className="h-9 px-5 rounded-xl text-[10px] uppercase tracking-widest bg-white border border-slate-200 text-slate-500 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                Profile Edit
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    const pwd = window.prompt('Define new security key for ' + u.name + ':');
                                                    if (pwd) {
                                                        const fd = new FormData();
                                                        fd.append('id', u.id);
                                                        fd.append('newPassword', pwd);
                                                        resetPasswordAction(fd);
                                                    }
                                                }}
                                                className="h-9 px-5 rounded-xl text-[10px] uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                Reset Pass
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
