import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPin } from '../auth';
import { TufLogo } from '../components/ui';
import type { AppUser } from '../types';

export function LoginPage({ setUser }: { setUser: (u: AppUser | null) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const user = loginWithPin(pin);
    if (!user) {
      setError('Invalid PIN');
      return;
    }
    setUser(user);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-tuf-texture p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900/70 p-8 text-center shadow-2xl backdrop-blur">
        <TufLogo />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="mt-8 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-center text-3xl tracking-[0.7em] text-cyan-200 focus:border-cyan-400 focus:outline-none"
          placeholder="0000"
        />
        <button className="mt-6 w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Enter
        </button>
        {error ? <p className="mt-3 text-xs text-slate-400">{error}</p> : <p className="mt-3 text-xs text-slate-500">4-digit PIN access</p>}
      </form>
    </div>
  );
}
