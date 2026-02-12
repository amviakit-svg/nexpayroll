'use client';
import BulkUpload from '@/components/BulkUpload';

export default function BulkAssignmentsPage() {
  const template = `email,component,amount
john@example.com,Basic Salary,50000
john@example.com,HRA,25000`;

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bulk Import Fixed Assignments</h1>
        <BulkUpload 
            endpoint="/api/admin/bulk-upload/assignments" 
            title="Upload CSV" 
            template={template} 
        />
    </div>
  );
}
