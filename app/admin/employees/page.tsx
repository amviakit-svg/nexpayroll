import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function createEmployee(formData: FormData) {
  'use server';
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

  if (!name || !email || !password) return;
  const hash = await bcrypt.hash(password, 10);
  
  try {
    await prisma.user.create({ 
      data: { 
        name, email, passwordHash: hash, role,
        managerId, pan, dateOfJoining, designation,
        pfNumber, employeeCode, bankName, accountNumber, ifscCode
      } 
    });
  } catch (error) {
    console.error('Failed to create user:', error);
  }
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
  const managerId = String(formData.get('managerId') || '') || null;

  const pan = String(formData.get('pan') || '') || null;
  const dateOfJoining = formData.get('dateOfJoining') ? new Date(String(formData.get('dateOfJoining'))) : null;
  const designation = String(formData.get('designation') || '') || null;
  const pfNumber = String(formData.get('pfNumber') || '') || null;
  const employeeCode = String(formData.get('employeeCode') || '') || null;
  const bankName = String(formData.get('bankName') || '') || null;
  const accountNumber = String(formData.get('accountNumber') || '') || null;
  const ifscCode = String(formData.get('ifscCode') || '') || null;

  await prisma.user.update({ 
    where: { id }, 
    data: { 
      name, email, role,
      managerId, pan, dateOfJoining, designation,
      pfNumber, employeeCode, bankName, accountNumber, ifscCode
    } 
  });
  revalidatePath('/admin/employees');
}

export default async function EmployeesPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { manager: true } });
  
  // Potential managers are usually admins or other employees
  const potentialManagers = users.filter(u => u.isActive);

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add User</h2>
          <Link href="/admin/employees/bulk" className="btn-secondary text-sm">Bulk Upload CSV</Link>
        </div>
        
        <form action={createEmployee} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input name="name" placeholder="Name" required className="input" />
          <input name="email" type="email" placeholder="Email" required className="input" />
          <input name="password" type="text" placeholder="Password" required className="input" />
          <select name="role" defaultValue="EMPLOYEE" className="input">
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
          
          <select name="managerId" className="input">
            <option value="">Select Manager</option>
            {potentialManagers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
          <input name="designation" placeholder="Designation" className="input" />
          <input name="employeeCode" placeholder="Emp Code" className="input" />
          <input name="pan" placeholder="PAN" className="input" />
          
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Date of Joining</label>
            <input name="dateOfJoining" type="date" className="input" />
          </div>
          <input name="pfNumber" placeholder="PF Number" className="input" />
          
          <input name="bankName" placeholder="Bank Name" className="input" />
          <input name="accountNumber" placeholder="Account No." className="input" />
          <input name="ifscCode" placeholder="IFSC Code" className="input" />

          <button className="btn-primary md:col-span-4 mt-2">Create User</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4 text-xl font-bold">Users Directory</h2>
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
              <form action={editEmployee} className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-5">
                <input type="hidden" name="id" value={u.id} />
                
                <div className="col-span-full md:col-span-1">
                    <label className="text-xs font-semibold text-slate-500">Name</label>
                    <input name="name" defaultValue={u.name} required className="input w-full" />
                </div>
                <div className="col-span-full md:col-span-1">
                    <label className="text-xs font-semibold text-slate-500">Email</label>
                    <input name="email" type="email" defaultValue={u.email} required className="input w-full" />
                </div>
                <div className="col-span-full md:col-span-1">
                    <label className="text-xs font-semibold text-slate-500">Role</label>
                    <select name="role" defaultValue={u.role} className="input w-full">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                </div>
                 <div className="col-span-full md:col-span-1">
                    <label className="text-xs font-semibold text-slate-500">Manager</label>
                    <select name="managerId" defaultValue={u.managerId || ''} className="input w-full">
                        <option value="">None</option>
                        {potentialManagers.filter(m => m.id !== u.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                {/* Extended Details (Collapsible or just grid) */}
                <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-2 border-t pt-2 mt-2">
                    <input name="designation" defaultValue={u.designation || ''} placeholder="Designation" className="input-sm" />
                    <input name="employeeCode" defaultValue={u.employeeCode || ''} placeholder="Emp Code" className="input-sm" />
                    <input name="pan" defaultValue={u.pan || ''} placeholder="PAN" className="input-sm" />
                    <input name="pfNumber" defaultValue={u.pfNumber || ''} placeholder="PF No." className="input-sm" />
                    <input name="bankName" defaultValue={u.bankName || ''} placeholder="Bank" className="input-sm" />
                    <input name="accountNumber" defaultValue={u.accountNumber || ''} placeholder="Acc No." className="input-sm" />
                    <input name="ifscCode" defaultValue={u.ifscCode || ''} placeholder="IFSC" className="input-sm" />
                    <input name="dateOfJoining" type="date" defaultValue={u.dateOfJoining ? u.dateOfJoining.toISOString().split('T')[0] : ''} className="input-sm" />
                </div>

                <div className="col-span-full flex justify-between items-center mt-2">
                    <span className={`text-sm ${u.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="btn-success">Save Changes</button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap gap-2 border-t pt-2">
                <form action={toggleActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="isActive" value={String(u.isActive)} />
                  <button className="btn-warning text-xs">{u.isActive ? 'Deactivate' : 'Activate'}</button>
                </form>

                <form action={resetPassword} className="flex gap-2 items-center">
                  <input type="hidden" name="id" value={u.id} />
                  <input name="newPassword" placeholder="New password" required className="input-sm" />
                  <button className="btn-secondary text-xs">Reset Pwd</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
