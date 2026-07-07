'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function SignInPanel() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/account` },
    });
    setState(error ? 'error' : 'sent');
  };

  const google = async () => {
    await supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/account` },
    });
  };

  if (state === 'sent') {
    return (
      <div className="card mt-6 p-6 text-center">
        <p className="text-3xl" aria-hidden>📬</p>
        <p className="mt-2 font-semibold">Check your inbox</p>
        <p className="mt-1 text-sm text-stone-500">We sent a magic link to {email}.</p>
      </div>
    );
  }

  return (
    <div className="card mt-6 p-6">
      <form onSubmit={magicLink} className="space-y-3">
        <label htmlFor="auth-email" className="block text-sm font-medium">Email</label>
        <input
          id="auth-email"
          type="email"
          required
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full" disabled={state === 'busy'}>
          {state === 'busy' ? 'Sending…' : 'Email me a magic link'}
        </button>
        {state === 'error' && <p className="text-sm text-red-500">Couldn&apos;t send the link — try again.</p>}
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" /> or <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>
      <button onClick={google} className="btn-secondary w-full">Continue with Google</button>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      className="btn-secondary"
      onClick={async () => {
        await supabase().auth.signOut();
        location.href = '/';
      }}
    >
      Sign out
    </button>
  );
}
