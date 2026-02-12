'use client';
import BulkUpload from '@/components/BulkUpload';

export default function BulkEmployeesPage() {
  const template = `name,email,role,managerEmail,pan,designation,pfNumber,employeeCode,bankName,accountNumber,ifscCode,dateOfJoining
John Doe,john@example.com,EMPLOYEE,,ABCDE1234F,Developer,PF123,EMP001,HDFC,1234567890,HDFC0001234,2023-01-01`;

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
