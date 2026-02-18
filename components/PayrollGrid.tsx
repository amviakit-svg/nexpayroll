'use client';

import { useMemo } from 'react';

type PayrollGridProps = {
    selectedYear: number;
    selectedMonth: number;
    onSelect: (year: number, month: number) => void;
    lockedMonths: string[]; // Format: "YYYY-MM"
};

const FISCAL_MONTHS = [
    { name: 'April', index: 4 },
    { name: 'May', index: 5 },
    { name: 'June', index: 6 },
    { name: 'July', index: 7 },
    { name: 'August', index: 8 },
    { name: 'September', index: 9 },
    { name: 'October', index: 10 },
    { name: 'November', index: 11 },
    { name: 'December', index: 12 },
    { name: 'January', index: 1 },
    { name: 'February', index: 2 },
    { name: 'March', index: 3 },
];

export default function PayrollGrid({
    selectedYear,
    selectedMonth,
    onSelect,
    lockedMonths
}: PayrollGridProps) {
    const currentYear = new Date().getFullYear();

    // The "base" year for the financial cycle (April starts here)
    // If we are currently in Jan/Feb/Mar (1,2,3), the FY started last year
    const activeFYStart = selectedMonth <= 3 ? selectedYear - 1 : selectedYear;

    // Years list: From 2023 to 5 years in the future, plus any custom selected year
    const years = useMemo(() => {
        const list = [];
        const startYear = 2023;
        const endYear = currentYear + 5;
        for (let y = startYear; y <= endYear; y++) {
            list.push(y);
        }
        if (activeFYStart < startYear) list.unshift(activeFYStart);
        if (activeFYStart > endYear) list.push(activeFYStart);
        return Array.from(new Set(list)).sort((a, b) => b - a); // Newest first
    }, [currentYear, activeFYStart]);

    return (
        <div className="panel space-y-4 shadow-md border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Financial Year Tracker</h3>
                    <p className="text-xs text-slate-500 font-medium text-blue-600 font-bold">Selected FY: {activeFYStart}-{activeFYStart + 1}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-600">Select FY:</label>
                    <div className="flex items-center gap-1">
                        <select
                            value={activeFYStart}
                            onChange={(e) => {
                                const newFYStart = Number(e.target.value);
                                // When changing FY, default to April (start of FY)
                                onSelect(newFYStart, 4);
                            }}
                            className="rounded-lg border-slate-300 text-sm focus:ring-blue-500 font-bold bg-white"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}-{y + 1}</option>
                            ))}
                        </select>
                        <button
                            className="btn-secondary text-xs px-2 py-1"
                            onClick={() => {
                                const newYear = prompt("Enter new starting year (e.g. 2026):");
                                if (newYear && !isNaN(Number(newYear))) {
                                    onSelect(Number(newYear), selectedMonth);
                                }
                            }}
                        >
                            + Add Year
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {FISCAL_MONTHS.map((month) => {
                    const monthNum = month.index;
                    // In a fiscal year starting activeFYStart: 
                    // April-Dec are activeFYStart, Jan-Mar are activeFYStart + 1
                    const actualYear = monthNum <= 3 ? activeFYStart + 1 : activeFYStart;
                    const key = `${actualYear}-${monthNum}`;
                    const isSelected = selectedMonth === monthNum && selectedYear === actualYear;
                    const isLocked = lockedMonths.includes(key);

                    return (
                        <button
                            key={month.name}
                            onClick={() => onSelect(actualYear, monthNum)}
                            className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                ${isSelected
                                    ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100'
                                    : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'}
              `}
                        >
                            <div className="absolute top-1 left-2">
                                <span className="text-[9px] font-mono text-slate-400">{actualYear}</span>
                            </div>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                {month.name.substring(0, 3)}
                            </span>
                            <span className={`text-base font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {month.name}
                            </span>

                            <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {isLocked ? (
                                    <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded border border-emerald-200">LOCKED</span>
                                ) : (
                                    <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded border border-blue-200">OPEN</span>
                                )}
                            </div>

                            {isSelected && (
                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white animate-bounce shadow-sm">
                                    ✓
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
