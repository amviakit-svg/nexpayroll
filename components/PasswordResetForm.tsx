'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { resetEmployeePassword } from '@/app/employee/profile/actions';

export default function PasswordResetForm() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('password', password);
            const result = await resetEmployeePassword(formData);
            if (result?.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Password updated successfully', 'success');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            showToast('Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel bg-white border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Security Update
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input w-full h-12 bg-slate-50 border-slate-100 focus:border-blue-200 focus:bg-white transition-all text-sm rounded-xl px-4"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input w-full h-12 bg-slate-50 border-slate-100 focus:border-blue-200 focus:bg-white transition-all text-sm rounded-xl px-4"
                    />
                </div>
                <button
                    disabled={loading}
                    className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-slate-900 border-none hover:bg-black transition-all shadow-lg"
                >
                    {loading ? 'Processing...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}
