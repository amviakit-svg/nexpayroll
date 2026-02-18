'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast } from './ToastProvider';

function ToastHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();

    useEffect(() => {
        const success = searchParams.get('success');
        const message = searchParams.get('message');

        if (success === 'true' || message) {
            showToast(message || 'Details saved successfully!', 'success');

            // Clean up the URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('success');
            params.delete('message');
            const newQuery = params.toString() ? `?${params.toString()}` : '';
            router.replace(`${pathname}${newQuery}`);
        }
    }, [searchParams, pathname, router, showToast]);

    return null;
}

export default function AutoToast() {
    return (
        <Suspense fallback={null}>
            <ToastHandler />
        </Suspense>
    );
}
