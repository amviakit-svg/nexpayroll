'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginForm() {
    const [error, setError] = useState('');

    return (
        <form
            className="space-y-4"
            onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const res = await signIn('credentials', {
                    email: String(form.get('email')),
                    password: String(form.get('password')),
                    redirect: false
                });
                if (res?.error) setError('Invalid credentials or inactive user');
                else window.location.href = '/';
            }}
        >
            <div>
                <label className="input-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <div>
                <label className="input-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="btn-primary w-full">Sign in</button>
        </form>
    );
}
