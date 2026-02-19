'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Organization Profile', href: '/admin/settings' },
        { name: 'Form Architect', href: '/admin/settings/form-master' },
        { name: 'Maintenance Hub', href: '/admin/settings/maintenance' }
    ];

    return (
        <div className="space-y-8 animate-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">System Settings</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Configure company profile and form architecture.</p>
                </div>
            </header>

            <div className="border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`px-6 py-4 text-sm font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-b-2 ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                                }`}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </div>

            <main>{children}</main>
        </div>
    );
}
