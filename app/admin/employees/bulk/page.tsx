'use client';
import BulkUpload from '@/components/BulkUpload';

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
    <div className="space-y-6">
      <div className="panel flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bulk Import Employees</h1>
        <button onClick={handleDownload} className="btn-secondary">Download Template</button>
      </div>
      <BulkUpload
        endpoint="/api/admin/bulk-upload/employees"
        title="Upload CSV"
        template={template}
      />
    </div>
  );
}
