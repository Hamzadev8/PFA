'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'next/navigation';
import { saveMesure } from '../lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Droplet, Activity, Scale, HeartPulse, Plus, BellRing,
  AlertTriangle, Info, CheckCircle2, ArrowUp, ArrowDown, LineChart as LineChartIcon,
} from 'lucide-react';

const MEASURES = [
  { key: 'glycemie',  label: 'Glycémie',            unit: 'mg/dL', icon: Droplet,    normal: [70, 100], color: '#3b82f6' },
  { key: 'tension',   label: 'Tension systolique',  unit: 'mm Hg', icon: Activity,   normal: [90, 130], color: '#f43f5e' },
  { key: 'poids',     label: 'Poids',               unit: 'kg',    icon: Scale,      normal: [50, 90],  color: '#10b981' },
  { key: 'frequence', label: 'Fréquence cardiaque', unit: 'bpm',   icon: HeartPulse, normal: [60, 100], color: '#f59e0b' },
];

function StatusBadge({ value, normal }) {
  const [min, max] = normal;
  if (value < min) return <Badge tone="brand" icon={ArrowDown}>Bas</Badge>;
  if (value > max) return <Badge tone="danger" icon={ArrowUp}>Élevé</Badge>;
  return <Badge tone="success" icon={CheckCircle2}>Normal</Badge>;
}

