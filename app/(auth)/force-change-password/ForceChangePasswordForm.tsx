'use client';

import { useState } from 'react';
import { changePasswordAction } from './actions';
import { APP_NAME } from '@/lib/brand';

export default function ForceChangePasswordForm() {
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const fd = new FormData();
        fd.append('password', password);

        const res = await changePasswordAction(fd);
        if (res?.error) {
            setError(res.error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm panel p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white mb-4 shadow-lg shadow-blue-100 font-bold text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Update</h1>
                <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest leading-relaxed">
                    Please secure your {APP_NAME} account<br />with a new password
                </p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-rose-50 border border-rose-100 p-4 animate-in shake">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full bg-rose-500"></div>
                        <p className="text-xs text-rose-600 font-medium">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                    <input
                        type="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input w-full h-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-200 transition-all text-sm rounded-xl px-4 font-medium"
                        placeholder="••••••••"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                    <input
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="input w-full h-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-200 transition-all text-sm rounded-xl px-4 font-medium"
                        placeholder="••••••••"
                    />
                </div>

                <div className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Minimum 8 characters long</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                    </ul>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full h-14 rounded-xl text-xs uppercase tracking-widest mt-6 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Securing Account...' : 'Set Secure Password'}
                </button>
            </form>
        </div>
    );
}
