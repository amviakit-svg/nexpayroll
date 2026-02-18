'use client';

import { useState } from 'react';
import { updateProfilePhoto } from '@/app/employee/profile/actions';

export default function PhotoUpload({ currentPhoto }: { currentPhoto?: string | null }) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple client side size check (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File is too large. Max 5MB allowed.');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                await updateProfilePhoto(base64);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 ring-1 ring-slate-200 group relative">
                {currentPhoto ? (
                    <img src={currentPhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl text-slate-300">👤</div>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
            <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 text-center min-w-[120px]">
                {uploading ? 'Processing...' : currentPhoto ? 'Change Photo' : 'Upload Photo'}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            </label>
            <p className="text-[10px] text-slate-400 font-medium">JPG, PNG allowed (Max 5MB)</p>
        </div>
    );
}
