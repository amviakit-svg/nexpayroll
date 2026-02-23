'use client';
import BulkUpload from '@/components/BulkUpload';

export default function BulkAssignmentsPage() {
  const template = `Full Name,Employee Code,Designation,Client / Dept,Email Address*,Basic Salary,Conveyance Allowance,HRA,Statutory Bonus,Employee PF Contribution,Professional Tax,TDS,Test Deduction
John Doe,EMP001,Developer,Sales,john@example.com,45000,2000,18000,3000,1800,200,5000,0`;

  return (
    <div className="space-y-6">
      <div className="panel bg-blue-50 border-blue-100 p-6 rounded-2xl">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Bulk Fixed Salary Assignments</h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Update salary structures in bulk. The columns (excluding `email`) should match the <strong>Component Names</strong> exactly.
          You can add any active fixed earning or deduction component as a column.
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
