import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { ComponentType } from '@prisma/client';
import { redirect } from 'next/navigation';

async function addComponent(formData: FormData) {
  'use server';
  try {
    await requireAdmin();
    const name = String(formData.get('name')).trim();
    const type = String(formData.get('type')) as ComponentType;
    const isVariable = formData.get('isVariable') === 'on';

    if (!name) return;

    await prisma.salaryComponent.create({
      data: { name, type, isVariable }
    });
    revalidatePath('/admin/components');
  } catch (error) {
    console.error('[addComponent] Error:', error);
    throw error;
  }
  redirect('/admin/components?success=true&message=Component added successfully');
}

async function updateComponent(formData: FormData) {
  'use server';
  try {
    await requireAdmin();
    const id = String(formData.get('id'));
    const name = String(formData.get('name')).trim();
    const type = String(formData.get('type')) as ComponentType;
    const isVariable = formData.get('isVariable') === 'on';

    await prisma.salaryComponent.update({
      where: { id },
      data: { name, type, isVariable }
    });
    revalidatePath('/admin/components');
  } catch (error) {
    console.error('[updateComponent] Error:', error);
    throw error;
  }
  redirect('/admin/components?success=true&message=Component updated');
}

async function toggleComponent(formData: FormData) {
  'use server';
  try {
    await requireAdmin();
    const id = String(formData.get('id'));
    const isActive = String(formData.get('isActive')) === 'true';

    await prisma.salaryComponent.update({
      where: { id },
      data: { isActive: !isActive }
    });
    revalidatePath('/admin/components');
  } catch (error) {
    console.error('[toggleComponent] Error:', error);
    throw error;
  }
  redirect('/admin/components?success=true&message=Status changed');
}

export default async function ComponentsPage() {
  await requireAdmin();
  const components = await prisma.salaryComponent.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="panel">
        <h2 className="mb-4">Create Salary Component</h2>
        <form action={addComponent} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input name="name" placeholder="Component name" required />
          <select name="type" defaultValue="EARNING">
            <option value="EARNING">Earning</option>
            <option value="DEDUCTION">Deduction</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
            <input type="checkbox" name="isVariable" className="h-4 w-4" />
            Variable pay/adjustment
          </label>
          <button className="btn-primary">Add</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4">Existing Components</h2>
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-4">
              <form action={updateComponent} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} required />
                <select name="type" defaultValue={c.type}>
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                  <input type="checkbox" name="isVariable" defaultChecked={c.isVariable} className="h-4 w-4" />
                  Variable pay/adjustment
                </label>
                <p className="self-center text-sm text-slate-600">{c.isActive ? 'Active' : 'Inactive'}</p>
                <button className="btn-success md:col-span-5">Save</button>
              </form>
              <form className="mt-3" action={toggleComponent}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="isActive" value={String(c.isActive)} />
                <button className="btn-warning">{c.isActive ? 'Deactivate' : 'Activate'}</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
