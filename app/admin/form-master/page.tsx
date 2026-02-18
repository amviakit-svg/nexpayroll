import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function addSection(formData: FormData) {
    'use server';
    await requireAdmin();
    const name = String(formData.get('name')).trim();
    const identifier = name.toLowerCase().replace(/\s+/g, '_');

    if (!name) return;

    await prisma.formSection.create({
        data: { name, identifier, order: 0 }
    });

    revalidatePath('/admin/form-master');
}

async function updateSection(formData: FormData) {
    'use server';
    await requireAdmin();
    const id = String(formData.get('id'));
    const name = String(formData.get('name')).trim();
    const isVisible = formData.get('isVisible') === 'on';

    await prisma.formSection.update({
        where: { id },
        data: { name, isVisible }
    });

    revalidatePath('/admin/form-master');
    revalidatePath('/admin/employees');
}

async function deleteSection(formData: FormData) {
    'use server';
    await requireAdmin();
    const id = String(formData.get('id'));
    await prisma.formSection.delete({ where: { id } });
    revalidatePath('/admin/form-master');
    revalidatePath('/admin/employees');
}

export default async function FormMasterPage() {
    await requireAdmin();

    let sections = await prisma.formSection.findMany({
        orderBy: { order: 'asc' }
    });

    if (sections.length === 0) {
        await prisma.formSection.createMany({
            data: [
                { name: 'Basic Credentials', identifier: 'basic', order: 1 },
                { name: 'Client & Role', identifier: 'client', order: 2 },
                { name: 'Compliance Details', identifier: 'compliance', order: 3 },
                { name: 'Financial Records', identifier: 'bank', order: 4 },
            ]
        });
        sections = await prisma.formSection.findMany({ orderBy: { order: 'asc' } });
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in pb-24">
            {/* Dynamic Header with Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/employees" className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all" title="Back to Directory">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Form Architect</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">Master Layout & Visibility Controls</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Create Control Segment */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="panel bg-white border-2 border-slate-900/5 shadow-2xl rounded-[2.5rem] p-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 pb-4 border-b border-slate-50 italic">Draft New Segment</h2>
                        <form action={addSection} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Header Display Label</label>
                                <input
                                    name="name"
                                    placeholder="e.g., Compliance"
                                    required
                                    className="input w-full bg-slate-50 focus:bg-white border-transparent focus:border-slate-200 transition-all font-bold text-sm h-12 rounded-xl"
                                />
                            </div>
                            <button className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all">
                                Add Section Header
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-white/50">Instructional Tip</h3>
                        <p className="text-[11px] font-bold leading-relaxed italic">Changes made here are global. Toggling visibility will instantly update both the <span className="underline decoration-white/20">Add User</span> form and the <span className="underline decoration-white/20">Personnel Hub</span>.</p>
                    </div>
                </div>

                {/* Section List & Explicit Edit Logic */}
                <div className="lg:col-span-3 space-y-4">
                    {sections.map(s => (
                        <div key={s.id} className="panel bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 group hover:border-slate-300 transition-all relative overflow-hidden">
                            <form action={updateSection} className="flex flex-col md:flex-row items-center gap-8">
                                <input type="hidden" name="id" value={s.id} />

                                <div className="flex-1 w-full space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 italic">Segment Identity</label>
                                    </div>
                                    <input
                                        name="name"
                                        defaultValue={s.name}
                                        spellCheck={false}
                                        className="w-full text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 selection:bg-slate-200"
                                        placeholder="Enter Section Name"
                                    />
                                    <div className="text-[9px] font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        Mapping ID: {s.identifier}
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 shrink-0 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${s.isVisible ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {s.isVisible ? 'Public' : 'Hidden'}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                                            <input type="checkbox" name="isVisible" defaultChecked={s.isVisible} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="h-12 px-6 rounded-xl bg-slate-50 border border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2 group-hover:bg-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            Apply Edit
                                        </button>

                                        <button
                                            formAction={deleteSection}
                                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-transparent hover:border-rose-200"
                                            title="Terminate Segment"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Accented border for active segments */}
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${s.isVisible ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
