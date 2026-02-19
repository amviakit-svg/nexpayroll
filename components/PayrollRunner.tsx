'use client';

import { useMemo, useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import PayrollGrid from './PayrollGrid';

type Employee = { id: string; name: string; email: string };
type VariableComponent = { id: string; name: string; type: 'EARNING' | 'DEDUCTION' };
type VariableMap = Record<string, Record<string, number>>;

export default function PayrollRunner({
  employees,
  variableComponents,
  lockedMonths
}: {
  employees: Employee[];
  variableComponents: VariableComponent[];
  lockedMonths: string[];
}) {
  const { showToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [leaves, setLeaves] = useState<Record<string, number>>({});
  const [variableAdjustments, setVariableAdjustments] = useState<VariableMap>({});
  const [preview, setPreview] = useState<any | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const key = `${year}-${month}`;
  const isLocked = useMemo(() => lockedMonths.includes(key), [lockedMonths, key]);

  // Reset state and fetch data when month/year changes
  useEffect(() => {
    setPreview(null);
    setError('');
    if (isLocked) {
      fetchSubmittedData();
    } else {
      setSubmittedData(null);
    }
  }, [year, month, isLocked]);

  async function fetchSubmittedData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payroll/data?year=${year}&month=${month}`);
      const data = await res.json();
      if (res.ok) setSubmittedData(data);
      else console.error('Failed to fetch submitted data:', data.error);
    } catch (err) {
      console.error('Error fetching submitted data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    window.open(`/api/admin/payroll/export?year=${year}&month=${month}`);
  };

  return (
    <div className="space-y-6">
      <PayrollGrid
        selectedYear={year}
        selectedMonth={month}
        lockedMonths={lockedMonths}
        onSelect={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm shadow-sm">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">?</span>
            Salary Definitions
          </h4>
          <ul className="space-y-2 text-slate-700">
            <li>
              <span className="font-bold text-slate-900">Net Monthly Salary:</span> Total earnings minus total deductions for a <span className="underline decoration-blue-200">full 30-day month</span>.
            </li>
            <li>
              <span className="font-bold text-slate-900">Leave Deduction Amount:</span> Predicted deduction based on leaves taken.
            </li>
            <li>
              <span className="font-bold text-slate-900">Final Payable:</span> The <span className="underline decoration-blue-200">actual amount</span> (Net Monthly Salary - Leave Deduction).
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm flex flex-col items-center justify-center gap-2">
          <p className="text-slate-500 italic text-center">
            Formula: <br />
            <span className="font-mono text-slate-700">Leave Deduction = ((Fixed Gross - Fixed Deductions) / 30) * Leaves</span>
          </p>
          <p className="text-slate-500 italic text-center">
            <span className="font-mono text-slate-700">Final Payable = Net Monthly Salary - Leave Deduction</span>
          </p>
        </div>
      </div>

      {!isLocked && (
        <div className="panel animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="mb-4 text-lg font-bold text-slate-800 border-b pb-2">
            Setup {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year} Payroll
          </h3>
          <div className="space-y-4">
            {employees.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-bold text-slate-900">{e.name}</p>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{e.id.substring(0, 8)}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="input-label">Leaves Taken</label>
                    <input
                      type="number"
                      min={0}
                      max={31}
                      className="w-full"
                      value={leaves[e.id] ?? 0}
                      onChange={(ev) => setLeaves((prev) => ({ ...prev, [e.id]: Number(ev.target.value) }))}
                    />
                  </div>

                  {variableComponents.length > 0 ? (
                    variableComponents.map((component) => (
                      <div key={component.id}>
                        <label className="input-label">
                          {component.name} ({component.type})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full"
                          value={variableAdjustments[e.id]?.[component.id] ?? 0}
                          onChange={(ev) =>
                            setVariableAdjustments((prev) => ({
                              ...prev,
                              [e.id]: { ...(prev[e.id] ?? {}), [component.id]: Number(ev.target.value) }
                            }))
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                      No variable components configured.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-sm font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 btn-primary py-3 text-base font-bold"
              disabled={loading}
              onClick={async () => {
                setError('');
                setLoading(true);
                const res = await fetch('/api/admin/payroll/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ year, month, leavesByEmployee: leaves, variableByEmployee: variableAdjustments })
                });
                const data = await res.json();
                setLoading(false);
                if (!res.ok) setError(data.error || 'Preview failed');
                else setPreview(data);
              }}
            >
              {loading ? 'Processing...' : 'Generate Preview'}
            </button>

            <button
              className="flex-1 btn-success py-3 text-base font-bold disabled:bg-slate-300"
              disabled={!preview || loading}
              onClick={async () => {
                if (!confirm(`Submit payroll for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}? This will lock the month and generate payslips.`)) return;
                setLoading(true);
                const res = await fetch('/api/admin/payroll/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ year, month, leavesByEmployee: leaves, variableByEmployee: variableAdjustments })
                });
                if (!res.ok) {
                  const data = await res.json();
                  showToast(data.error || 'Submit failed', 'error');
                } else {
                  showToast('Payroll submitted successfully!', 'success');
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
            >
              Submit & Lock Month
            </button>
          </div>
        </div>
      )}

      {isLocked && submittedData && (
        <div className="panel animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Payroll Report - {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
              </h3>
              <p className="text-sm text-slate-500 italic">This month is locked and submitted</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={handleExport} className="flex-1 md:flex-none btn-primary bg-indigo-600 hover:bg-indigo-700">
                Export to Excel (CSV)
              </button>
              <button
                className="flex-1 md:flex-none btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={async () => {
                  if (!confirm('Reopen this payroll cycle? This will unlock the month for editing.')) return;
                  const res = await fetch('/api/admin/payroll/reopen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year, month })
                  });
                  if (res.ok) {
                    showToast('Payroll reopened.', 'success');
                    setTimeout(() => window.location.reload(), 500);
                  } else {
                    const data = await res.json();
                    showToast(data.error || 'Reopen failed', 'error');
                  }
                }}
              >
                Reopen Month
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3 text-center">Leaves</th>
                  <th className="p-3 text-right">Gross</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right">Net Monthly Salary</th>
                  <th className="p-3 text-right text-rose-600">Leave Deduction</th>
                  <th className="p-3 text-right text-blue-700">Final Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submittedData.entries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900 border-r">
                      {entry.employee.name}
                      <div className="text-[10px] text-slate-400">{entry.employee.employeeCode || entry.employee.id}</div>
                    </td>
                    <td className="p-3 text-slate-600 border-r">{entry.employee.designation || '-'}</td>
                    <td className="p-3 text-center border-r font-bold">{entry.leaves}</td>
                    <td className="p-3 text-right font-mono border-r">₹{Number(entry.grossEarnings).toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-600 border-r">₹{Number(entry.totalDeductions).toLocaleString()}</td>
                    <td className="p-3 text-right font-bold border-r">₹{Number(entry.netMonthlySalary).toLocaleString()}</td>
                    <td className="p-3 text-right font-bold border-r text-rose-600">₹{Math.round(Number(entry.netMonthlySalary) - Number(entry.finalPayable)).toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-blue-700 bg-blue-50/50">₹{Number(entry.finalPayable).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && !isLocked && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {preview && !isLocked && (
        <div className="panel animate-in zoom-in-95 duration-500 border-2 border-blue-100">
          <h3 className="mb-4 text-lg font-bold text-blue-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">i</span>
            Pre-submit Review Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preview.rows.map((r: any) => (
              <div key={r.employee.id} className="rounded-xl border border-blue-50 p-4 bg-white shadow-sm ring-1 ring-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{r.employee.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{r.employee.designation || 'Staff'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 rounded">{r.employee.employeeCode || 'DNA'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3 pt-2 border-t border-slate-50 text-[11px]">
                  <div className="flex justify-between text-slate-500"><span>Leaves:</span> <span className="font-bold text-slate-700">{r.leaves}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Work Days:</span> <span className="font-bold text-slate-700">{r.workingDays}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Gross:</span> <span className="font-bold text-slate-700">₹{Number(r.grossEarnings).toFixed(0)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Deduct:</span> <span className="font-bold text-rose-600">₹{Number(r.totalDeductions).toFixed(0)}</span></div>
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t border-blue-50">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400 uppercase">Net Monthly Salary</span>
                    <span className="font-bold text-slate-600">₹{Number(r.netMonthlySalary).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-rose-400 uppercase">Leave Deduction</span>
                    <span className="font-bold text-rose-600">₹{Math.round(Number(r.netMonthlySalary) - Number(r.finalPayable)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Final Payable</span>
                    <span className="text-base font-black text-blue-600">₹{Number(r.finalPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
