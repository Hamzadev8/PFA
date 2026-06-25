'use client';
import { useAuth } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu, X, LogOut, Activity, Users, User, LayoutDashboard,
  Stethoscope, Settings, Droplet, Filter, HeartPulse,
} from 'lucide-react';
import { getDwhAlertes } from '../lib/api';

export default function NavBar() {
  const { user, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertCount, setAlertCount]         = useState(0);

  useEffect(() => {
    if (!user || user.role === 'patient') return;
    getDwhAlertes().then(data => setAlertCount(data.length)).catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const isActive  = (path)   => pathname === path;
  const hasPrefix = (prefix) => pathname.startsWith(prefix);

  const RoleIcon = user?.role === 'medecin' ? Stethoscope : user?.role === 'admin' ? Settings : User;
  const roleLabel = user?.role === 'medecin' ? 'Médecin' : user?.role === 'admin' ? 'Admin' : 'Patient';

  const doctorLinks = [
    { href: '/predict/diabetes',   label: 'Diabète', icon: Droplet,    active: 'text-brand-bright' },
    { href: '/predict/ckd',        label: 'IRC',     icon: Filter,     active: 'text-emerald-300' },
    { href: '/predict/framingham', label: 'Cardio',  icon: HeartPulse, active: 'text-rose-300' },
  ];

  const pill = (active) =>
    `inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-medium transition-colors duration-200 ${
      active ? 'border-brand/40 bg-brand/10 text-brand-bright'
             : 'border-line text-muted hover:text-ink hover:bg-hover'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand/10 border border-brand/25 text-brand-bright transition-colors group-hover:bg-brand/15">
            <Activity className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="font-semibold text-ink text-[15px] tracking-tight">
            Plateforme IA <span className="text-faint font-normal">&amp; BI</span>
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-1.5 text-sm">
          {user && (user.role === 'medecin' || user.role === 'admin') && (
            <>
              <div className="flex items-center gap-1 mr-1.5">
                {doctorLinks.map(l => {
                  const Icon = l.icon;
                  const active = isActive(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors duration-200 ${
                        active ? `${l.active} bg-hover` : 'text-muted hover:text-ink hover:bg-hover'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
                      {l.label}
                    </Link>
                  );
                })}
              </div>

              <Link href="/dashboard" className={`relative ${pill(hasPrefix('/dashboard'))}`}>
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
                Dashboard
                {alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link href="/dashboard/patients" className={pill(hasPrefix('/dashboard/patients'))}>
              <Users className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
              Patients
            </Link>
          )}

          {user && user.role === 'patient' && (
            <Link
              href="/patient"
              className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-medium transition-colors duration-200 ${
                isActive('/patient')
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-line text-muted hover:text-ink hover:bg-hover'
              }`}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
              Mon suivi
            </Link>
          )}

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-line">
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-panel border border-line text-xs text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <RoleIcon className="w-3.5 h-3.5 text-faint" strokeWidth={2.25} aria-hidden="true" />
                <span className="text-ink font-medium">{user.name}</span>
                <span className="text-faint">· {roleLabel}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium text-muted hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
                Quitter
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center h-9 px-4 ml-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-bright transition-colors duration-200 cursor-pointer"
            >
              Se connecter
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="md:hidden grid place-items-center w-9 h-9 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-canvas px-4 py-4 flex flex-col gap-1.5 animate-fade-in">
          {user && (user.role === 'medecin' || user.role === 'admin') && (
            <>
              {doctorLinks.map(l => {
                const Icon = l.icon;
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? `${l.active} bg-hover` : 'text-muted hover:text-ink hover:bg-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                    {l.label}
                  </Link>
                );
              })}

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  hasPrefix('/dashboard') ? 'text-brand-bright bg-hover' : 'text-muted hover:text-ink hover:bg-hover'
                }`}
              >
                <span className="flex items-center gap-2.5"><LayoutDashboard className="w-4 h-4" strokeWidth={2.25} /> Dashboard</span>
                {alertCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{alertCount}</span>
                )}
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link
              href="/dashboard/patients"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                hasPrefix('/dashboard/patients') ? 'text-brand-bright bg-hover' : 'text-muted hover:text-ink hover:bg-hover'
              }`}
            >
              <Users className="w-4 h-4" strokeWidth={2.25} /> Patients
            </Link>
          )}

          {user && user.role === 'patient' && (
            <Link
              href="/patient"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive('/patient') ? 'text-emerald-300 bg-hover' : 'text-muted hover:text-ink hover:bg-hover'
              }`}
            >
              <Activity className="w-4 h-4" strokeWidth={2.25} /> Mon suivi
            </Link>
          )}

          {user ? (
            <div className="flex flex-col gap-3 pt-3 mt-2 border-t border-line">
              <span className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-panel border border-line text-xs text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <RoleIcon className="w-4 h-4 text-faint" strokeWidth={2.25} aria-hidden="true" />
                <span className="text-ink font-medium">{user.name}</span>
                <span className="text-faint">· {roleLabel}</span>
              </span>
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/15 text-sm font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.25} /> Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 inline-flex items-center justify-center py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-bright transition-colors cursor-pointer"
            >
              Se connecter
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
