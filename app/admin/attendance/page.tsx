'use client';

import { useState, useEffect } from 'react';
import AttendanceUpload from '@/components/AttendanceUpload';
import AttendanceTable from '@/components/AttendanceTable';

const MONTHS = [
    { name: 'April', index: 4 }, { name: 'May', index: 5 }, { name: 'June', index: 6 },
    { name: 'July', index: 7 }, { name: 'August', index: 8 }, { name: 'September', index: 9 },
    { name: 'October', index: 10 }, { name: 'November', index: 11 }, { name: 'December', index: 12 },
    { name: 'January', index: 1 }, { name: 'February', index: 2 }, { name: 'March', index: 3 },
];

export default function AdminAttendancePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [employeeId, setEmployeeId] = useState<string>('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const activeFYStart = month <= 3 ? year - 1 : year;

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (employeeId) fetchAttendance();
    }, [year, month, employeeId]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
                if (data.length > 0) setEmployeeId(data[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch employees');
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/attendance?year=${year}&month=${month}&employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setAttendance(data);
            }
        } catch (err) {
            console.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Bar</h1>
                    <p className="text-sm text-slate-500 font-medium">Upload, segregate, and monitor employee check-ins.</p>
                </div>
                <div className="hidden sm:block">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        FY {activeFYStart}-{activeFYStart + 1} Selection
                    </span>
                </div>
            </header>

            <AttendanceUpload />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="panel space-y-6 shadow-xl border-slate-100 bg-white ring-1 ring-slate-100">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                            <span className="text-blue-600 font-bold">🔍</span>
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Configuration</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Employee Selection</label>
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 font-bold py-2.5 transition-all shadow-sm"
                            >
                                <option value="" disabled>Select User...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name} ({e.employeeCode || 'DNA'})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Financial Year</label>
                                <select
                                    value={activeFYStart}
                                    onChange={(e) => {
                                        const newFY = Number(e.target.value);
                                        setYear(month <= 3 ? newFY + 1 : newFY);
                                    }}
                                    className="w-full rounded-xl border-slate-200 text-sm font-bold py-2.5 shadow-sm"
                                >
                                    {[2023, 2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}-{y + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => {
                                        const m = Number(e.target.value);
                                        setMonth(m);
                                        setYear(m <= 3 ? activeFYStart + 1 : activeFYStart);
                                    }}
                                    className="w-full rounded-xl border-slate-200 text-sm font-bold py-2.5 shadow-sm"
                                >
                                    {MONTHS.map(m => (
                                        <option key={m.index} value={m.index}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="panel bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-100 p-6 rounded-3xl">
                        <h4 className="font-bold text-lg mb-2">Sync Status</h4>
                        <p className="text-blue-100 text-xs leading-relaxed opacity-80">
                            Attendance is segregated by employee code and distributed year-wise & month-wise from the uploaded Excel.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h3 className="font-black text-slate-800 tracking-tight text-lg">
                                {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee specific logs</p>
                        </div>
                        {attendance.length > 0 && (
                            <div className="text-right">
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border border-emerald-200">
                                    {attendance.length} Logs Found
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em]">Retrieving Records</p>
                        </div>
                    ) : (
                        <AttendanceTable records={attendance} />
                    )}
                </div>
            </div>
        </div>
    );
}
