'use client';

import { useState, useEffect } from 'react';
import AttendanceTable from '@/components/AttendanceTable';

const MONTHS = [
    { name: 'April', index: 4 }, { name: 'May', index: 5 }, { name: 'June', index: 6 },
    { name: 'July', index: 7 }, { name: 'August', index: 8 }, { name: 'September', index: 9 },
    { name: 'October', index: 10 }, { name: 'November', index: 11 }, { name: 'December', index: 12 },
    { name: 'January', index: 1 }, { name: 'February', index: 2 }, { name: 'March', index: 3 },
];

export default function EmployeeAttendancePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const activeFYStart = month <= 3 ? year - 1 : year;

    // Summary Calculations
    const stats = attendance.reduce((acc, curr) => {
        const status = (curr.status || '').toLowerCase();
        const remark = (curr.remark || '').toUpperCase();

        if (status.startsWith('p')) acc.present++;
        if (status.startsWith('a')) acc.absent++;

        // Refined Logic (User Requested): LT-EO/LT-OT in Remarks
        if (remark.includes('LT-EO')) acc.lessHoursCount++;
        if (remark.includes('LT-OT')) acc.overtimeCount++;

        // Sum Durations (HH:MM format)
        if (curr.overtime && curr.overtime !== '00:00' && curr.overtime !== '--:--') {
            const [h, m] = curr.overtime.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) acc.totalOTMinutes += (h * 60) + m;
        }
        if (curr.lessHrs && curr.lessHrs !== '00:00' && curr.lessHrs !== '--:--') {
            const [h, m] = curr.lessHrs.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) acc.totalLessMinutes += (h * 60) + m;
        }
        return acc;
    }, { present: 0, absent: 0, lessHoursCount: 0, overtimeCount: 0, totalOTMinutes: 0, totalLessMinutes: 0 });

    const formatHHMM = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const otDisplay = formatHHMM(stats.totalOTMinutes);
    const lhDisplay = formatHHMM(stats.totalLessMinutes);

    useEffect(() => {
        fetchAttendance();
    }, [year, month]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/attendance?year=${year}&month=${month}`);
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
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Attendance</h1>
                    <p className="text-sm text-slate-500 font-medium">Track your daily logs and check-in history.</p>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Status Summary</p>
                    <div className="flex gap-2">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-100 uppercase">Synced</span>
                    </div>
                </div>
            </header>

            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="panel bg-white border-slate-100 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 ring-1 ring-slate-100 group hover:ring-emerald-200 transition-all">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Days</span>
                    <span className="text-3xl font-black text-emerald-600 transition-transform group-hover:scale-110">{stats.present}</span>
                    <div className="w-8 h-1 bg-emerald-100 rounded-full"></div>
                </div>
                <div className="panel bg-white border-slate-100 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 ring-1 ring-slate-100 group hover:ring-rose-200 transition-all">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent Days</span>
                    <span className="text-3xl font-black text-rose-600 transition-transform group-hover:scale-110">{stats.absent}</span>
                    <div className="w-8 h-1 bg-rose-100 rounded-full"></div>
                </div>
                <div className="panel bg-white border-slate-100 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 ring-1 ring-slate-100 group hover:ring-amber-200 transition-all">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Less Hours</span>
                    <span className="text-3xl font-black text-amber-600 transition-transform group-hover:scale-110">{lhDisplay}</span>
                    <div className="w-8 h-1 bg-amber-100 rounded-full"></div>
                </div>
                <div className="panel bg-blue-600 shadow-blue-100 shadow-xl p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 group border-blue-500 transition-all">
                    <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Overtime</span>
                    <span className="text-3xl font-black text-white transition-transform group-hover:scale-110">{otDisplay}</span>
                    <div className="w-8 h-1 bg-blue-400/30 rounded-full"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="panel space-y-4 shadow-xl border-slate-100 bg-white ring-1 ring-slate-100 p-6">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                            <span className="text-blue-600 font-bold">📅</span>
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Select Period</h3>
                        </div>
                        <div className="space-y-4">
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

                    <div className="panel bg-slate-50 border-slate-100 p-6 rounded-3xl">
                        <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <span>ℹ️</span> Legend
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-100"></span>
                                <span className="text-xs text-slate-600 font-medium">P / Present - Regular day</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-100"></span>
                                <span className="text-xs text-slate-600 font-medium">A / Absent - No log found</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-100"></span>
                                <span className="text-xs text-slate-600 font-medium">LT-EO / Less Hours (Remark)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-100"></span>
                                <span className="text-xs text-slate-600 font-medium">LT-OT / Overtime (Remark)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h3 className="font-black text-slate-800 tracking-tight text-lg">
                                Log History: {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                            </h3>
                        </div>
                        {attendance.length > 0 && (
                            <div className="text-right">
                                <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-100">
                                    {attendance.length} Total Logs
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em]">Updating Timeline</p>
                        </div>
                    ) : (
                        <AttendanceTable records={attendance} />
                    )}
                </div>
            </div>
        </div>
    );
}
