import SignOutButton from '@/components/SignOutButton';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { APP_NAME } from '@/lib/brand';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  if (session.user.role !== 'EMPLOYEE') redirect('/admin/employees');

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div className="panel flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{APP_NAME}</p>
          <p className="font-semibold">{session.user.name}</p>
        </div>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
