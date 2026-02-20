'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface User {
    id: string;
    name: string;
    email: string;
    designation: string | null;
    department: string | null;
}

interface ReportData {
    attendance: any[];
    leaves: any[];
    payroll: any[];
}

export default function ReportsClient({
    initialUsers,
    isManagerView = false,
    initialSelectedUser = ''
}: {
    initialUsers: User[],
    isManagerView?: boolean;
    initialSelectedUser?: string;
}) {
    const [selectedUser, setSelectedUser] = useState<string>(initialSelectedUser);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' },
    ];

    useEffect(() => {
        if (selectedUser) {
            fetchReport();
        }
    }, [selectedUser, selectedYear, selectedMonth]);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const monthParam = selectedMonth !== 'all' ? `&month=${selectedMonth + 1}` : '';
            const res = await fetch(`/api/reports/employee?employeeId=${selectedUser}&year=${selectedYear}${monthParam}${isManagerView ? '&source=manager' : ''}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            const data = await res.json();
            setReportData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in pb-24">
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isManagerView ? 'md:flex-row-reverse' : ''}`}>
                <div className={isManagerView ? 'text-right' : ''}>
                    <h1 className="text-4xl tracking-tighter text-blue-900 font-normal">
                        {isManagerView && selectedUser ? `${initialUsers.find(u => u.id === selectedUser)?.name}'s Activity` : 'Activity Insights'}
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">
                        {isManagerView ? 'Direct Report Activity' : 'Consolidated Reports'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    {!initialSelectedUser && (
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-1">Select Personnel</label>
                            <select
                                className="input h-14 rounded-2xl bg-white border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="">Select Employee</option>
                                {initialUsers
                                    // Safety filter: Ensure we only show direct reports and exclude the viewer if they were passed
                                    .filter(u => !isManagerView || (u.id !== initialSelectedUser))
                                    .map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.department || 'No Dept'})</option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-1 min-w-[120px]">
                        <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-1">Select Month</label>
                        <select
                            className="input h-14 rounded-2xl bg-white border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold text-center"
                            value={String(selectedMonth)}
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">Full Year</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-1">Archive Year</label>
                        <select
                            className="input h-14 rounded-2xl bg-white border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold text-center"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="panel bg-white p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400 animate-pulse uppercase tracking-widest">Aggregating Records...</p>
                </div>
            )}

            {error && (
                <div className="panel bg-rose-50 border-rose-100 text-rose-700 p-8 rounded-3xl text-center">
                    <p className="font-bold">Error loading report</p>
                    <p className="text-xs opacity-70 mt-1">{error}</p>
                </div>
            )}

            {!loading && !reportData && !selectedUser && (
                <div className="panel bg-white p-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6v12h12V7.5z" /><polyline points="14 2 14 8 20 8" /><path d="M10 13h4" /><path d="M10 17h4" /><path d="M10 9h4" /></svg>
                    </div>
                    <p className="text-slate-400 text-sm max-w-xs">Select an employee from the dropdown to generate an integrated activity report.</p>
                </div>
            )}

            {reportData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Summary Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="panel bg-white border-2 border-blue-900/5 p-8 rounded-[2.5rem]">
                            <h3 className="text-[11px] uppercase tracking-widest text-blue-900 border-l-4 border-blue-700 pl-3 mb-6 font-bold">Consolidated Summary</h3>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="text-xs text-slate-500 uppercase tracking-widest">Attendance</span>
                                    <span className="text-lg font-bold text-slate-800">{reportData.attendance.length} Records</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="text-xs text-slate-500 uppercase tracking-widest">Approved Leaves</span>
                                    <span className="text-lg font-bold text-emerald-600">{reportData.leaves.length} Total</span>
                                </div>
                                {!isManagerView && (
                                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest">Payroll Locked</span>
                                        <span className="text-lg font-bold text-blue-600">{reportData.payroll.length} Cycles</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Breakdown Table */}
                        <div className="panel bg-white border border-slate-100 p-8 rounded-[2.5rem]">
                            <h3 className="text-[11px] uppercase tracking-widest text-slate-400 mb-6 font-bold">Monthly Status</h3>
                            <div className="space-y-2">
                                {(selectedMonth === 'all' ? Array.from({ length: 12 }, (_, i) => i) : [selectedMonth]).map((i) => {
                                    const hasPayroll = reportData.payroll.some(p => p.payrollCycle.month === i + 1);
                                    const hasLeave = reportData.leaves.some(l => {
                                        const d = new Date(l.startDate);
                                        return d.getMonth() === i;
                                    });
                                    return (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-xs font-bold text-slate-600">{format(new Date(2000, i, 1), 'MMMM')}</span>
                                            <div className="flex gap-2">
                                                {!isManagerView && hasPayroll && <span className="w-2 h-2 rounded-full bg-blue-500" title="Payroll Processed"></span>}
                                                {hasLeave && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Leave Taken"></span>}
                                                <span className="w-2 h-2 rounded-full bg-slate-100"></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="panel bg-white border border-slate-100 p-8 rounded-[2.5rem]">
                            <div className="flex items-center justify-between mb-8 border-l-[6px] border-blue-700 pl-4 h-10">
                                <h3 className="text-sm uppercase tracking-[0.2em] text-blue-900 font-black">
                                    Activity Log: {selectedMonth !== 'all' ? months[selectedMonth].label : ''} {selectedYear}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Month-wise View</span>
                            </div>

                            <div className="space-y-12">
                                {(selectedMonth === 'all' ? Array.from({ length: 12 }, (_, i) => 11 - i) : [selectedMonth]).map((monthIndex) => {
                                    const monthAttendance = reportData.attendance.filter(a => new Date(a.date).getMonth() === monthIndex);
                                    const monthLeaves = reportData.leaves.filter(l => new Date(l.startDate).getMonth() === monthIndex);

                                    if (monthAttendance.length === 0 && monthLeaves.length === 0) return null;

                                    return (
                                        <div key={monthIndex} className="space-y-6 animate-in fade-in slide-in-from-left-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{format(new Date(2000, monthIndex, 1), 'MMMM')}</div>
                                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Attendance for this month */}
                                                {monthAttendance.reverse().map((att, idx) => (
                                                    <div key={`att-${idx}`} className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-white hover:border-blue-100 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">A</div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-700">{format(parseISO(att.date), 'dd MMM')}</div>
                                                                <div className="text-[9px] uppercase tracking-widest text-slate-400">{att.day || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${att.status === 'P' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {att.status === 'P' ? 'Present' : 'Absent'}
                                                        </span>
                                                    </div>
                                                ))}

                                                {/* Leaves for this month */}
                                                {monthLeaves.map((l, idx) => (
                                                    <div key={`leave-${idx}`} className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 flex flex-wrap justify-between items-center gap-4 hover:border-amber-200 transition-all">
                                                        <div className="flex gap-3 items-center">
                                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600">L</div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800">{l.leaveType.name} Leave</div>
                                                                <div className="text-[9px] text-slate-500 font-medium">{format(parseISO(l.startDate), 'dd MMM')} - {format(parseISO(l.endDate), 'dd MMM')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-amber-700">{l.daysRequested} Days</div>
                                                            <div className="text-[8px] uppercase tracking-widest text-slate-400">{l.status.replace(/_/g, ' ')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Payroll History */}
                                {!isManagerView && reportData.payroll.length > 0 && (
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center font-bold text-[10px] text-emerald-700">$</div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tighter">Financial Disbursements</h4>
                                        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4">Cycle</th>
                                                        <th className="px-6 py-4">Total Pay</th>
                                                        <th className="px-6 py-4 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {reportData.payroll.map((p, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                                                            <td className="px-6 py-4 font-bold text-slate-700">{format(new Date(2000, p.payrollCycle.month - 1, 1), 'MMMM')} {p.payrollCycle.year}</td>
                                                            <td className="px-6 py-4 text-blue-700 font-bold">₹{Number(p.finalPayable).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase text-[9px]">PAID</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {!reportData.attendance.length && !reportData.leaves.length && !reportData.payroll.length && (
                                    <div className="text-center py-10 text-slate-400 text-sm italic">
                                        No activity records found for the selected {selectedMonth === 'all' ? 'year' : 'month'}.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
