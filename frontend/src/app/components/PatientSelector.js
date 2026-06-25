'use client';
import { useState, useEffect } from 'react';
import { getPatients } from '../lib/api';
import { Skeleton } from './ui/Skeleton';
import { User, ChevronDown } from 'lucide-react';

export default function PatientSelector({ value, onChange }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-4">
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-panel-2 border border-line shrink-0">
        <User className="w-5 h-5 text-brand-bright" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <label htmlFor="patient-select" className="block text-[10px] font-semibold text-faint uppercase tracking-[0.14em] mb-1.5">
          Patient concerné
        </label>
        {loading ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : (
          <div className="relative">
            <select
              id="patient-select"
              value={value ?? ''}
              onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full appearance-none bg-panel-2 border border-line rounded-xl pl-3 pr-9 py-2.5 text-sm text-ink cursor-pointer transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent"
            >
              <option value="">— Sélectionner un patient (optionnel) —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.prenom} {p.nom}{p.age ? ` · ${p.age} ans` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2.25} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
