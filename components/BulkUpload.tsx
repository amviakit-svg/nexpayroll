'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BulkUpload({ endpoint, title, template }: { endpoint: string, title: string, template: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(`Upload complete. Success: ${data.results.length}, Errors: ${data.errors.length}`);
        setLogs(data.errors);
        if (data.results.length > 0) {
            router.refresh();
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Upload failed');
    }
  };

  const downloadTemplate = () => {
     // Create a blob and download it
     const blob = new Blob([template], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'template.csv';
     a.click();
  };

  return (
    <div className="panel max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <div className="mb-6">
        <p className="mb-2 text-sm text-slate-600">Download the CSV template to get started:</p>
        <button onClick={downloadTemplate} className="btn-secondary text-sm">Download Template</button>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-700">Upload CSV</label>
        <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button 
        onClick={handleUpload} 
        disabled={!file || status === 'uploading'}
        className="btn-primary w-full"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload'}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded ${status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 border rounded p-3 bg-slate-50 max-h-60 overflow-y-auto">
            <h3 className="font-semibold text-red-600 text-sm mb-2">Errors:</h3>
            <ul className="list-disc pl-5 text-xs text-red-500">
                {logs.map((l, i) => (
                    <li key={i}>{JSON.stringify(l)}</li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}
