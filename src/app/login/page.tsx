'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        const from = new URLSearchParams(window.location.search).get('from');
        window.location.href = from || '/';
        return;
      }
      setErr('Incorrect access token. Please try again.');
    } catch {
      setErr('Sign-in failed. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#002B49] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-8 flex flex-col gap-5"
      >
        <div>
          <h1 className="text-xl font-semibold text-[#002B49]">Sales Follow-up PPT Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your access token to continue.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="token" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Access token
          </label>
          <input
            id="token"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#006CE0] focus:ring-2 focus:ring-[#006CE0]/20"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="w-full rounded-md bg-[#002B49] text-white text-sm font-medium py-2.5 hover:bg-[#013a61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-xs text-gray-400 text-center">Chambers and Partners · Strictly confidential</p>
      </form>
    </div>
  );
}
