'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function createEmployee(formData: FormData) {
    await requireAdmin();
    const name = String(formData.get('name') || '');
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const role = String(formData.get('role') || 'EMPLOYEE') as 'ADMIN' | 'EMPLOYEE';
    const managerId = String(formData.get('managerId') || '') || null;

    const pan = String(formData.get('pan') || '') || null;
    const dateOfJoining = formData.get('dateOfJoining') ? new Date(String(formData.get('dateOfJoining'))) : null;
    const designation = String(formData.get('designation') || '') || null;
    const pfNumber = String(formData.get('pfNumber') || '') || null;
    const employeeCode = String(formData.get('employeeCode') || '') || null;
    const bankName = String(formData.get('bankName') || '') || null;
    const accountNumber = String(formData.get('accountNumber') || '') || null;
    const ifscCode = String(formData.get('ifscCode') || '') || null;
    const department = String(formData.get('department') || '') || null;

    if (!name || !email || !password) return;
    const hash = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                name, email, passwordHash: hash, role,
                managerId, pan, dateOfJoining, designation,
                pfNumber, employeeCode, bankName, accountNumber, ifscCode,
                department, requiresPasswordChange: true
            }
        });
    } catch (error) {
        console.error('Failed to create user:', error);
        return { error: 'Failed to create user' };
    }
    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/employee/profile');
    redirect('/admin/employees?success=true&message=User created successfully');
}

export async function toggleActive(formData: FormData) {
    await requireAdmin();
    const id = String(formData.get('id'));
    const isActive = String(formData.get('isActive')) === 'true';
    await prisma.user.update({ where: { id }, data: { isActive: !isActive } });
    revalidatePath('/admin/employees');
}

export async function resetPassword(formData: FormData) {
    await requireAdmin();
    const id = String(formData.get('id'));
    const newPassword = String(formData.get('newPassword'));
    if (!newPassword) return;
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash: hash, requiresPasswordChange: true } });
    revalidatePath('/admin/employees');
}

export async function editEmployee(formData: FormData) {
    await requireAdmin();
    const id = String(formData.get('id'));
    const name = String(formData.get('name'));
    const email = String(formData.get('email'));
    const role = String(formData.get('role')) as 'ADMIN' | 'EMPLOYEE';
    const managerId = String(formData.get('managerId') || '') || null;

    const pan = String(formData.get('pan') || '') || null;
    const dateOfJoining = formData.get('dateOfJoining') ? new Date(String(formData.get('dateOfJoining'))) : null;
    const designation = String(formData.get('designation') || '') || null;
    const pfNumber = String(formData.get('pfNumber') || '') || null;
    const employeeCode = String(formData.get('employeeCode') || '') || null;
    const bankName = String(formData.get('bankName') || '') || null;
    const accountNumber = String(formData.get('accountNumber') || '') || null;
    const ifscCode = String(formData.get('ifscCode') || '') || null;
    const department = String(formData.get('department') || '') || null;

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name, email, role,
                managerId, pan, dateOfJoining, designation,
                pfNumber, employeeCode, bankName, accountNumber, ifscCode,
                department
            }
        });
    } catch (error) {
        console.error('Failed to update user:', error);
        return { error: 'Failed to update user' };
    }

    revalidatePath('/admin/employees');
    revalidatePath('/admin/dashboard');
    revalidatePath('/employee/profile');
    redirect('/admin/employees?success=true&message=User details updated');
}
