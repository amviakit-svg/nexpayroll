import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { requireAdmin } from '@/lib/session';
import { APP_NAME } from '@/lib/brand';

const nav = [
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/components', label: 'Components' },
  { href: '/admin/assignments', label: 'Assignments' },
  { href: '/admin/payroll', label: 'Payroll' },
  { href: '/admin/leaves', label: 'Leaves' }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 p-4 md:p-6">
      <aside className="panel hidden h-fit w-64 shrink-0 md:block">
        <p className="text-base font-semibold">{APP_NAME}</p>
        <p className="mb-4 text-sm text-slate-500">Admin workspace</p>
        <nav className="space-y-2 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 space-y-6">
        <div className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-semibold">{session.user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Administrator</p>
            <SignOutButton />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