export default function PatientPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [history, setHistory]         = useState({});
  const [form, setForm]               = useState({ glycemie: '', tension: '', poids: '', frequence: '' });
  const [activeChart, setActiveChart] = useState('glycemie');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saveError, setSaveError]     = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'patient') { router.push('/'); }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const res  = await fetch(`http://localhost:8000/dwh/mesures/historique/${user.id}`);
      const data = await res.json();
      const newHistory = { glycemie: [], tension: [], poids: [], frequence: [] };
      data.forEach(m => {
        const date = m.date?.slice(5).replace('-', '/') || '—';
        if (m.glycemie  != null) newHistory.glycemie.push({ date, value: m.glycemie });
        if (m.tension   != null) newHistory.tension.push({ date, value: m.tension });
        if (m.poids     != null) newHistory.poids.push({ date, value: m.poids });
        if (m.frequence != null) newHistory.frequence.push({ date, value: m.frequence });
      });
      setHistory(newHistory);
    } catch (e) {
      console.error('Erreur chargement historique:', e);
    } finally {
      setLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);

    const payload = {};
    MEASURES.forEach(m => { if (form[m.key] !== '') payload[m.key] = parseFloat(form[m.key]); });
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    try {
      await saveMesure({ ...payload, patient_id: user.id });
      setForm({ glycemie: '', tension: '', poids: '', frequence: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchHistory();
    } catch (err) {
      setSaveError(err.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const activeMeasure = MEASURES.find(m => m.key === activeChart);
  const ActiveIcon    = activeMeasure.icon;
  const lastValues    = Object.fromEntries(MEASURES.map(m => [m.key, history[m.key]?.at(-1)?.value ?? null]));

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* En-tête */}
      <div className="border-b border-line pb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
          Bonjour, {user.name}
        </h1>
        <p className="text-muted text-sm mt-1.5">Suivi en temps réel de vos constantes physiologiques.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MEASURES.map((m) => {
          const Icon = m.icon;
          const val = lastValues[m.key];
          const active = activeChart === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setActiveChart(m.key)}
              className={`rounded-2xl border p-5 text-left transition-colors duration-200 cursor-pointer ${
                active ? 'bg-panel border-line-2 ring-1 ring-brand/30' : 'bg-panel border-line hover:bg-hover hover:border-line-2'
              }`}
            >
              <Icon className="w-5 h-5 mb-3" style={{ color: m.color }} strokeWidth={2} aria-hidden="true" />
              <div className="text-[10px] font-semibold text-faint uppercase tracking-[0.14em] mb-1.5">{m.label}</div>
              {loadingData ? (
                <Skeleton className="h-7 w-16 rounded" />
              ) : (
                <div className="tabular text-2xl font-semibold text-ink">
                  {val ?? '—'}<span className="text-xs font-normal text-faint ml-1.5">{m.unit}</span>
                </div>
              )}
              {val != null && <div className="mt-3"><StatusBadge value={val} normal={m.normal} /></div>}
            </button>
          );
        })}
      </div>

      {/* Graphique + saisie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Graphique */}
        <div className="lg:col-span-8 bg-panel border border-line rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <ActiveIcon className="w-4 h-4" style={{ color: activeMeasure.color }} strokeWidth={2.25} aria-hidden="true" />
              Évolution — {activeMeasure.label}
            </h2>
            <span className="text-[10px] font-semibold text-faint uppercase tracking-[0.14em]">30 derniers jours</span>
          </div>

          {loadingData ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : !history[activeChart]?.length ? (
            <div className="h-64 flex flex-col items-center justify-center text-faint gap-2">
              <LineChartIcon className="w-8 h-8 opacity-40" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm">Aucune mesure enregistrée pour cette métrique.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history[activeChart]} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" />
                  <XAxis dataKey="date" stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ background: '#0c111b', border: '1px solid #1b2230', borderRadius: '10px' }}
                    labelStyle={{ fontSize: '11px', color: '#f1f5f9' }}
                    itemStyle={{ fontSize: '11px' }}
                    formatter={(v) => [`${v} ${activeMeasure.unit}`, activeMeasure.label]}
                  />
                  <ReferenceLine y={activeMeasure.normal[1]} stroke="#f43f5e" strokeDasharray="4 4" opacity={0.5}
                    label={{ value: 'Max', fontSize: 9, fill: '#f43f5e', position: 'insideBottomRight' }} />
                  <ReferenceLine y={activeMeasure.normal[0]} stroke="#10b981" strokeDasharray="4 4" opacity={0.5}
                    label={{ value: 'Min', fontSize: 9, fill: '#10b981', position: 'insideTopRight' }} />
                  <Line type="monotone" dataKey="value" stroke={activeMeasure.color} strokeWidth={2.5}
                    dot={{ fill: activeMeasure.color, stroke: '#030712', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Saisie */}
        <div className="lg:col-span-4 bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Saisie quotidienne
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {MEASURES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.key} className="flex flex-col">
                  <label htmlFor={`m-${m.key}`} className="text-[11px] font-medium text-muted mb-1.5 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-faint" strokeWidth={2} aria-hidden="true" /> {m.label}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={`m-${m.key}`}
                      type="number"
                      value={form[m.key]}
                      onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                      placeholder={`Normal : ${m.normal[0]}–${m.normal[1]}`}
                      step="0.1"
                      className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 pr-14 text-sm text-ink tabular placeholder:text-faint transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent"
                    />
                    <span className="absolute right-3 text-[10px] font-medium text-faint pointer-events-none">{m.unit}</span>
                  </div>
                </div>
              );
            })}

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> Mesures enregistrées avec succès.
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> {saveError}
              </div>
            )}

            <Button type="submit" loading={saving} className="w-full">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-panel border border-line rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Recommandations physiopathologiques
        </h2>
        <div className="space-y-3">
          {MEASURES.map((m) => {
            const val = lastValues[m.key];
            if (val == null) return null;
            const [min, max] = m.normal;
            if (val > max) return (
              <div key={m.key} className="flex items-start gap-3 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-rose-200">{m.label} élevé(e) : {val} {m.unit}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">Dépasse le seuil supérieur de {max} {m.unit}. Surveillez votre alimentation et consultez votre médecin.</p>
                </div>
              </div>
            );
            if (val < min) return (
              <div key={m.key} className="flex items-start gap-3 bg-brand/[0.06] border border-brand/20 rounded-xl p-4">
                <Info className="w-5 h-5 text-brand-bright shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-ink">{m.label} bas(se) : {val} {m.unit}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">En dessous du seuil inférieur de {min} {m.unit}. Reposez-vous et signalez ce relevé à votre médecin.</p>
                </div>
              </div>
            );
            return (
              <div key={m.key} className="flex items-start gap-3 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-emerald-200">{m.label} stable : {val} {m.unit}</p>
                  <p className="text-xs text-muted mt-0.5">Mesure dans la plage physiologique normale.</p>
                </div>
              </div>
            );
          })}
          {MEASURES.every(m => lastValues[m.key] == null) && (
            <p className="text-muted text-sm text-center py-4">Aucune mesure disponible — commencez votre suivi ci-dessus.</p>
          )}
        </div>
      </div>
    </div>
  );
}
