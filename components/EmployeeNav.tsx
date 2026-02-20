'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EmployeeNav({ directReportsCount }: { directReportsCount: number }) {
    const pathname = usePathname();

    const links = [
        { href: '/employee/profile', label: 'My Info' },
        { href: '/employee/payslips', label: 'Payslips' },
        { href: '/employee/leaves', label: 'Leaves' },
        { href: '/employee/attendance', label: 'Attendance' },
        { href: '/employee/workspace', label: 'Workspace' },
    ];

    return (
        <div className="flex gap-1 md:gap-4 items-center">
            {/* My Info - Forced First */}
            <Link
                href="/employee/profile"
                className={`px-3 py-2 transition-all duration-300 relative font-bold whitespace-nowrap ${pathname === '/employee/profile'
                    ? 'text-blue-600 font-black'
                    : 'text-slate-600 hover:text-blue-600'
                    }`}
            >
                My Info
                {pathname === '/employee/profile' && (
                    <span className="absolute bottom-[-16px] left-0 right-0 h-[6px] bg-blue-600 rounded-t-xl transition-all duration-300"></span>
                )}
            </Link>

            {/* My Team - Shown only for Managers */}
            {directReportsCount > 0 && (
                <Link
                    href="/employee/team"
                    className={`px-3 py-2 transition-all duration-300 relative font-bold whitespace-nowrap ${pathname.startsWith('/employee/team')
                        ? 'text-blue-600 font-black'
                        : 'text-slate-600 hover:text-blue-600'
                        }`}
                >
                    My Team
                    {pathname.startsWith('/employee/team') && (
                        <span className="absolute bottom-[-16px] left-0 right-0 h-[6px] bg-blue-600 rounded-t-xl transition-all duration-300"></span>
                    )}
                </Link>
            )}

            {/* Other Links */}
            {links.filter(l => l.href !== '/employee/profile').map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-2 transition-all duration-300 relative font-bold whitespace-nowrap ${isActive
                            ? 'text-blue-600 font-black'
                            : 'text-slate-600 hover:text-blue-600'
                            }`}
                    >
                        {link.label}
                        {isActive && (
                            <span className="absolute bottom-[-16px] left-0 right-0 h-[6px] bg-blue-600 rounded-t-xl transition-all duration-300"></span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
