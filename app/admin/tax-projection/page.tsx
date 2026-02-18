import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// --- Server Actions ---

async function addProjectionRow(formData: FormData) {
    'use server';
    await requireAdmin();
    const label = String(formData.get('label')).trim();
    const formula = String(formData.get('formula')).trim();
    const order = Number(formData.get('order')) || 0;

    if (!label) return;

    await (prisma as any).taxProjectionRow.create({
        data: { label, formula, order }
    });

    revalidatePath('/admin/tax-projection');
    redirect('/admin/tax-projection?success=true&message=Projection row added');
}

async function deleteProjectionRow(formData: FormData) {
    'use server';
    await requireAdmin();
    const id = String(formData.get('id'));
    await (prisma as any).taxProjectionRow.delete({ where: { id } });
    revalidatePath('/admin/tax-projection');
    redirect('/admin/tax-projection?success=true&message=Projection row deleted');
}

// --- Main Page Component ---

export default async function TaxProjectionPage() {
    await requireAdmin();

    let rows = [];
    try {
        const model = (prisma as any).taxProjectionRow;
        if (model) {
            rows = await model.findMany({ orderBy: { order: 'asc' } });
        }
    } catch (e) {
        console.error("Error fetching projection rows", e);
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/assignments" className="w-12 h-12 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all shadow-sm" title="Back to Assignments">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl tracking-tighter text-blue-900 font-normal">Tax Projection Config</h1>
                        <p className="text-sm font-medium text-slate-400">Define the logic for Annual Tax Projection rows.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="panel bg-white border border-slate-100 shadow-sm md:col-span-1">
                    <h2 className="text-xs uppercase tracking-[0.3em] text-blue-400 mb-8">Add Projection Row</h2>
                    <form action={addProjectionRow} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Row Label</label>
                            <input
                                name="label"
                                placeholder="e.g. Net Taxable Income"
                                required
                                className="input w-full bg-slate-50 border-slate-100 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Sort Order</label>
                            <input
                                name="order"
                                type="number"
                                placeholder="0"
                                required
                                className="input w-full bg-slate-50 border-slate-100 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Formula</label>
                            <textarea
                                name="formula"
                                placeholder="Use {Label Name} variables. e.g. {Annual Gross} - {Standard Deduction}"
                                required
                                className="input w-full bg-slate-50 border-slate-100 focus:bg-white min-h-[100px] pt-3 font-mono text-xs"
                            />
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                Use <b>{'{Label}'}</b> to reference other rows.
                            </p>
                        </div>
                        <button className="btn-primary w-full h-14 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-blue-50">
                            Add Rule
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="panel bg-white border border-slate-100 shadow-sm md:col-span-2">
                    <h2 className="text-xs uppercase tracking-[0.3em] text-blue-400 mb-8">Projection Rules</h2>
                    <div className="overflow-hidden rounded-2xl border border-slate-50">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-blue-50 text-[10px] uppercase tracking-widest text-blue-400 border-b border-blue-50">
                                <tr>
                                    <th className="px-5 py-5 w-14">#</th>
                                    <th className="px-5 py-5">Label</th>
                                    <th className="px-5 py-5">Formula Logic</th>
                                    <th className="px-5 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-5 py-5 text-blue-400">{row.order}</td>
                                        <td className="px-5 py-5 text-slate-900">{row.label}</td>
                                        <td className="px-5 py-5">
                                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-100 inline-block uppercase tracking-tight">
                                                {row.formula}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 text-right">
                                            <form action={deleteProjectionRow}>
                                                <input type="hidden" name="id" value={row.id} />
                                                <button className="text-[10px] uppercase tracking-widest text-rose-500 hover:text-rose-700 p-2">
                                                    Delete
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">No projection rules defined.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
