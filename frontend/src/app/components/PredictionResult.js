'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, AlertTriangle, AlertOctagon, Pill, BarChart3 } from 'lucide-react';

const riskConfig = {
  'Faible': { icon: CheckCircle2,  ring: '#10b981', text: 'text-emerald-300', soft: 'bg-emerald-500/[0.06] border-emerald-500/25' },
  'Modéré': { icon: AlertTriangle, ring: '#f59e0b', text: 'text-amber-300',   soft: 'bg-amber-500/[0.06] border-amber-500/25' },
  'Élevé':  { icon: AlertOctagon,  ring: '#f43f5e', text: 'text-rose-300',    soft: 'bg-rose-500/[0.06] border-rose-500/25' },
};

export default function PredictionResult({ result }) {
  if (!result) return null;

  const cfg  = riskConfig[result.risk_level] ?? riskConfig['Modéré'];
  const Icon = cfg.icon;
  const prob = Math.round(result.probability * 100);

  // Jauge circulaire
  const radius = 44;
  const strokeWidth = 8;
  const r = radius - strokeWidth * 2;
  const circumference = r * 2 * Math.PI;
  const dashoffset = circumference - (prob / 100) * circumference;

  // Données SHAP triées par |contribution|
  const shapData = Object.entries(result.top_features ?? {})
    .map(([feature, value]) => ({ feature, value: Math.abs(value), raw: value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5 mt-8">

      {/* Diagnostic + jauge */}
      <div className={`rounded-2xl border ${cfg.soft} p-6`}>
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint mb-2">
              Diagnostic assisté
            </div>
            <div className={`inline-flex items-center gap-2 text-xl font-semibold ${cfg.text}`}>
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Risque {result.risk_level}
            </div>
            <div className="text-sm text-muted mt-2">{result.disease}</div>
          </div>

          <div className="relative grid place-items-center shrink-0">
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
              <circle stroke="rgba(255,255,255,0.06)" fill="transparent" strokeWidth={strokeWidth} r={r} cx={radius} cy={radius} />
              <circle
                stroke={cfg.ring} fill="transparent" strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset: dashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                strokeLinecap="round" r={r} cx={radius} cy={radius}
              />
            </svg>
            <span className="absolute tabular text-lg font-semibold text-ink">{prob}%</span>
          </div>
        </div>

        {/* Échelle */}
        <div className="w-full bg-panel-2 rounded-full h-1.5 mt-6 overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${prob}%`, backgroundColor: cfg.ring }} />
        </div>
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-faint mt-2">
          <span>Faible</span><span>Modéré</span><span>Élevé</span>
        </div>
      </div>

      {/* Recommandation */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2.5">
          <Pill className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" />
          Recommandation thérapeutique
        </h3>
        <p className="text-sm text-muted leading-relaxed">{result.recommendation}</p>
      </div>

      {/* Explicabilité SHAP */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1">
          <BarChart3 className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" />
          Explicabilité des facteurs (SHAP)
        </h3>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          Contribution locale de chaque variable à la prédiction de ce patient.
        </p>

        <ResponsiveContainer width="100%" height={Math.max(180, shapData.length * 30)}>
          <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 12 }}>
            <XAxis type="number" stroke="#1b2230" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.toFixed(3)} />
            <YAxis type="category" dataKey="feature" stroke="#1b2230" tick={{ fontSize: 11, fill: '#94a3b8' }} width={92} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ background: '#0c111b', border: '1px solid #1b2230', borderRadius: '10px' }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600, fontSize: '12px' }}
              itemStyle={{ color: '#94a3b8', fontSize: '11px' }}
              formatter={(value, name, props) => [props.payload.raw.toFixed(4), 'Contribution']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {shapData.map((entry, i) => (
                <Cell key={i} fill={entry.raw > 0 ? '#f43f5e' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex gap-5 justify-center mt-4 text-[10px] font-semibold uppercase tracking-wider text-faint">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />Augmente le risque</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" />Réduit le risque</span>
        </div>
      </div>
    </div>
  );
}
