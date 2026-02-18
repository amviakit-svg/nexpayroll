'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';

export default function AttendanceUpload() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/attendance/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Successfully processed records for ${data.count} employees.`, 'success');
                setFile(null);
                // Optionally refresh page or parent component
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch (err) {
            showToast('Error uploading file', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel space-y-4 shadow-md border-slate-100 bg-white">
            <div className="border-b pb-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span className="text-xl">📊</span> Attendance Synchronization
                </h3>
                <p className="text-xs text-slate-500">Upload the Excel report to segregate and distribute data year-wise & month-wise.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Excel File (.xls, .xlsx)</label>
                    <input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-xl p-1"
                    />
                </div>
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`btn-primary px-8 py-2.5 rounded-xl transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-blue-100 shadow-lg'}`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Processing...
                        </span>
                    ) : 'Sync Attendance'}
                </button>
            </div>
        </div>
    );
}
