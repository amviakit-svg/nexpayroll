'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin/employees', label: 'Employees', icon: '👤' },
    { href: '/admin/components', label: 'Salary Structure', icon: '🛠️' },
    { href: '/admin/assignments', label: 'Assignments', icon: '📝' },
    { href: '/admin/payroll', label: 'Payroll', icon: '💰' },
    { href: '/admin/leaves', label: 'Leaves', icon: '📅' },
    { href: '/admin/attendance', label: 'Attendance', icon: '🕒' },
    { href: '/admin/form-master', label: 'Form Master', icon: '🏗️' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' }
];

export default function AdminSidebar({ appName }: { appName: string }) {
    const pathname = usePathname();

    return (
        <aside className="panel hidden h-fit w-64 shrink-0 md:block border-slate-100">
            <div className="mb-10 px-3">
                <p className="text-2xl tracking-tighter text-blue-800 font-normal">{appName}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300 mt-1">Admin Portal</p>
            </div>

            <nav className="space-y-1.5">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm transition-all duration-300 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                        >
                            <span className="text-lg opacity-80">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
