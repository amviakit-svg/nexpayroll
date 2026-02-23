import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';

export async function requireAuth(options: { allowPasswordChange?: boolean } = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  if (session.user.requiresPasswordChange && !options.allowPasswordChange) {
    redirect('/force-change-password');
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') redirect('/employee/payslips');
  return session;
}
