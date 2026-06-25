'use client';
import { useEffect, useState } from 'react';
import {
  getShapImportance, getDwhStatsGlobal, getDwhStatsByDisease, getDwhAlertes,
} from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';
import Link from 'next/link';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  TrendingUp, Activity, Users, AlertTriangle, BookOpen, Bell, BellRing,
  Droplet, Filter, HeartPulse, BarChart3, Settings, Microscope, CheckCircle2, ArrowRight,
} from 'lucide-react';

const DISEASES = [
  { key: 'diabetes',   label: 'Diabète',                 icon: Droplet,    color: '#3b82f6' },
  { key: 'ckd',        label: 'Insuffisance rénale',     icon: Filter,     color: '#10b981' },
  { key: 'framingham', label: 'Risque cardiovasculaire', icon: HeartPulse, color: '#f43f5e' },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) return (
    <div className="bg-panel-2 border border-line rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-ink mb-1">{payload[0].payload.feature}</p>
      <p className="text-muted">Importance SHAP : <span className="font-semibold text-brand-bright tabular">{payload[0].value.toFixed(4)}</span></p>
    </div>
  );
  return null;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [shapData, setShapData]             = useState({});
  const [stats, setStats]                   = useState(null);
  const [statsByDisease, setStatsByDisease] = useState([]);
  const [alertes, setAlertes]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState('shap');
  const [active, setActive]                 = useState('diabetes');
  const [errors, setErrors]                 = useState({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role === 'patient') router.push('/patient');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchAll() {
      const errs = {};
      const [shapD, shapC, shapF, statsG, statsM, alertesR] = await Promise.allSettled([
        getShapImportance('diabetes'),
        getShapImportance('ckd'),
        getShapImportance('framingham'),
        getDwhStatsGlobal(),
        getDwhStatsByDisease(),
        getDwhAlertes(),
      ]);

      const shap = {};
      [['diabetes', shapD], ['ckd', shapC], ['framingham', shapF]].forEach(([k, r]) => {
        if (r.status === 'fulfilled') shap[k] = r.value;
        else errs[`shap_${k}`] = true;
      });
      setShapData(shap);

      if (statsG.status === 'fulfilled') setStats(statsG.value); else errs.stats = true;
      if (statsM.status === 'fulfilled') setStatsByDisease(statsM.value); else errs.statsByDisease = true;
      if (alertesR.status === 'fulfilled') setAlertes(alertesR.value); else errs.alertes = true;

      setErrors(errs);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (authLoading || !user || user.role === 'patient') return null;

  const activeDisease = DISEASES.find(d => d.key === active);
  const ActiveDiseaseIcon = activeDisease.icon;
  const chartData = shapData[active]
    ? Object.entries(shapData[active].features || {})
        .map(([feature, value]) => ({ feature, value: parseFloat(value.toFixed(4)) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const pieData = statsByDisease.map(d => ({
    name: DISEASES.find(x => x.key === d.code)?.label ?? d.nom,
    value: d.total_consultations,
    color: DISEASES.find(x => x.key === d.code)?.color ?? '#64748b',
  })).filter(d => d.value > 0);

  const kpis = [
    { label: 'Consultations',  icon: Activity,      value: stats?.total_consultations ?? '—',                 sub: 'Volume total DWH',       color: 'text-ink' },
    { label: 'Risque élevé',   icon: AlertTriangle, value: stats?.patients_a_risque_eleve ?? '—',             sub: 'Patients à surveiller',  color: 'text-rose-300' },
    { label: 'Patients',       icon: Users,         value: stats?.total_patients ?? '—',                      sub: 'Enregistrés',            color: 'text-ink' },
    { label: 'Taux de risque', icon: TrendingUp,    value: stats ? `${stats.taux_risque_eleve}%` : '—',       sub: 'Ratio moyen positif',    color: 'text-amber-300' },
  ];

  const tabs = [
    { key: 'shap',     label: 'Explicabilité SHAP', icon: BarChart3 },
    { key: 'maladies', label: 'Par pathologie',     icon: Activity },
    { key: 'alertes',  label: `Alertes${alertes.length ? ` (${alertes.length})` : ''}`, icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">Dashboard décisionnel</h1>
          <p className="text-muted text-sm mt-1.5">Explicabilité SHAP · statistiques DWH · alertes</p>
        </div>
        <div className="flex gap-2.5">
          {user.role === 'admin' && (
            <Button href="/dashboard/admin" variant="secondary" size="sm" icon={Settings}>Administration</Button>
          )}
          <Button href="/predict/diabetes" size="sm" icon={Microscope}>Lancer une analyse</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-panel border border-line rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-faint uppercase tracking-[0.14em]">{kpi.label}</span>
                <Icon className="w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20 rounded mt-4" />
              ) : (
                <div className={`tabular text-3xl font-semibold mt-4 ${kpi.color}`}>{kpi.value}</div>
              )}
              <div className="text-[10px] text-faint mt-1.5 font-medium">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Bandeau alertes */}
      {alertes.length > 0 && (
        <div className="bg-rose-500/[0.07] border border-rose-500/25 rounded-2xl p-4 flex items-center gap-3">
          <BellRing className="w-5 h-5 text-rose-300 shrink-0" strokeWidth={2} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rose-200">{alertes.length} alerte{alertes.length > 1 ? 's' : ''} non vue{alertes.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-muted truncate">{alertes[0].message}</p>
          </div>
          <button onClick={() => setActiveTab('alertes')} className="inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:text-rose-200 transition-colors shrink-0 cursor-pointer">
            Voir <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex bg-panel-2 border border-line p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.key ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Onglet SHAP */}
      {activeTab === 'shap' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DISEASES.map((d) => {
              const Icon = d.icon;
              const isActive = active === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  className={`rounded-2xl border p-5 text-left transition-colors duration-200 cursor-pointer ${
                    isActive ? 'bg-panel border-line-2 ring-1 ring-brand/30' : 'bg-panel border-line hover:bg-hover hover:border-line-2'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" style={{ color: d.color }} strokeWidth={2} aria-hidden="true" />
                  <div className="font-semibold text-ink text-sm">{d.label}</div>
                  <div className="text-[10px] font-medium text-faint mt-1 uppercase tracking-[0.12em]">
                    {shapData[d.key] ? `${Object.keys(shapData[d.key].features || {}).length} variables` : 'chargement…'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-panel border border-line rounded-2xl p-6">
            {loading ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : errors[`shap_${active}`] ? (
              <div className="text-center py-20 text-muted">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-faint" strokeWidth={1.75} aria-hidden="true" />
                <p className="text-sm">Impossible de charger les données SHAP. Vérifiez que l'API est lancée.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                      <ActiveDiseaseIcon className="w-4 h-4" style={{ color: activeDisease.color }} strokeWidth={2.25} aria-hidden="true" />
                      Importance globale — {activeDisease.label}
                    </h2>
                    <p className="text-[11px] text-muted mt-1">Impact moyen absolu (Top 10 variables)</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-line"
                    style={{ color: activeDisease.color, background: `${activeDisease.color}14` }}>
                    Modèle ML
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1b2230" />
                    <XAxis type="number" stroke="#1b2230" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => v.toFixed(3)} />
                    <YAxis type="category" dataKey="feature" stroke="#1b2230" tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {chartData.map((_, i) => <Cell key={i} fill={activeDisease.color} opacity={1 - i * 0.06} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 bg-panel-2 rounded-xl p-4 border border-line flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-brand-bright shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-1">Interprétation médicale</p>
                    {active === 'diabetes'   && <p className="text-xs text-muted leading-relaxed">L'<strong className="text-ink font-medium">IMC</strong> et la concentration en <strong className="text-ink font-medium">glucose</strong> sont les descripteurs prédictifs dominants pour le diabète.</p>}
                    {active === 'ckd'        && <p className="text-xs text-muted leading-relaxed">Les taux d'<strong className="text-ink font-medium">hémoglobine</strong>, de <strong className="text-ink font-medium">créatinine</strong> et la <strong className="text-ink font-medium">densité urinaire</strong> exercent le plus fort impact sur l'IRC.</p>}
                    {active === 'framingham' && <p className="text-xs text-muted leading-relaxed">L'<strong className="text-ink font-medium">âge</strong>, la <strong className="text-ink font-medium">pression systolique</strong> et le <strong className="text-ink font-medium">cholestérol</strong> total pilotent l'évaluation cardiovasculaire.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Onglet Par pathologie */}
      {activeTab === 'maladies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-panel border border-line rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-ink mb-5">Consultations par pathologie</h2>
            {errors.statsByDisease ? (
              <p className="text-muted text-sm">Données indisponibles — vérifiez la connexion à la base de données.</p>
            ) : statsByDisease.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">Aucune consultation enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {statsByDisease.map((d) => {
                  const disease = DISEASES.find(x => x.key === d.code);
                  const Icon = disease?.icon ?? Activity;
                  return (
                    <div key={d.code} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-panel-2 border border-line">
                      <div className="flex items-center gap-3">
                        <span className="grid place-items-center w-9 h-9 rounded-lg bg-panel border border-line">
                          <Icon className="w-4 h-4" style={{ color: disease?.color ?? '#94a3b8' }} strokeWidth={2} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{disease?.label ?? d.nom}</p>
                          <p className="text-[10px] text-faint uppercase tracking-wider font-medium mt-0.5">Prob. moy. : {(d.probabilite_moyenne * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-2xl font-semibold text-ink">{d.total_consultations}</p>
                        <p className="text-[10px] text-faint font-medium">consultations</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-panel border border-line rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-ink mb-5">Répartition des consultations</h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted text-sm">Aucune donnée disponible.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} stroke="#030712" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0c111b', border: '1px solid #1b2230', borderRadius: '10px', fontSize: '12px' }} formatter={(v) => [`${v} consultations`]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Onglet Alertes */}
      {activeTab === 'alertes' && (
        <div className="bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-300" strokeWidth={2.25} aria-hidden="true" /> Alertes non vues
          </h2>
          {errors.alertes ? (
            <p className="text-muted text-sm">Impossible de charger les alertes.</p>
          ) : alertes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-400/70" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-sm">Aucune alerte en attente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertes.map((a) => (
                <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl bg-rose-500/[0.06] border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-rose-200">{a.niveau}</span>
                      <span className="text-[10px] font-medium text-faint uppercase tracking-wider">
                        {DISEASES.find(d => d.key === a.maladie)?.label ?? a.maladie}
                      </span>
                      <span className="text-[10px] text-faint ml-auto tabular">{a.date}</span>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
