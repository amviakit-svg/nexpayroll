'use client';

type AttendanceRecord = {
    id: string;
    date: Date | string;
    day: string;
    shift: string;
    inTime: string;
    outTime: string;
    workOT: string;
    overtime: string;
    lessHrs: string;
    status: string;
    remark: string;
};

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
    if (!records || records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <span className="text-4xl mb-4 opacity-50">📅</span>
                <p className="font-medium">No attendance records found for this period.</p>
                <p className="text-xs mt-1">Please ensure data has been synced correctly.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Day</th>
                        <th className="p-4">Shift</th>
                        <th className="p-4">In</th>
                        <th className="p-4">Out</th>
                        <th className="p-4">Work+OT</th>
                        <th className="p-4">OT</th>
                        <th className="p-4">Less Hrs</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Remark</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {records.map((r) => {
                        const d = new Date(r.date);
                        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                        const remark = (r.remark || '').toUpperCase();
                        const isAbsent = r.status.toLowerCase().startsWith('a');
                        const isLessHours = remark.includes('LT-EO');
                        const isOvertime = remark.includes('LT-OT');
                        const isEmpty = r.inTime === '--:--' || !r.inTime;

                        return (
                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="p-4 font-mono font-bold text-slate-700 bg-slate-50/50 group-hover:bg-blue-50/50">{dateStr}</td>
                                <td className="p-4 uppercase text-[11px] font-bold text-slate-400 tracking-wider border-r border-slate-50">{r.day}</td>
                                <td className="p-4 text-slate-600">{r.shift}</td>
                                <td className={`p-4 font-mono ${isEmpty ? 'text-slate-300' : 'text-slate-900 font-bold'}`}>{r.inTime || '--:--'}</td>
                                <td className={`p-4 font-mono ${isEmpty ? 'text-slate-300' : 'text-slate-900 font-bold'}`}>{r.outTime || '--:--'}</td>
                                <td className="p-4 font-mono text-[11px] font-bold text-slate-500">{r.workOT}</td>
                                <td className="p-4 font-mono font-bold text-emerald-600">
                                    {r.overtime !== '00:00' ? r.overtime : <span className="text-slate-200">-</span>}
                                </td>
                                <td className="p-4 font-mono font-bold text-rose-500">
                                    {r.lessHrs !== '00:00' ? r.lessHrs : <span className="text-slate-200">-</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${isAbsent ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        isLessHours ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            isOvertime ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-4 text-[11px] font-medium text-slate-400 group-hover:text-slate-600 truncate max-w-[120px]" title={r.remark || '--'}>
                                    {r.remark || '--'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
