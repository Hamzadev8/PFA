'use client';
import { useState } from 'react';
import { saveConsultation } from '../lib/api';
import { useAuth } from './AuthContext';
import PredictionResult from './PredictionResult';
import PatientSelector from './PatientSelector';
import Button from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { Search, Stethoscope, AlertTriangle } from 'lucide-react';

const ACCENTS = {
  blue:    { icon: 'text-brand-bright', iconBg: 'bg-brand/10 border-brand/25',           ring: 'focus:ring-brand-bright/50', cat: 'text-brand-bright' },
  emerald: { icon: 'text-emerald-300',  iconBg: 'bg-emerald-500/10 border-emerald-500/25', ring: 'focus:ring-emerald-400/50', cat: 'text-emerald-300' },
  rose:    { icon: 'text-rose-300',     iconBg: 'bg-rose-500/10 border-rose-500/25',       ring: 'focus:ring-rose-400/50',    cat: 'text-rose-300' },
};

function ResultSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-6 w-44 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="w-[88px] h-[88px] rounded-full shrink-0" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full mt-6" />
      </div>
      <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
      <div className="rounded-2xl border border-line bg-panel p-6 space-y-3">
        <Skeleton className="h-4 w-56 rounded" />
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-5 w-full rounded" />)}
      </div>
    </div>
  );
}

export default function PredictionForm({
  diseaseCode, title, subtitle, icon: Icon, accent = 'blue',
  fields, categories = null, categoryIcons = {}, predictFn,
}) {
  const { user } = useAuth();
  const [form, setForm]           = useState(Object.fromEntries(fields.map(f => [f.name, f.example])));
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [patientId, setPatientId] = useState(null);
  const a = ACCENTS[accent] ?? ACCENTS.blue;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: parseFloat(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await predictFn(form);
      setResult(res);
      saveConsultation({
        disease_code:    diseaseCode,
        patient_id:      patientId,
        medecin_id:      user?.id ?? null,
        prediction:      res.prediction,
        probability:     res.probability,
        risk_level:      res.risk_level,
        recommendation:  res.recommendation,
        features_input:  form,
        shap_values:     res.shap_values,
        shap_base_value: res.shap_base_value,
        top_features:    res.top_features,
      }).catch(err => console.warn('DWH save failed:', err));
    } catch {
      setError("Erreur lors de la prédiction. Vérifiez que l'API est lancée.");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f) => (
    <div key={f.name} className="flex flex-col">
      <label htmlFor={`f-${f.name}`} className="text-[11px] font-medium text-muted mb-1.5">
        {f.label.split(' (')[0]}
      </label>
      <div className="relative flex items-center">
        <input
          id={`f-${f.name}`}
          type="number"
          name={f.name}
          value={form[f.name]}
          onChange={handleChange}
          min={f.min} max={f.max} step={f.step}
          className={`w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink tabular transition-colors hover:border-line-2 focus:outline-none focus:ring-2 ${a.ring} focus:border-transparent ${f.unit ? 'pr-14' : ''}`}
          required
        />
        {f.unit && <span className="absolute right-3 text-[10px] font-medium text-faint pointer-events-none">{f.unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-start gap-3.5">
        <span className={`grid place-items-center w-12 h-12 rounded-xl border shrink-0 ${a.iconBg}`}>
          <Icon className={`w-6 h-6 ${a.icon}`} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulaire */}
        <div className="lg:col-span-7 space-y-4">
          <PatientSelector value={patientId} onChange={setPatientId} />

          <div className="bg-panel border border-line rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {categories ? (
                categories.map(cat => {
                  const CatIcon = categoryIcons[cat];
                  return (
                    <fieldset key={cat} className="space-y-3">
                      <legend className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${a.cat} border-b border-line pb-2 mb-3 w-full`}>
                        {CatIcon && <CatIcon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />}{cat}
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.filter(f => f.group === cat).map(renderField)}
                      </div>
                    </fieldset>
                  );
                })
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map(renderField)}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} icon={Search} className="w-full">
                {loading ? 'Analyse en cours…' : "Lancer l'analyse"}
              </Button>
            </form>
          </div>
        </div>

        {/* Résultat */}
        <div className="lg:col-span-5">
          {!result && !loading && (
            <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-10 text-center">
              <Stethoscope className="w-8 h-8 mx-auto text-faint mb-3" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-sm text-muted leading-relaxed">
                Les résultats et l'explicabilité SHAP apparaîtront après soumission.
              </p>
            </div>
          )}
          {loading && <ResultSkeleton />}
          {result && !loading && <PredictionResult result={result} />}
        </div>
      </div>
    </div>
  );
}
