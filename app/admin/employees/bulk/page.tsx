'use client';
import BulkUpload from '@/components/BulkUpload';
import Link from 'next/link';

export default function BulkEmployeesPage() {
  const template = `Full Name*,Email Address*,Initial Password*,System Role,Designation,Employee Code,Client / Dept,Reporting Manager Email,Join Date,PAN Card,PF Number,Bank Name,Account No,IFSC Code
John Doe,john@example.com,Password@123,EMPLOYEE,Developer,EMP001,Sales,manager@example.com,2023-01-01,ABCDE1234F,PF123,HDFC,1234567890,HDFC0001234`;

  const handleDownload = () => {
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees-template.csv';
    a.click();
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-5">
        <Link href="/admin/employees" className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 hover:shadow-md transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Bulk Import Personnel</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Directory / Batch Operations</p>
        </div>
      </div>

      <div className="panel flex flex-col md:flex-row justify-between items-center gap-4 bg-blue-50/30 border-blue-100">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Ready to upload?</h2>
          <p className="text-xs text-slate-500">Ensure your CSV strictly follows the required format.</p>
        </div>
        <button onClick={handleDownload} className="btn-secondary h-11 px-8 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-lg shadow-slate-100/50">Download Template</button>
      </div>
      <BulkUpload
        endpoint="/api/admin/bulk-upload/employees"
        title="Upload CSV"
        template={template}
      />
    </div>
  );
}
