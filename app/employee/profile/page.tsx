import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import PhotoUpload from '@/components/PhotoUpload';
import EmployeeICard from '@/components/EmployeeICard';

export default async function ProfilePage() {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            manager: {
                select: {
                    id: true,
                    name: true,
                    designation: true,
                    photoUrl: true,
                    managerId: true
                }
            }
        }
    });

    if (!user) return <div>User not found</div>;

    // Fetch Manager's Manager (Grand-manager)
    let grandManager = null;
    if (user.manager?.managerId) {
        grandManager = await prisma.user.findUnique({
            where: { id: user.manager.managerId },
            select: { id: true, name: true, designation: true, photoUrl: true }
        });
    }

    // Fetch Peers (Same manager, excluding self and manager themselves)
    const peers = user.managerId ? await prisma.user.findMany({
        where: {
            managerId: user.managerId,
            id: { notIn: [user.id, user.managerId] },
            isActive: true
        },
        select: { id: true, name: true, designation: true, photoUrl: true }
    }) : [];

    // Fetch Direct Reports (If user is a manager)
    const directReports = await prisma.user.findMany({
        where: {
            managerId: user.id,
            id: { not: user.managerId || undefined }, // Safety filter: Exclude own manager
            isActive: true
        },
        select: { id: true, name: true, designation: true, photoUrl: true }
    });

    const config = await prisma.tenantConfig.findFirst() || {
        companyName: 'NexPayroll',
        companyAddress: null,
        companyLogoUrl: null
    };

    const sections = [
        {
            title: 'Personal Info',
            fields: [
                { label: 'Full Name', value: user.name },
                { label: 'Corporate Email', value: user.email },
                { label: 'Designation', value: user.designation },
                { label: 'Department', value: user.department },
                { label: 'Date of Joining', value: user.dateOfJoining?.toLocaleDateString('en-IN') },
            ]
        },
        {
            title: 'Payroll & Tax IDs',
            fields: [
                { label: 'Employee Code', value: user.employeeCode },
                { label: 'PAN', value: user.pan },
                { label: 'EPF Number', value: user.pfNumber },
            ]
        },
        {
            title: 'Bank Details',
            fields: [
                { label: 'Primary Bank', value: user.bankName },
                { label: 'Account Number', value: user.accountNumber },
                { label: 'IFSC Code', value: user.ifscCode },
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="border-b border-slate-100 pb-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-sm text-slate-500 font-medium">Manage your professional identity and personal records.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: General Info & Team */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section) => (
                            <div key={section.title} className={`panel bg-white border-slate-100 p-6 rounded-3xl shadow-sm ${section.title === 'Personal Info' ? 'md:col-span-2' : ''}`}>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    {section.title}
                                </h2>
                                <div className={`grid gap-6 ${section.title === 'Personal Info' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                                    {section.fields.map((field) => (
                                        <div key={field.label} className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{field.label}</p>
                                            <p className="text-sm font-bold text-slate-800">{field.value || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Team & Hierarchy Section */}
                    <div className="panel bg-white border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-10">
                        <div>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                Organizational Hierarchy
                            </h2>

                            <div className="space-y-4">
                                {/* Root: Client / Company Name - Styled Light Blue */}
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 shadow-md mb-6 transition-all hover:shadow-lg">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">
                                        {config.companyName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-[0.3em] text-blue-500 font-black">Parent Organization</div>
                                        <div className="text-sm font-black text-blue-900 tracking-tight">{config.companyName}</div>
                                    </div>
                                </div>

                                {/* RESTORED: Full Management Chain */}
                                {grandManager && (
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 ml-6 relative">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                            {grandManager.photoUrl ? <img src={grandManager.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{grandManager.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Chain of Command</div>
                                            <div className="text-sm font-bold text-slate-800">{grandManager.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{grandManager.designation}</div>
                                        </div>
                                    </div>
                                )}

                                {user.manager && (
                                    <div className={`flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 ml-12 relative`}>
                                        <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                                            {user.manager.photoUrl ? <img src={user.manager.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold">{user.manager.name.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase tracking-widest text-blue-600 font-black">Reporting Manager</div>
                                            <div className="text-sm font-bold text-slate-800">{user.manager.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{user.manager.designation}</div>
                                        </div>
                                    </div>
                                )}

                                <div className={`flex items-center gap-4 p-5 bg-blue-600 rounded-2xl border border-blue-700 shadow-xl shadow-blue-100 ml-20 relative`}>
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md overflow-hidden flex-shrink-0 p-1">
                                        {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-black">{user.name.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-widest text-blue-100 font-black">Active Position</div>
                                        <div className="text-base font-black text-white">{user.name}</div>
                                        <div className="text-[10px] text-blue-50 font-medium">{user.designation}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {peers.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Team Members (Peers)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {peers.map(peer => (
                                        <div key={peer.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50 group hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-emerald-100 transition-all">
                                                {peer.photoUrl ? <img src={peer.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">{peer.name.charAt(0)}</div>}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">{peer.name}</div>
                                                <div className="text-[9px] text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{peer.designation}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {directReports.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    My Team
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {directReports.map(report => (
                                        <div key={report.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50 group hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-orange-100 transition-all">
                                                {report.photoUrl ? <img src={report.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">{report.name.charAt(0)}</div>}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">{report.name}</div>
                                                <div className="text-[9px] text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{report.designation}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="panel bg-amber-50 border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">ℹ️</span>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            <strong>Note:</strong> To maintain data integrity, some fields are read-only.
                            If you notice any discrepancies in your payroll or personal records, please reach out to the HR department.
                        </p>
                    </div>
                </div>

                {/* Right Side: I-Card & Photo */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="panel bg-white border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col items-center">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Profile Management</h3>
                        <PhotoUpload currentPhoto={user.photoUrl} />
                    </div>

                    <div className="flex flex-col items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            Digital ID Card
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">Verified</span>
                        </h3>
                        <EmployeeICard user={{
                            name: user.name,
                            employeeCode: user.employeeCode,
                            designation: user.designation,
                            department: user.department,
                            dateOfJoining: user.dateOfJoining as any,
                            photoUrl: user.photoUrl,
                            pfNumber: user.pfNumber,
                            pan: user.pan
                        }} company={{
                            companyName: config.companyName,
                            companyAddress: config.companyAddress,
                            companyLogoUrl: config.companyLogoUrl
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
