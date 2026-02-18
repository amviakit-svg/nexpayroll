import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import Link from 'next/link';

export default async function EmployeeTaxPage({ params }: { params: { id: string } }) {
    await requireAdmin();
    const employee = await prisma.user.findUnique({ where: { id: params.id } });
    if (!employee) return <div>Employee not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/admin/assignments" className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-400 hover:text-white hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg transition-all active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl tracking-tighter text-blue-900 font-normal">Tax Management</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60 italic">{employee.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Master Config Card */}
                <div className="panel bg-white border-2 border-blue-50 shadow-xl shadow-blue-100/30 rounded-[2rem] p-8 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center mb-8 shadow-lg shadow-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
                        </div>
                        <h2 className="text-xl tracking-tight text-blue-900 mb-2">Tax Projection Master</h2>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">
                            Configure global formulas and row labels that appear on the Annual Tax Projection section of all payslips.
                        </p>
                    </div>
                    <Link
                        href="/admin/tax-projection"
                        className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center text-[10px] uppercase tracking-widest shadow-xl shadow-blue-50"
                    >
                        Configure Rules
                    </Link>
                </div>

                {/* Coming Soon / Placeholder for Individual Declarations */}
                <div className="panel bg-blue-50/20 border-2 border-dashed border-blue-100 rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-200 flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <h3 className="text-sm uppercase tracking-[0.2em] text-blue-300">Individual Declarations</h3>
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-tight mt-3 opacity-40 italic">Removed as per request</p>
                </div>
            </div>
        </div>
    );
}
