import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { extractErrorMessageFromBody } from '@/shared/lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);

  const nextPath = (() => {
    try {
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    } catch { /* ignore */ }
    return '/';
  })();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(extractErrorMessageFromBody(data) || 'Invalid email or password');
        return;
      }
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token, false, email);
      navigate(nextPath, { replace: true });
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setDemoLoading(demoEmail);
    setError('');
    try {
      let res = await fetch('/api/v1/users/auth/demo-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail }),
      });
      if (res.status === 404) {
        res = await fetch('/api/v1/users/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: 'DemoPass1234!' }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const parsedMsg = extractErrorMessageFromBody(errData) ?? '';
          if (parsedMsg.includes('Invalid') || parsedMsg.includes('not found') || res.status === 401) {
            const regRes = await fetch('/api/v1/users/auth/register/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: demoEmail,
                password: 'DemoPass1234!',
                full_name: (demoEmail.split('@')[0] ?? 'Demo').replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              }),
            });
            if (regRes.ok) {
              res = await fetch('/api/v1/users/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: demoEmail, password: 'DemoPass1234!' }),
              });
            }
          }
        }
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(extractErrorMessageFromBody(data) || 'Demo login failed.');
        return;
      }
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token, false, demoEmail);
      navigate(nextPath, { replace: true });
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* ── Left panel: navy brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: '#16315E' }}
      >
        {/* Blueprint grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded"
              style={{ background: '#10CFC9' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.12em' }}>
              COTECCONS
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1
            className="text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
          >
            Building the <span style={{ color: '#10CFC9' }}>Future</span><br />
            of Infrastructure.
          </h1>
          <p className="text-lg text-blue-200 leading-relaxed max-w-sm">
            Strategic management and digital oversight for Southeast Asia's premier construction projects.
          </p>
        </div>

        {/* Bottom certifications */}
        <div className="relative z-10 flex items-center gap-6">
          {['ISO 9001:2015', 'ISO 45001:2018', 'BIM Level 2 Certified'].map((cert) => (
            <span key={cert} className="text-xs font-medium text-blue-300" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {cert}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded" style={{ background: '#16315E' }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold tracking-widest text-sm" style={{ color: '#16315E', fontFamily: "'Space Grotesk', sans-serif" }}>COTECCONS</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0F172A' }}
            >
              Executive Command
            </h2>
            <p className="text-sm text-slate-500">Integrated DMS Approval Suite</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full rounded border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#10CFC9] focus:ring-2 focus:ring-[#10CFC9]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#10CFC9] focus:ring-2 focus:ring-[#10CFC9]/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: loading ? '#0a9490' : '#10CFC9', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : null}
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo quick-access */}
          <div className="rounded border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Demo Access
              </p>
            </div>
            {[
              { email: 'demo@openestimator.io', name: 'Admin User', role: 'Administrator' },
              { email: 'manager@openestimator.io', name: 'Thomas Müller', role: 'Manager' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => void handleDemoLogin(acc.email)}
                disabled={!!demoLoading}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: '#16315E' }}
                  >
                    {acc.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800">{acc.name}</p>
                    <p className="text-2xs text-slate-500">{acc.role}</p>
                  </div>
                </div>
                {demoLoading === acc.email ? (
                  <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-400">→</span>
                )}
              </button>
            ))}
          </div>

          {/* Security footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} />
            <span>Enterprise Secured · Identity via Microsoft Entra ID</span>
          </div>

          {/* Footer links */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            {['Privacy', 'Security', 'Help Desk'].map((link) => (
              <a key={link} href="#" className="hover:text-slate-600 transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
