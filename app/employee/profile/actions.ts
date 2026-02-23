'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function updateProfilePhoto(base64Photo: string) {
    const session = await requireAuth();

    await prisma.user.update({
        where: { id: session.user.id },
        data: { photoUrl: base64Photo }
    });

    revalidatePath('/employee/profile');
}

export async function resetEmployeePassword(formData: FormData) {
    const session = await requireAuth();
    const password = String(formData.get('password') || '');
    if (!password || password.length < 6) {
        return { error: 'Invalid password' };
    }

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(password, 10);

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: hash }
        });
        revalidatePath('/employee/profile');
        return { success: true };
    } catch (error) {
        console.error('Failed to reset password:', error);
        return { error: 'Failed to update password' };
    }
}
