'use client';
import BulkUpload from '@/components/BulkUpload';
import Link from 'next/link';

export default function BulkAssignmentsPage() {
  const template = `Full Name,Employee Code,Designation,Client / Dept,Email Address*,Basic Salary,Conveyance Allowance,HRA,Statutory Bonus,Employee PF Contribution,Professional Tax,TDS,Test Deduction
John Doe,EMP001,Developer,Sales,john@example.com,45000,2000,18000,3000,1800,200,5000,0`;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-5">
        <Link href="/admin/assignments" className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 hover:shadow-md transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Bulk Structure Import</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Payroll Module / Batch Assignments</p>
        </div>
      </div>

      <div className="panel bg-blue-50 border-blue-100 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Instructions & Formatting</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Update fixed salary components for multiple employees at once. Ensure the CSV headers match your <strong>Salary Component Names</strong> exactly. Identification fields are provided for your reference.
        </p>
      </div>
      <BulkUpload
        endpoint="/api/admin/bulk-upload/assignments"
        title="Upload CSV Structure"
        template={template}
      />
    </div>
  );
}
