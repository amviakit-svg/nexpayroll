import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import PhotoUpload from '@/components/PhotoUpload';
import EmployeeICard from '@/components/EmployeeICard';

export default async function ProfilePage() {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    const company = await prisma.tenantConfig.findFirst() || {
        companyName: 'NexPayroll',
        companyAddress: null,
        companyLogoUrl: null
    };

    if (!user) return <div>User not found</div>;

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
                {/* Left Side: General Info */}
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
                            companyName: company.companyName,
                            companyAddress: company.companyAddress,
                            companyLogoUrl: company.companyLogoUrl
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
