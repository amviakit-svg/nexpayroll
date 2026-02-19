import SignOutButton from '@/components/SignOutButton';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  if (session.user.role !== 'EMPLOYEE') redirect('/admin/employees');

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between panel">
        <div>
          <p className="text-sm text-slate-500">Employee Portal</p>
          <p className="font-semibold">{session.user.name}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/employee/profile" className="text-slate-600 hover:text-slate-900">My Info</Link>
          <Link href="/employee/payslips" className="text-slate-600 hover:text-slate-900">Payslips</Link>
          <Link href="/employee/leaves" className="text-slate-600 hover:text-slate-900">Leaves</Link>
          <Link href="/employee/attendance" className="text-slate-600 hover:text-slate-900 font-bold text-blue-600">Attendance</Link>
          <Link href="/employee/workspace" className="text-slate-600 hover:text-slate-900 font-bold text-orange-600">Workspace</Link>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
