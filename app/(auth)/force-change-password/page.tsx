import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import ForceChangePasswordForm from './ForceChangePasswordForm';

export default async function ForceChangePasswordPage() {
    // Pass allowPasswordChange to prevent infinite redirect
    const session = await requireAuth({ allowPasswordChange: true });

    // If the user doesn't need to change their password, send them to the dashboard
    if (!session.user.requiresPasswordChange) {
        if (session.user.role === 'ADMIN') redirect('/admin/dashboard');
        else redirect('/employee/payslips');
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <ForceChangePasswordForm />
        </div>
    );
}
