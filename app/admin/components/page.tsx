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

    const maxSort = await prisma.salaryComponent.findFirst({
      where: { type },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    await prisma.salaryComponent.create({
      data: {
        name,
        type,
        isVariable,
        sortOrder: (maxSort?.sortOrder ?? 0) + 1
      }
    });
    revalidatePath('/admin/components');
  } catch (error) {
    console.error('[addComponent] Error:', error);
    throw error;
  }
  redirect('/admin/components?success=true&message=Component added successfully');
}

async function reorderComponent(id: string, direction: 'up' | 'down') {
  'use server';
  try {
    console.log(`[reorderComponent] Moving ${id} ${direction}`);
    await requireAdmin();
    const current = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!current) {
      console.log(`[reorderComponent] Component ${id} not found`);
      return;
    }

    const other = await prisma.salaryComponent.findFirst({
      where: {
        type: current.type,
        sortOrder: direction === 'up' ? { lt: current.sortOrder } : { gt: current.sortOrder }
      },
      orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' }
    });

    if (other) {
      console.log(`[reorderComponent] Swapping ${current.name}(${current.sortOrder}) with ${other.name}(${other.sortOrder})`);
      await prisma.$transaction([
        prisma.salaryComponent.update({ where: { id: current.id }, data: { sortOrder: other.sortOrder } }),
        prisma.salaryComponent.update({ where: { id: other.id }, data: { sortOrder: current.sortOrder } })
      ]);
      revalidatePath('/admin/components');
      console.log(`[reorderComponent] Swap successful`);
    } else {
      console.log(`[reorderComponent] No adjacent component found for ${direction}`);
    }
  } catch (error) {
    console.error('[reorderComponent] Error:', error);
  }
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
  const components = await prisma.salaryComponent.findMany({
    orderBy: [
      { type: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  const earnings = components.filter(c => c.type === 'EARNING');
  const deductions = components.filter(c => c.type === 'DEDUCTION');

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Section */}
        <div className="panel">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-emerald-700">Earnings Components</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-50 px-3 py-1 rounded-full">Section A</span>
          </div>
          <div className="space-y-4">
            {earnings.map((c, index) => (
              <div key={c.id} className="group rounded-2xl border border-slate-100 p-5 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <form className="flex gap-2">
                    <button
                      formAction={reorderComponent.bind(null, c.id, 'up')}
                      className={`p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors ${index === 0 ? 'invisible' : ''}`}
                      title="Move Up"
                    >↑</button>
                    <button
                      formAction={reorderComponent.bind(null, c.id, 'down')}
                      className={`p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors ${index === earnings.length - 1 ? 'invisible' : ''}`}
                      title="Move Down"
                    >↓</button>
                  </form>
                  <form action={toggleComponent}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="isActive" value={String(c.isActive)} />
                    <button className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${c.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </form>
                </div>
                <form action={updateComponent} className="grid grid-cols-1 gap-4">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="type" value={c.type} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Name</label>
                    <input name="name" defaultValue={c.name} required className="w-full font-bold text-slate-800" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isVariable" defaultChecked={c.isVariable} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">Variable / Adjustment</span>
                    </label>
                    <button className="text-xs font-black text-emerald-600 hover:underline uppercase tracking-widest">Update Item</button>
                  </div>
                </form>
              </div>
            ))}
            {earnings.length === 0 && <p className="text-slate-400 text-sm italic py-4 text-center">No earnings configured.</p>}
          </div>
        </div>

        {/* Deductions Section */}
        <div className="panel">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-700">Deductions Components</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-50 px-3 py-1 rounded-full">Section B</span>
          </div>
          <div className="space-y-4">
            {deductions.map((c, index) => (
              <div key={c.id} className="group rounded-2xl border border-slate-100 p-5 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-50/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <form className="flex gap-2">
                    <button
                      formAction={reorderComponent.bind(null, c.id, 'up')}
                      className={`p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors ${index === 0 ? 'invisible' : ''}`}
                      title="Move Up"
                    >↑</button>
                    <button
                      formAction={reorderComponent.bind(null, c.id, 'down')}
                      className={`p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors ${index === deductions.length - 1 ? 'invisible' : ''}`}
                      title="Move Down"
                    >↓</button>
                  </form>
                  <form action={toggleComponent}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="isActive" value={String(c.isActive)} />
                    <button className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${c.isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </form>
                </div>
                <form action={updateComponent} className="grid grid-cols-1 gap-4">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="type" value={c.type} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Name</label>
                    <input name="name" defaultValue={c.name} required className="w-full font-bold text-slate-800" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isVariable" defaultChecked={c.isVariable} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                      <span className="text-xs font-bold text-slate-600">Variable / Adjustment</span>
                    </label>
                    <button className="text-xs font-black text-amber-600 hover:underline uppercase tracking-widest">Update Item</button>
                  </div>
                </form>
              </div>
            ))}
            {deductions.length === 0 && <p className="text-slate-400 text-sm italic py-4 text-center">No deductions configured.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
