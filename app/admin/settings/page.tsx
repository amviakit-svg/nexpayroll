import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { redirect } from 'next/navigation';

async function updateConfig(formData: FormData) {
    'use server';
    await requireAdmin();

    const companyName = String(formData.get('companyName') || 'My Company');
    const companyAddress = String(formData.get('companyAddress') || '');
    const companyPan = String(formData.get('companyPan') || '');
    const watermarkEnabled = formData.get('watermarkEnabled') === 'on';
    const watermarkText = String(formData.get('watermarkText') || 'NexPayroll');
    const toolName = String(formData.get('toolName') || 'NexPayroll');
    const idleTimeoutMinutes = parseInt(String(formData.get('idleTimeoutMinutes') || '5'), 10);

    let companyLogoUrl = String(formData.get('existingLogoUrl') || '');

    // Handle File Upload
    const logoFile = formData.get('companyLogo') as File | null;
    if (logoFile && logoFile.size > 0) {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const fileName = `logo-${Date.now()}${path.extname(logoFile.name)}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        companyLogoUrl = `/uploads/${fileName}`;
    }

    const existing = await prisma.tenantConfig.findFirst();

    const data = {
        companyName,
        companyAddress,
        companyPan,
        companyLogoUrl,
        toolName,
        idleTimeoutMinutes,
        watermarkEnabled,
        watermarkText
    };

    if (existing) {
        await prisma.tenantConfig.update({
            where: { id: existing.id },
            data
        });
    } else {
        await prisma.tenantConfig.create({
            data
        });
    }

    revalidatePath('/admin/settings');
    redirect('/admin/settings?success=true&message=Organization settings updated');
}

export default async function SettingsPage() {
    await requireAdmin();
    const config = await prisma.tenantConfig.findFirst();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="panel bg-white border-2 border-slate-900/5 shadow-2xl rounded-[2.5rem] p-8">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 pb-4 border-b border-slate-50 italic">Organization Profile</h2>
                <p className="text-sm text-slate-500 mb-6"> This information will appear on all generated payslips.</p>

                <form action={updateConfig} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                        <input
                            name="companyName"
                            defaultValue={config?.companyName || ''}
                            placeholder="e.g., Amviak Consulting Pvt Ltd"
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company PAN</label>
                        <input
                            name="companyPan"
                            defaultValue={config?.companyPan || ''}
                            placeholder="ABCDE1234F"
                            className="input w-full uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Address</label>
                        <textarea
                            name="companyAddress"
                            defaultValue={config?.companyAddress || ''}
                            placeholder="Full registered address"
                            rows={3}
                            className="input w-full min-h-[80px] pt-3"
                        />
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Branding & PDF</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo</label>
                            {config?.companyLogoUrl && (
                                <div className="mb-2 p-2 border rounded-lg bg-white inline-block">
                                    <img src={config.companyLogoUrl} alt="Logo Preview" className="h-12 object-contain" />
                                </div>
                            )}
                            <input
                                type="file"
                                name="companyLogo"
                                accept="image/*"
                                className="input w-full p-1"
                            />
                            <input type="hidden" name="existingLogoUrl" value={config?.companyLogoUrl || ''} />
                            <p className="mt-1 text-xs text-slate-400 italic">Upload a PNG or JPG file. Recommended height: 200px.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Enable Payslip Watermark</p>
                                <p className="text-xs text-slate-500">Adds a diagonal background text to the PDF.</p>
                            </div>
                            <input
                                type="checkbox"
                                name="watermarkEnabled"
                                defaultChecked={config?.watermarkEnabled}
                                className="h-5 w-5 accent-slate-900 cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Watermark Text</label>
                            <input
                                name="watermarkText"
                                defaultValue={config?.watermarkText || 'NexPayroll'}
                                placeholder="NexPayroll"
                                className="input w-full"
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tool Name (Header Display)</label>
                            <input
                                name="toolName"
                                defaultValue={config?.toolName || 'NexPayroll'}
                                placeholder="e.g., Amviak Payroll"
                                className="input w-full"
                            />
                            <p className="mt-1 text-xs text-slate-400 italic">This will update the brand name shown in the sidebar and navigation.</p>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Idle Session Timeout (Minutes)</label>
                            <input
                                name="idleTimeoutMinutes"
                                type="number"
                                min="1"
                                max="1440"
                                defaultValue={config?.idleTimeoutMinutes ?? 5}
                                className="input w-full"
                            />
                            <p className="mt-1 text-xs text-slate-400 italic">Automatically logout users after this period of inactivity. Default is 5 minutes.</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button className="btn-primary w-full md:w-auto">Save Organization Settings</button>
                    </div>
                </form>
            </div>

            <div className="panel bg-blue-50 border-blue-100 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">System & Infrastructure</h2>
                    <p className="text-xs text-blue-700">Manage database backups, migrations, and system synchronization.</p>
                </div>
                <a href="/admin/settings/maintenance" className="whitespace-nowrap bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200">
                    Maintenance Hub
                </a>
            </div>
        </div>
    );
}
