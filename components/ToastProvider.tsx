'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              animate-in fade-in slide-in-from-top-4 duration-300
              px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3
              pointer-events-auto min-w-[300px] justify-center text-center
              ${toast.type === 'success' ? 'bg-slate-900 border-slate-800 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-600 border-red-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-600 border-blue-500 text-white' : ''}
            `}
                    >
                        {toast.type === 'success' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                        <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Helper to trigger toast from anywhere (including non-React code if needed, but primarily for Server Actions feedback)
// For Server Actions, we'll use a Client Component wrapper that checks for query params or state.
