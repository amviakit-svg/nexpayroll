'use client';

import { useState, useEffect } from 'react';

const MONTHS = [
    { name: 'April', index: 4 }, { name: 'May', index: 5 }, { name: 'June', index: 6 },
    { name: 'July', index: 7 }, { name: 'August', index: 8 }, { name: 'September', index: 9 },
    { name: 'October', index: 10 }, { name: 'November', index: 11 }, { name: 'December', index: 12 },
    { name: 'January', index: 1 }, { name: 'February', index: 2 }, { name: 'March', index: 3 },
];

export default function PayslipExplorer({ initialSlips }: { initialSlips: any[] }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [slips, setSlips] = useState(initialSlips);
    const [loading, setLoading] = useState(false);
    const [previewSlip, setPreviewSlip] = useState<any>(null);

    const activeFYStart = month <= 3 ? year - 1 : year;

    useEffect(() => {
        fetchSlips();
    }, [year, month]);

    const fetchSlips = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employee/payslips?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setSlips(data);
            }
        } catch (err) {
            console.error('Failed to fetch slips');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 space-y-6">
                <div className="panel bg-white border-slate-100 p-6 rounded-3xl shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                        <span className="text-blue-600 font-bold">📅</span>
                        <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Selection Filter</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Financial Year</label>
                            <select
                                value={activeFYStart}
                                onChange={(e) => {
                                    const newFY = Number(e.target.value);
                                    setYear(month <= 3 ? newFY + 1 : newFY);
                                }}
                                className="w-full rounded-xl border-slate-200 text-sm font-bold py-2.5 shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                                {[2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}-{y + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Month</label>
                            <select
                                value={month}
                                onChange={(e) => {
                                    const m = Number(e.target.value);
                                    setMonth(m);
                                    setYear(m <= 3 ? activeFYStart + 1 : activeFYStart);
                                }}
                                className="w-full rounded-xl border-slate-200 text-sm font-bold py-2.5 shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                                {MONTHS.map(m => (
                                    <option key={m.index} value={m.index}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="panel bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col gap-4 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Quick Access</p>
                    <h4 className="font-bold text-sm leading-tight">Can't find your payslip?</h4>
                    <p className="text-xs opacity-75 font-medium leading-relaxed">Ensure your HR has submitted the payroll for the selected period.</p>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed border-slate-100">
                        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Records</p>
                    </div>
                ) : slips.length > 0 ? (
                    slips.map(s => (
                        <div key={s.id} className="panel bg-white border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-lg transition-all ring-1 ring-slate-100">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">📄</div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-slate-900 tracking-tight">Statement for {MONTHS.find(m => m.index === s.payrollCycle.month)?.name} {s.payrollCycle.year}</h4>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">₹{Number(s.finalPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                        <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Released</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPreviewSlip(s)}
                                    className="bg-slate-100 text-slate-700 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                                >
                                    <span>👁️</span> Preview
                                </button>
                                <a
                                    href={`/api/payslips/${s.id}`}
                                    className="bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 group-hover:shadow-blue-200 hover:-translate-y-0.5"
                                >
                                    <span>📥</span> Download
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="panel bg-white border-dashed border-2 border-slate-200 p-20 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 opacity-40">📂</div>
                        <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">No Records Found</p>
                        <p className="text-xs text-slate-400 mt-3 max-w-[250px] font-medium leading-relaxed">The requested payslip has not been generated or published by the accounts department yet.</p>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewSlip && (
                <div className="fixed inset-0 z-[100] bg-blue-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-full rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-white">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-200">📄</div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Statement Preview</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                        {MONTHS.find(m => m.index === previewSlip.payrollCycle.month)?.name} {previewSlip.payrollCycle.year}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <a
                                    href={`/api/payslips/${previewSlip.id}`}
                                    className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    <span>📥</span> Download PDF
                                </a>
                                <button
                                    onClick={() => setPreviewSlip(null)}
                                    className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all font-black text-xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-blue-50 p-2 md:p-6 overflow-hidden">
                            <iframe
                                src={`/api/payslips/${previewSlip.id}?preview=true#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full rounded-xl border-none shadow-2xl bg-white"
                                title="Payslip Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
