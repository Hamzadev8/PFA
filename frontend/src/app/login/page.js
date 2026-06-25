'use client';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import { Mail, Lock, User, Activity, Stethoscope, AlertTriangle, ChevronDown } from 'lucide-react';

const ROLE_REDIRECT = { admin: '/dashboard', medecin: '/dashboard', patient: '/patient' };

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm]       = useState({ email: '', password: '', name: '', role: 'patient' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = isLogin
      ? await login(form.email, form.password)
      : await register(form.email, form.password, form.role, form.name);

    if (result?.success) {
      router.push(ROLE_REDIRECT[result.user?.role] ?? '/');
    } else {
      setError(result?.error ?? 'Erreur inconnue');
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setIsLogin(true);
    setError(null);
    setForm({ email, password, name: '', role: 'patient' });
  };

  const inputCls =
    'w-full bg-panel-2 border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink ' +
    'placeholder:text-faint transition-colors hover:border-line-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent';

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 relative">
      {/* halo d'accent unique, discret */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-[36rem] max-w-[90vw] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(37,99,235,0.10), transparent)' }}
      />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand/10 border border-brand/25 text-brand-bright mb-4">
            <Activity className="w-7 h-7" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Plateforme IA <span className="text-faint font-normal">&amp; BI</span>
          </h1>
          <p className="text-faint text-xs mt-1.5 uppercase tracking-[0.16em]">Maladies chroniques · PFA 2026</p>
        </div>

        {/* Carte */}
        <div className="bg-panel border border-line rounded-2xl p-7 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">

          {/* Segmented toggle */}
          <div className="flex bg-panel-2 border border-line p-1 rounded-xl mb-6">
            {[{ k: true, label: 'Se connecter' }, { k: false, label: "S'inscrire" }].map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => { setIsLogin(t.k); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isLogin === t.k ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-[10px] font-semibold text-faint mb-1.5 uppercase tracking-[0.14em]">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
                    <input id="name" type="text" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jean Dupont" className={inputCls} required={!isLogin} />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-[10px] font-semibold text-faint mb-1.5 uppercase tracking-[0.14em]">Rôle</label>
                  <div className="relative">
                    <select id="role" value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full appearance-none bg-panel-2 border border-line rounded-xl px-4 pr-9 py-2.5 text-sm text-ink cursor-pointer transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent">
                      <option value="patient">Patient — suivi personnel</option>
                      <option value="medecin">Médecin — vue clinique</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2.25} aria-hidden="true" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-[10px] font-semibold text-faint mb-1.5 uppercase tracking-[0.14em]">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
                <input id="email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.com" className={inputCls} required />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-semibold text-faint mb-1.5 uppercase tracking-[0.14em]">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
                <input id="password" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className={inputCls} required minLength={6} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-2.5 text-xs text-rose-300 animate-fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              {isLogin ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          {/* Comptes démo */}
          {isLogin && (
            <div className="mt-7 pt-6 border-t border-line">
              <p className="text-[9px] text-faint font-semibold uppercase tracking-[0.18em] mb-3 text-center">Accès de démonstration</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fillDemo('medecin@pfa.ma', 'medecin123')}
                  className="group flex flex-col items-center gap-2 px-3 py-3.5 bg-panel-2 hover:bg-hover border border-line hover:border-line-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Stethoscope className="w-5 h-5 text-faint group-hover:text-brand-bright transition-colors" strokeWidth={2} aria-hidden="true" />
                  <span className="text-[11px] font-medium text-muted group-hover:text-ink transition-colors">Dr. Benali</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('patient@pfa.ma', 'patient123')}
                  className="group flex flex-col items-center gap-2 px-3 py-3.5 bg-panel-2 hover:bg-hover border border-line hover:border-line-2 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-5 h-5 text-faint group-hover:text-emerald-300 transition-colors" strokeWidth={2} aria-hidden="true" />
                  <span className="text-[11px] font-medium text-muted group-hover:text-ink transition-colors">M. Alami</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
