'use client';

import { useState, useEffect } from 'react';

export default function MaintenancePage() {
    const [status, setStatus] = useState<any>(null);
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [syncCompleted, setSyncCompleted] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/system/deploy');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch system status');
        }
    };

    const runSync = async () => {
        if (!secret) return alert('Please enter the Deployment Secret Key');

        setLoading(true);
        setLogs([{ step: 'Initializing', details: 'Connecting to deployment bridge...', success: true }]);
        setSyncCompleted(false);

        try {
            const res = await fetch('/api/admin/system/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret })
            });

            const data = await res.json();

            if (data.results) {
                setLogs(data.results);
            }

            if (res.ok) {
                setSyncCompleted(true);
            } else {
                alert(data.error || 'Synchronization failed');
            }
        } catch (err) {
            alert('A network error occurred during synchronization');
        } finally {
            setLoading(false);
        }
    };

    if (!status) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Checking Environment</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl tracking-tighter text-slate-900 font-normal">Maintenance Hub</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">System & Synchronization</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Environment Info */}
                <div className="md:col-span-4 space-y-6">
                    <div className="panel bg-white border-slate-100 p-6 rounded-3xl shadow-sm ring-1 ring-slate-100 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Environment</p>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.isProduction
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status.isProduction ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                {status.isProduction ? 'Production' : 'Development'}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform</p>
                            <p className="text-sm font-bold text-slate-700 capitalize">{status.platform === 'win32' ? 'Windows' : 'Linux / Unix'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bridge Secret Status</p>
                            <p className={`text-sm font-bold ${status.hasSecret ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {status.hasSecret ? '✓ Configured' : '✗ Missing from .env'}
                            </p>
                        </div>
                    </div>

                    {!status.isProduction && (
                        <div className="panel bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 flex flex-col gap-4">
                            <h4 className="font-bold text-sm">Developer Mode</h4>
                            <p className="text-xs opacity-70 leading-relaxed font-medium">To migrate changes to production, remember to commit and push your code to Git first.</p>
                            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                <code className="text-[10px] block break-all text-blue-300">git push origin master</code>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Area */}
                <div className="md:col-span-8 space-y-6">
                    {status.isProduction ? (
                        <div className="panel bg-white border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-100">⚡</div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">One-Click Synchronization</h3>
                                    <p className="text-xs text-slate-500 font-medium italic">Pull latest features and apply database migrations safely.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deployment Secret Key</label>
                                    <input
                                        type="password"
                                        placeholder="Enter your system bridge secret"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        className="input w-full h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold"
                                    />
                                    <p className="text-[10px] text-slate-400 italic">This must match the DEPLOYMENT_SECRET set in your .env file.</p>
                                </div>

                                <button
                                    onClick={runSync}
                                    disabled={loading}
                                    className={`w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-4 ${loading
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-[0.98]'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><span>🚀</span> Trigger System Sync</>
                                    )}
                                </button>
                            </div>

                            {/* Logs console */}
                            {logs.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Execution Progress Log</p>
                                        {syncCompleted && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">✓ Complete</span>}
                                    </div>
                                    <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {logs.map((log, idx) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${log.success ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse'}`}></span>
                                                <div className="space-y-1">
                                                    <p className={`font-bold ${log.success ? 'text-white' : 'text-rose-400'}`}>{log.step}</p>
                                                    <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {log.details || 'Successfully completed.'}
                                                    </pre>
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="flex items-center gap-4 text-blue-400 animate-pulse">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                <p>Processing next step...</p>
                                            </div>
                                        )}
                                    </div>
                                    {syncCompleted && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold text-center">
                                            System is now up to date with the latest Dev version.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="panel bg-white border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center space-y-6">
                            <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl">🛠️</div>
                            <div>
                                <h3 className="font-black text-slate-900 text-lg">Local Development Bridge</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">This tool is in **Development Mode**. Direct synchronization is disabled on this system to prevent overwriting your local code. Use this portal on your **Production System** to pull changes FROM this machine.</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <a href="/admin/settings" className="btn-secondary py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center">Back to Settings</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
