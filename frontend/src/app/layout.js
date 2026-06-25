import './globals.css';
import { AuthProvider } from './components/AuthContext';
import NavBar from './components/NavBar';
import { Geist, Geist_Mono } from 'next/font/google';
import { Activity } from 'lucide-react';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Plateforme IA — Maladies Chroniques',
  description: 'Diagnostic précoce et prise en charge personnalisée des maladies chroniques.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`scroll-smooth ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans bg-canvas text-ink min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <NavBar />

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-grow w-full">
            {children}
          </main>

          <footer className="border-t border-line bg-panel/40 mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-2.5 text-muted text-sm">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand/10 border border-brand/25 text-brand-bright">
                  <Activity className="w-4 h-4" strokeWidth={2.25} />
                </span>
                <span>
                  <span className="text-ink font-medium">Plateforme IA</span>
                  <span className="text-faint"> — Maladies Chroniques · PFA 2026</span>
                </span>
              </div>
              <div className="flex gap-7 text-xs text-faint">
                <span className="hover:text-ink cursor-pointer transition-colors duration-200">Confidentialité</span>
                <span className="hover:text-ink cursor-pointer transition-colors duration-200">Conditions</span>
                <span className="hover:text-ink cursor-pointer transition-colors duration-200">Support</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
