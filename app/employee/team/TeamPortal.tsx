'use client';

import React, { useState } from 'react';
import ReportsClient from '@/app/admin/reports/ReportsClient';

interface User {
    id: string;
    name: string;
    email: string;
    designation: string | null;
    department: string | null;
}

export default function TeamPortal({ initialReports }: { initialReports: User[] }) {
    const [viewingReport, setViewingReport] = useState<string | null>(null);

    if (viewingReport) {
        const selectedUser = initialReports.find(u => u.id === viewingReport);
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setViewingReport(null)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-black mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 w-fit transition-all hover:bg-blue-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Team List
                </button>
                <ReportsClient
                    initialUsers={initialReports}
                    isManagerView={true}
                    initialSelectedUser={viewingReport}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in pb-24">
            <div>
                <h1 className="text-3xl tracking-tighter text-blue-900 font-normal">My Team</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialReports.map((u) => (
                    <div key={u.id} className="panel bg-white border border-slate-100 hover:border-blue-200 transition-all p-6 rounded-3xl space-y-4 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {u.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{u.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{u.designation || 'Staff'}</div>
                            </div>
                        </div>

                        <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                {u.department || 'Direct Client'}
                            </div>
                            <button
                                onClick={() => setViewingReport(u.id)}
                                className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                            >
                                View Activity →
                            </button>
                        </div>
                    </div>
                ))}

                {initialReports.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">No direct reports found under your account.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
