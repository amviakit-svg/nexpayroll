'use server';

import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function changePasswordAction(formData: FormData) {
    // Using allowPasswordChange to prevent infinite redirect loops on the same auth action
    const session = await requireAuth({ allowPasswordChange: true });
    if (!session.user.requiresPasswordChange) return { error: 'No password change required' };

    const password = String(formData.get('password'));

    // Validate password
    if (password.length < 8) return { error: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { error: 'Password must contain an uppercase letter' };
    if (!/[a-z]/.test(password)) return { error: 'Password must contain a lowercase letter' };
    if (!/[0-9]/.test(password)) return { error: 'Password must contain a number' };
    if (!/[^A-Za-z0-9]/.test(password)) return { error: 'Password must contain a special character' };

    const hash = await bcrypt.hash(password, 10);

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: hash,
                requiresPasswordChange: false
            }
        });
    } catch (err) {
        console.error(err);
        return { error: 'Failed to update password. System error.' };
    }

    // Force re-fetch on auth routes
    revalidatePath('/force-change-password');
    // On success, we need to instruct the user to log in again since their session object
    // currently has `requiresPasswordChange: true`. Redirecting to /api/auth/signout will clear session.
    // However, they can just be redirected to login which NextAuth handles nicely. We will sign them out via next-auth
    // Or we redirect to a success route which forces logout on the client.

    // Instead of forcing logout, Next.js allows updating the session cookie, but NextAuth makes that slightly complex
    // from a server action without a JWT route. 
    // The easiest robust way is just redirecting to login to re-authenticate with the new password.
    redirect('/api/auth/signout?callbackUrl=/login?message=Password+updated.+Please+log+in+again.');
}
