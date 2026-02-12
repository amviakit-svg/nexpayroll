import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function createEmployee(formData: FormData) {
  'use server';
  await requireAdmin();
  const name = String(formData.get('name') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const role = String(formData.get('role') || 'EMPLOYEE') as 'ADMIN' | 'EMPLOYEE';

  if (!name || !email || !password) return;
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash: hash, role } });
  revalidatePath('/admin/employees');
}

async function toggleActive(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const isActive = String(formData.get('isActive')) === 'true';
  await prisma.user.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath('/admin/employees');
}

async function resetPassword(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const newPassword = String(formData.get('newPassword'));
  if (!newPassword) return;
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } });
  revalidatePath('/admin/employees');
}

async function editEmployee(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id'));
  const name = String(formData.get('name'));
  const email = String(formData.get('email'));
  const role = String(formData.get('role')) as 'ADMIN' | 'EMPLOYEE';
  await prisma.user.update({ where: { id }, data: { name, email, role } });
  revalidatePath('/admin/employees');
}

export default async function EmployeesPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="panel">
        <h2 className="mb-4">Add User (Admin/Employee)</h2>
        <form action={createEmployee} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="text" placeholder="Temporary password" required />
          <select name="role" defaultValue="EMPLOYEE">
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="btn-primary md:col-span-4">Create user</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4">Users</h2>
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-slate-200 p-4">
              <form action={editEmployee} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input type="hidden" name="id" value={u.id} />
                <input name="name" defaultValue={u.name} required />
                <input name="email" type="email" defaultValue={u.email} required />
                <select name="role" defaultValue={u.role}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="self-center text-sm text-slate-600">Status: {u.isActive ? 'Active' : 'Inactive'}</p>
                <button className="btn-success md:col-span-5">Save</button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <form action={toggleActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="isActive" value={String(u.isActive)} />
                  <button className="btn-warning">{u.isActive ? 'Deactivate' : 'Activate'}</button>
                </form>

                <form action={resetPassword} className="flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input name="newPassword" placeholder="New password" required />
                  <button className="btn-secondary">Reset password</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
