'use client';

import { useState, useEffect } from 'react';
import { format, isAfter, subHours } from 'date-fns';
import { useToast } from '@/components/ToastProvider';

interface Document {
    id: string;
    name: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    sharedAt: string;
    uploader: { name: string };
}

export default function EmployeeWorkspaceClient() {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'sharedAt', direction: 'desc' });

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employee/workspace');
            if (res.ok) setDocuments(await res.json());
        } catch (err) {
            showToast('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📕';
        if (type.includes('image')) return '🖼️';
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📗';
        if (type.includes('word') || type.includes('document')) return '📘';
        return '📄';
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortData = <T extends any>(data: T[], key: string, direction: 'asc' | 'desc') => {
        return [...data].sort((a, b) => {
            let valA: any = a[key as keyof T];
            let valB: any = b[key as keyof T];

            if (key === 'fileType') {
                valA = a.fileType || '';
                valB = b.fileType || '';
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const sortedDocs = sortData(filteredDocs, sortConfig.key, sortConfig.direction);
    const recentThreshold = subHours(new Date(), 48);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xl">📂</span>
                    <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">My Workspace</h2>
                </div>
                <div className="relative w-full md:w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search shared files..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-slate-100 text-sm focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Shared Data</p>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="panel border-dashed border-2 border-slate-200 p-20 flex flex-col items-center text-center rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 opacity-40">📭</div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No shared documents</p>
                    <p className="text-xs text-slate-400 mt-2">Documents shared by HR or Admin will appear here.</p>
                </div>
            ) : (
                <div className="panel bg-white border-slate-100 rounded-3xl overflow-hidden shadow-sm ring-1 ring-slate-100 mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/20">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('fileType')}>
                                        Type {sortConfig.key === 'fileType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('name')}>
                                        Document Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('fileSize')}>
                                        Size {sortConfig.key === 'fileSize' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('sharedAt')}>
                                        Shared At {sortConfig.key === 'sharedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sortedDocs.map(doc => {
                                    const isNew = isAfter(new Date(doc.sharedAt), recentThreshold);
                                    return (
                                        <tr key={doc.id} className="group hover:bg-white transition-all duration-300">
                                            <td className="px-6 py-5 text-center relative">
                                                <span className="text-3xl">{getFileIcon(doc.fileType)}</span>
                                                {isNew && (
                                                    <span className="absolute top-4 right-4 h-2 w-2 bg-orange-500 rounded-full animate-pulse"></span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        {doc.name}
                                                        {isNew && <span className="text-[8px] font-black text-white bg-orange-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 items-center flex gap-1">
                                                        <span className="text-[14px]">👤</span> Shared by {doc.uploader.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-[11px] font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                    {formatSize(doc.fileSize)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center whitespace-nowrap">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(doc.sharedAt), 'dd MMM yyyy, hh:mm a')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setPreviewDoc(doc)}
                                                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                                    >
                                                        <span>👁️</span> View
                                                    </button>
                                                    <a
                                                        href={`/api/workspace/download/${doc.id}`}
                                                        className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                        title="Download"
                                                    >
                                                        <span>📥</span>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
                    <div className="bg-white w-full h-full max-w-6xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100">
                                    {getFileIcon(previewDoc.fileType)}
                                </div>
                                <div className="max-w-[200px] md:max-w-md">
                                    <h3 className="font-black text-slate-900 text-lg tracking-tight truncate">{previewDoc.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatSize(previewDoc.fileSize)} • {previewDoc.fileType}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/api/workspace/download/${previewDoc.id}`}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    title="Download"
                                >
                                    📥 Download
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 overflow-hidden relative">
                            {previewDoc.fileType.includes('image') ? (
                                <div className="absolute inset-0 flex items-center justify-center p-10">
                                    <img
                                        src={`/api/workspace/download/${previewDoc.id}?preview=true`}
                                        alt={previewDoc.name}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={`/api/workspace/download/${previewDoc.id}?preview=true`}
                                    className="w-full h-full border-none bg-white font-bold text-center"
                                    title="File Preview"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
