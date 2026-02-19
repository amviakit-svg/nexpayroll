'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ToastProvider';

interface Employee {
    id: string;
    name: string;
    employeeCode: string | null;
}

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    _count?: { documents: number; children: number };
}

interface Document {
    id: string;
    name: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    folderId: string | null;
    createdAt: string;
    shares: { userId: string }[];
}

export default function AdminWorkspaceClient({ employees }: { employees: Employee[] }) {
    const { showToast } = useToast();
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [path, setPath] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Root' }]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingItem, setEditingItem] = useState<{ id: string, name: string, type: 'folder' | 'file' } | null>(null);
    const [sharingDoc, setSharingDoc] = useState<Document | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchWorkspace();
    }, [currentFolder]);

    const fetchWorkspace = async () => {
        setLoading(true);
        try {
            const [fRes, dRes] = await Promise.all([
                fetch(`/api/admin/workspace/folders?parentId=${currentFolder || ''}`),
                fetch(`/api/admin/workspace/documents?folderId=${currentFolder || 'root'}`)
            ]);
            if (fRes.ok) setFolders(await fRes.json());
            if (dRes.ok) setDocuments(await dRes.json());
        } catch (err) {
            showToast('Failed to load workspace');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch('/api/admin/workspace/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName, parentId: currentFolder })
            });
            if (res.ok) {
                showToast('Folder created');
                setNewFolderName('');
                setShowFolderModal(false);
                fetchWorkspace();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to create folder');
            }
        } catch (err) {
            showToast('Error creating folder');
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showToast('File size exceeds 10MB limit');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) formData.append('folderId', currentFolder);

        try {
            const res = await fetch('/api/admin/workspace/documents', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                showToast('File uploaded');
                fetchWorkspace();
            } else {
                showToast('Upload failed');
            }
        } catch (err) {
            showToast('Error uploading file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, type: 'folder' | 'file') => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const res = await fetch(`/api/admin/workspace/${type === 'folder' ? 'folders' : 'documents'}/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast(`${type === 'folder' ? 'Folder' : 'File'} deleted`);
                fetchWorkspace();
            }
        } catch (err) {
            showToast('Delete failed');
        }
    };

    const handleRename = async () => {
        if (!editingItem) return;
        try {
            const res = await fetch(`/api/admin/workspace/${editingItem.type === 'folder' ? 'folders' : 'documents'}/${editingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingItem.name })
            });
            if (res.ok) {
                showToast('Renamed successfully');
                setEditingItem(null);
                fetchWorkspace();
            }
        } catch (err) {
            showToast('Rename failed');
        }
    };

    const handleShareToggle = async (empId: string, docId: string, currentlyShared: boolean) => {
        try {
            const res = await fetch('/api/admin/workspace/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: docId,
                    userId: empId,
                    action: currentlyShared ? 'unshare' : 'share'
                })
            });
            if (res.ok) {
                setDocuments(docs => docs.map(d => {
                    if (d.id === docId) {
                        const newShares = currentlyShared
                            ? d.shares.filter(s => s.userId !== empId)
                            : [...d.shares, { userId: empId }];
                        return { ...d, shares: newShares };
                    }
                    return d;
                }));
                if (sharingDoc?.id === docId) {
                    const newShares = currentlyShared
                        ? sharingDoc.shares.filter(s => s.userId !== empId)
                        : [...sharingDoc.shares, { userId: empId }];
                    setSharingDoc({ ...sharingDoc, shares: newShares });
                }
            }
        } catch (err) {
            showToast('Failed to update share status');
        }
    };

    const navigateTo = (id: string | null, name: string) => {
        if (id === currentFolder) return;
        setCurrentFolder(id);
        if (id === null) {
            setPath([{ id: null, name: 'Root' }]);
        } else {
            const newPath = [...path];
            const idx = newPath.findIndex(p => p.id === id);
            if (idx !== -1) {
                setPath(newPath.slice(0, idx + 1));
            } else {
                setPath([...newPath, { id, name }]);
            }
        }
    };

    const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold overflow-x-auto py-2 w-full md:w-auto">
                    {path.map((p, i) => (
                        <div key={p.id || 'root'} className="flex items-center gap-2 shrink-0">
                            {i > 0 && <span className="text-slate-300">/</span>}
                            <button
                                onClick={() => navigateTo(p.id, p.name)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${currentFolder === p.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p.id === null ? '🏠 Workspace' : p.name}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search files/folders..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFolderModal(true)}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shrink-0"
                    >
                        <span>📁</span> New Folder
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                        {uploading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>📤</span>}
                        Upload File
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleUploadFile} className="hidden" />
                </div>
            </div>

            {loading ? (
                <div className="panel flex flex-col items-center justify-center p-20 space-y-4 border-slate-100">
                    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Drive</p>
                </div>
            ) : (filteredFolders.length === 0 && filteredDocs.length === 0) ? (
                <div className="panel border-dashed border-2 border-slate-200 p-20 flex flex-col items-center text-center rounded-[2rem]">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 opacity-40">📂</div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Workspace is Empty</p>
                    <p className="text-xs text-slate-400 mt-2">Create a folder or upload documents to get started.</p>
                </div>
            ) : (
                <div className="panel bg-white border-slate-100 rounded-3xl overflow-hidden shadow-sm ring-1 ring-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">Icon</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredFolders.map(folder => (
                                    <tr
                                        key={folder.id}
                                        className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                                        onClick={() => navigateTo(folder.id, folder.name)}
                                    >
                                        <td className="px-6 py-4 text-2xl text-center">📁</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{folder.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {(folder._count?.children || 0) + (folder._count?.documents || 0)} Items
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">--</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">Folder</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingItem({ id: folder.id, name: folder.name, type: 'folder' }); }}
                                                    className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                    title="Rename"
                                                >✏️</button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }}
                                                    className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id} className="group hover:bg-emerald-50/20 transition-colors">
                                        <td className="px-6 py-4 text-2xl relative text-center">
                                            {getFileIcon(doc.fileType)}
                                            {doc.shares.length > 0 && (
                                                <span className="absolute top-3 right-4 h-3 w-3 bg-blue-500 border-2 border-white rounded-full shadow-sm" title="Shared"></span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">
                                                {doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {formatSize(doc.fileSize)}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                            {format(new Date(doc.createdAt), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSharingDoc(doc)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-50"
                                                >Share</button>
                                                <button
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                    title="Preview"
                                                >👁️</button>
                                                <a
                                                    href={`/api/workspace/download/${doc.id}`}
                                                    className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                                                    title="Download"
                                                >📥</a>
                                                <button
                                                    onClick={() => setEditingItem({ id: doc.id, name: doc.name, type: 'file' })}
                                                    className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Rename"
                                                >✏️</button>
                                                <button
                                                    onClick={() => handleDelete(doc.id, 'file')}
                                                    className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete"
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">New Folder</h3>
                            <button onClick={() => setShowFolderModal(false)} className="text-slate-300 hover:text-slate-500 text-2xl">×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folder Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full rounded-xl border-slate-200 text-sm font-bold py-3"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">Cancel</button>
                                <button onClick={handleCreateFolder} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-100">Create Folder</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Rename {editingItem.type}</h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-300 hover:text-slate-500 text-2xl">×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full rounded-xl border-slate-200 text-sm font-bold py-3"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">Cancel</button>
                                <button onClick={handleRename} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-100">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sharing Modal */}
            {sharingDoc && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">🤝</div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Share Document</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest truncate max-w-[200px]">{sharingDoc.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setSharingDoc(null)} className="text-slate-300 hover:text-slate-500 text-2xl">×</button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-2 mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Employees to Shared with</p>
                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {employees.map(emp => {
                                        const isShared = sharingDoc.shares.some(s => s.userId === emp.id);
                                        return (
                                            <div key={emp.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-none">{emp.name}</p>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase mt-1 tracking-widest">{emp.employeeCode || 'No Code'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleShareToggle(emp.id, sharingDoc.id, isShared)}
                                                    className={`h-6 w-11 rounded-full relative transition-colors ${isShared ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${isShared ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const unsharedEmps = employees.filter(e => !sharingDoc.shares.some(s => s.userId === e.id));
                                        unsharedEmps.forEach(e => handleShareToggle(e.id, sharingDoc.id, false));
                                    }}
                                    className="flex-1 py-3 rounded-xl text-xs font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    Share with All
                                </button>
                                <button
                                    onClick={() => setSharingDoc(null)}
                                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
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
