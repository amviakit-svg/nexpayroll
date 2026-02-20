'use client';

import React, { useState } from 'react';

interface Stats {
    totalEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    pendingLeaves: number;
    companyTitle?: string;
}

interface UserNode {
    id: string;
    name: string;
    email?: string;
    designation?: string | null;
    photoUrl?: string | null;
    isClient?: boolean;
    children: UserNode[];
}

export default function DashboardClient({ initialStats, initialHierarchy }: { initialStats: Stats, initialHierarchy: UserNode[] }) {
    // Expand EVERYTHING by default for maximum transparency
    const getAllIds = (nodes: UserNode[]): Record<string, boolean> => {
        let ids: Record<string, boolean> = {};
        nodes.forEach(node => {
            ids[node.id] = true;
            if (node.children) {
                const childIds = getAllIds(node.children);
                ids = { ...ids, ...childIds };
            }
        });
        return ids;
    };

    const initialExpanded = {
        'root-company': true,
        ...getAllIds(initialHierarchy)
    };

    const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);
    const companyTitle = initialStats.companyTitle || 'NexPayroll';

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderNode = (node: UserNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.id];

        if (node.isClient) {
            return (
                <div key={node.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => toggleExpand(node.id)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all font-bold text-xs"
                        >
                            {isExpanded ? '−' : '+'}
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            Client: {node.name}
                        </span>
                    </div>
                    {isExpanded && (
                        <div className="ml-2 border-l-2 border-blue-50/50">
                            {node.children.map(child => renderNode(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={node.id} className="ml-6 border-l border-slate-200 pl-4 py-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpand(node.id)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                            {isExpanded ? '−' : '+'}
                        </button>
                    )}
                    {!hasChildren && <div className="w-5" />}

                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 group-hover:border-blue-300 transition-all">
                        {node.photoUrl ? (
                            <img src={node.photoUrl} alt={node.name} className="w-full h-full object-cover" />
                        ) : (
                            node.name.charAt(0)
                        )}
                    </div>

                    <div>
                        <div className="font-semibold text-slate-800">{node.name}</div>
                        <div className="text-xs text-slate-500">{node.designation || 'Specialized Staff'}</div>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Total Employees</div>
                        <div className="text-2xl font-bold text-slate-800">{initialStats.totalEmployees}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Present Today</div>
                        <div className="text-2xl font-bold text-slate-800">{initialStats.presentToday}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">On Leave Today</div>
                        <div className="text-2xl font-bold text-slate-800">{initialStats.onLeaveToday}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M10 13l2 2 4-4" /></svg>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Pending Leaves</div>
                        <div className="text-2xl font-bold text-slate-800">{initialStats.pendingLeaves}</div>
                    </div>
                </div>
            </div>

            {/* Hierarchy Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8" /><path d="m16 6-4 4-4-4" /><rect width="8" height="4" x="8" y="10" rx="1" /><path d="M12 14v4" /><path d="m16 18-4 4-4-4" /><rect width="8" height="4" x="8" y="20" rx="1" /></svg>
                    Organizational Hierarchy
                </h2>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 max-h-[600px] overflow-auto">
                    {/* Root Company Node - Styled Light Blue */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 shadow-md mb-6 sticky top-0 z-10 transition-all hover:shadow-lg">
                        <button
                            onClick={() => toggleExpand('root-company')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all font-black text-lg shadow-sm"
                        >
                            {expanded['root-company'] ? '−' : '+'}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">
                            {companyTitle.charAt(0)}
                        </div>
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.3em] text-blue-500 font-black">Parent Organization</div>
                            <div className="text-sm font-black text-blue-900 tracking-tight">{companyTitle}</div>
                        </div>
                    </div>

                    {expanded['root-company'] && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            {initialHierarchy.length > 0 ? (
                                initialHierarchy.map(node => (
                                    <div key={node.id} className="mb-4">
                                        {renderNode(node)}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-sm font-medium">No parent-child links found.</p>
                                    <p className="text-[10px] uppercase tracking-widest mt-1">Please ensure managers are assigned in Employee Directory.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
