'use client';

import { useMemo, useState } from 'react';

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
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [leaves, setLeaves] = useState<Record<string, number>>({});
  const [variableAdjustments, setVariableAdjustments] = useState<VariableMap>({});
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const key = `${year}-${month}`;
  const isLocked = useMemo(() => lockedMonths.includes(key), [lockedMonths, key]);

  return (
    <div className="space-y-4">
      <div className="panel grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="input-label">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} />
        </div>
        <div>
          <label className="input-label">Month</label>
          <input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} min={1} max={12} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Status: <span className="font-medium text-slate-900">{isLocked ? 'LOCKED (submitted)' : 'Open'}</span>
        </div>
      </div>

      <div className="panel">
        <h3 className="mb-3">Leaves and Variable pay/adjustment</h3>
        <div className="space-y-3">
          {employees.map((e) => (
            <div key={e.id} className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 font-medium">{e.name}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="input-label">Leaves</label>
                  <input
                    disabled={isLocked}
                    type="number"
                    min={0}
                    max={30}
                    value={leaves[e.id] ?? 0}
                    onChange={(ev) => setLeaves((prev) => ({ ...prev, [e.id]: Number(ev.target.value) }))}
                  />
                </div>

                {variableComponents.length > 0 ? (
                  <div className="space-y-2">
                    {variableComponents.map((component) => (
                      <div key={component.id}>
                        <label className="input-label">
                          {component.name} ({component.type}) — Variable pay/adjustment
                        </label>
                        <input
                          disabled={isLocked}
                          type="number"
                          step="0.01"
                          value={variableAdjustments[e.id]?.[component.id] ?? 0}
                          onChange={(ev) =>
                            setVariableAdjustments((prev) => ({
                              ...prev,
                              [e.id]: { ...(prev[e.id] ?? {}), [component.id]: Number(ev.target.value) }
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                    No variable components configured.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button
          className="btn-primary"
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
          {loading ? 'Loading...' : 'Preview payroll'}
        </button>

        <button
          className="btn-success"
          disabled={isLocked || !preview}
          onClick={async () => {
            if (!confirm('Submit payroll? This will lock the month.')) return;
            const res = await fetch('/api/admin/payroll/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ year, month, leavesByEmployee: leaves, variableByEmployee: variableAdjustments })
            });
            const data = await res.json();
            if (!res.ok) setError(data.error || 'Submit failed');
            else {
              alert('Payroll submitted and locked.');
              window.location.reload();
            }
          }}
        >
          Submit & lock month
        </button>
      </div>

      {preview && (
        <div className="panel">
          <h3 className="mb-3">Pre-submit Review Summary</h3>
          <div className="space-y-2 text-sm">
            {preview.rows.map((r: any) => (
              <div key={r.employee.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium">{r.employee.name}</p>
                <p>Leaves: {r.leaves}, Working days: {r.workingDays}</p>
                <p>
                  Fixed earnings: {Number(r.fixedEarnings).toFixed(2)} | Variable earnings: {Number(r.variableEarnings).toFixed(2)}
                </p>
                <p>
                  Fixed deductions: {Number(r.fixedDeductions).toFixed(2)} | Variable deductions: {Number(r.variableDeductions).toFixed(2)}
                </p>
                <p className="font-medium">Net monthly: {Number(r.netMonthlySalary).toFixed(2)}</p>
                <p className="font-semibold">Final payable: {Number(r.finalPayable).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
