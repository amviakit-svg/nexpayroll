import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await requireAuth();
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard');
  redirect('/employee/profile');
}
