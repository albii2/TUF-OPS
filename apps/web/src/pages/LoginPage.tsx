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
    <div className="flex min-h-screen flex-col items-center justify-center bg-tuf-texture p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950/76 p-6 text-center shadow-[0_26px_70px_rgba(3,9,24,0.8)] backdrop-blur">
        <TufLogo />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">Secure Operator Access</p>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="mt-7 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-center text-3xl tracking-[0.7em] text-cyan-200 focus:border-cyan-400 focus:outline-none"
          placeholder="0000"
        />
        <button className="mt-6 w-full rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/15 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Enter Command Center
        </button>
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : <p className="mt-3 text-xs text-slate-500">4-digit PIN access</p>}
      </form>
      <img src="/tuf-mark.svg" alt="" className="pointer-events-none mt-6 w-10 opacity-20" />
    </div>
  );
}
