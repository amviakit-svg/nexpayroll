'use client';

import { useState } from 'react';

type ICardProps = {
    user: {
        name: string;
        employeeCode: string | null;
        designation: string | null;
        department: string | null;
        dateOfJoining: Date | null | string;
        photoUrl: string | null;
        pfNumber: string | null;
        pan: string | null;
    };
    company: {
        companyName: string;
        companyAddress: string | null;
        companyLogoUrl: string | null;
    };
};

export default function EmployeeICard({ user, company }: ICardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            <style jsx>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
            `}</style>

            <div
                className={`relative w-72 h-[450px] transition-all duration-700 [transform-style:preserve-3d] cursor-pointer perspective-1000 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 ring-1 ring-slate-200">
                    <div className="h-20 bg-white flex items-center justify-center p-4 relative overflow-hidden border-b border-slate-50">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-600/5 rounded-full -ml-8 -mb-8 blur-xl"></div>
                        {company.companyLogoUrl ? (
                            <img src={company.companyLogoUrl} alt="Logo" className="h-10 object-contain relative z-10" />
                        ) : (
                            <span className="text-slate-900 font-black text-xl tracking-tighter relative z-10">{company.companyName}</span>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-center pt-8 px-6 text-center">
                        <div className="h-32 w-32 rounded-2xl border-4 border-slate-50 shadow-inner overflow-hidden mb-6 bg-slate-50 flex items-center justify-center ring-1 ring-slate-100">
                            {user.photoUrl ? (
                                <img src={user.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-5xl opacity-20">👤</span>
                            )}
                        </div>

                        <div className="space-y-1 mb-6">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{user.name}</h2>
                            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.25em]">{user.designation || 'EMPLOYEE'}</p>
                        </div>

                        <div className="w-full space-y-4 text-left border-t border-slate-100 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Employee ID</p>
                                    <p className="font-bold text-slate-800 text-sm tracking-tight">{user.employeeCode || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Joined</p>
                                    <p className="font-bold text-slate-700 text-xs">
                                        {user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Department</p>
                                <p className="font-bold text-slate-700 text-xs uppercase tracking-tight">{user.department || 'GENERAL'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <div className="flex gap-1">
                            {[1, 1, 1, 1, 1].map((_, i) => <div key={i} className="w-4 h-0.5 bg-slate-200"></div>)}
                        </div>
                    </div>
                    <div className="h-2 bg-blue-600"></div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 [transform:rotateY(180deg)]">
                    <div className="h-2 bg-blue-600"></div>
                    <div className="p-8 flex-1 flex flex-col text-center">
                        <div className="flex-1 flex flex-col justify-center space-y-8">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    This identity card is the property of <br />
                                    <span className="text-slate-800 font-bold">{company.companyName}</span>. <br />
                                    It must be produced on demand by authorized personnel.
                                    Unauthorized use is strictly prohibited.
                                </p>
                                <p className="text-[9px] text-slate-400 italic">
                                    If found, please return to the office address mentioned below.
                                </p>
                            </div>

                            <div className="py-6 border-y border-slate-200 bg-white/50 rounded-xl px-2">
                                <div className="mb-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-blue-200">Office Address</p>
                                    <p className="text-[10px] text-slate-600 font-bold leading-tight line-clamp-2">{company.companyAddress || 'N/A'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PF No.</p>
                                        <p className="text-[10px] text-slate-700 font-bold">{user.pfNumber || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN No.</p>
                                        <p className="text-[10px] text-slate-700 font-bold tracking-tight">{user.pan || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col items-center">
                            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 mb-2">
                                {company.companyLogoUrl ? (
                                    <img src={company.companyLogoUrl} alt="Logo" className="h-6 object-contain opacity-40 grayscale" />
                                ) : (
                                    <span className="text-slate-300 font-black text-xs tracking-tighter">{company.companyName}</span>
                                )}
                            </div>
                            <p className="text-[8px] text-slate-400 uppercase tracking-widest">© NexPayroll Secured System</p>
                        </div>
                    </div>
                    <div className="h-6 bg-slate-900"></div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Click to Flip I-Card</p>
                    <div className="flex gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-colors ${!isFlipped ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className={`w-2 h-2 rounded-full transition-colors ${isFlipped ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    </div>
                </div>

                <a
                    href="/api/employee/icard/download"
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 flex items-center gap-2"
                >
                    <span>🖨️</span> Download High-Res ID
                </a>
            </div>
        </div>
    );
}
