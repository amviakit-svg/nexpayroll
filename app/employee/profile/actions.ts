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
