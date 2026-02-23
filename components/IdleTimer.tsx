'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

interface IdleTimerProps {
    timeoutMinutes: number;
}

export default function IdleTimer({ timeoutMinutes }: IdleTimerProps) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            signOut({ callbackUrl: '/login?message=Session expired due to inactivity' });
        }, timeoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        // Initial start
        resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeoutMinutes]);

    return null;
}
