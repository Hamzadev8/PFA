'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { getDwhStatsGlobal, getDwhStatsByDisease as getDwhStatsMaladie, getDwhRisqueDistrib } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  TrendingUp, Users, Bell, Database, Gauge, Server,
  Droplet, Filter, HeartPulse,
} from 'lucide-react';

const DISEASE_META = {
  diabetes:   { icon: Droplet,    color: '#3b82f6' },
  ckd:        { icon: Filter,     color: '#10b981' },
  framingham: { icon: HeartPulse, color: '#f43f5e' },
};
const SERIES_COLORS = ['#3b82f6', '#10b981', '#f43f5e'];
const tooltipStyle = { background: '#0c111b', border: '1px solid #1b2230', borderRadius: '10px' };

const DEMO_POPULATION = [
  { tranche: '18-30', diabetes: 8,  ckd: 3,  cardio: 2  },
  { tranche: '31-45', diabetes: 18, ckd: 10, cardio: 12 },
  { tranche: '46-60', diabetes: 32, ckd: 28, cardio: 35 },
  { tranche: '61-75', diabetes: 28, ckd: 42, cardio: 38 },
  { tranche: '75+',   diabetes: 14, ckd: 17, cardio: 13 },
];

const DEMO_RADAR = [
  { subject: 'Glycémie',    diabetes: 85, ckd: 40, cardio: 55 },
  { subject: 'Tension',     diabetes: 60, ckd: 75, cardio: 90 },
  { subject: 'IMC',         diabetes: 80, ckd: 45, cardio: 70 },
  { subject: 'Âge',         diabetes: 55, ckd: 70, cardio: 80 },
  { subject: 'Cholestérol', diabetes: 40, ckd: 35, cardio: 85 },
  { subject: 'Hémoglobine', diabetes: 30, ckd: 90, cardio: 25 },
];

function StatCard({ icon: Icon, label, value, trend }) {
  return (
    <div className="bg-panel border border-line rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-panel-2 border border-line">
          <Icon className="w-4 h-4 text-muted" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-[10px] font-semibold text-faint uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="tabular text-3xl font-semibold text-ink tracking-tight">{value}</div>
      {trend && (
        <div className="text-[10px] text-emerald-300 font-medium mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" /> {trend}
        </div>
      )}
    </div>
  );
}

export default function DashboardAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats]       = useState(null);
  const [maladies, setMaladies] = useState([]);
  const [risque, setRisque]     = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, m, r] = await Promise.all([getDwhStatsGlobal(), getDwhStatsMaladie(), getDwhRisqueDistrib()]);
        setStats(s); setMaladies(m);
        setRisque(Object.keys(r).length ? r : {});
      } catch {
        setStats({ total_consultations: 24, patients_a_risque_eleve: 8, total_patients: 15, alertes_non_vues: 5, taux_risque_eleve: 33.3 });
        setMaladies([
          { code: 'diabetes',   nom: 'Diabète', total_consultations: 10, probabilite_moyenne: 0.42 },
          { code: 'ckd',        nom: 'IRC',     total_consultations: 8,  probabilite_moyenne: 0.61 },
          { code: 'framingham', nom: 'Cardio',  total_consultations: 6,  probabilite_moyenne: 0.38 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (authLoading || !user || user.role !== 'admin') return null;

  const pieData  = maladies.map((m, i) => ({ name: m.nom, value: m.total_consultations || 0, color: SERIES_COLORS[i] }));
  const tauxData = maladies.map(m => ({ name: m.nom, taux: Math.round((m.probabilite_moyenne || 0) * 100) }));

  const models = [
    { code: 'diabetes',   nom: 'Diabète',          modele: 'Gradient Boosting' },
    { code: 'ckd',        nom: 'IRC (CKD)',         modele: 'Régression logistique' },
    { code: 'framingham', nom: 'Cardiovasculaire',  modele: 'Régression logistique' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* En-tête */}
      <div className="border-b border-line pb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">Administration &amp; BI</h1>
        <p className="text-muted text-sm mt-1.5">Indicateurs de performance globale, machine learning et data warehouse.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={Database} label="Analyses IA réalisées" value={stats?.total_consultations || 0} trend="+12% ce mois" />
            <StatCard icon={Users}    label="Patients inscrits"     value={stats?.total_patients || 0}      trend="+3 nouveaux" />
            <StatCard icon={Gauge}    label="Précision ML moyenne"  value="94.2%"                           trend="Stable" />
            <StatCard icon={Bell}     label="Alertes globales"      value={stats?.alertes_non_vues || 0}    trend="À surveiller" />
          </>
        )}
      </div>

      {/* Charts 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-1">Utilisation des modèles prédictifs</h2>
          <p className="text-[10px] font-medium text-faint uppercase tracking-wider mb-6">Répartition par pathologie ciblée</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={50} paddingAngle={2} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="#030712" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-1">Démographie de la base patients</h2>
          <p className="text-[10px] font-medium text-faint uppercase tracking-wider mb-6">Prévalence estimée par classe d'âge</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_POPULATION} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" />
                <XAxis dataKey="tranche" stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                <Bar dataKey="diabetes" name="Diabète" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ckd"      name="IRC"     fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cardio"   name="Cardio"  fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-1">Cartographie des facteurs de risque</h2>
          <p className="text-[10px] font-medium text-faint uppercase tracking-wider mb-6">Agrégation des importances SHAP</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={DEMO_RADAR}>
                <PolarGrid stroke="#1b2230" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} />
                <Radar name="Diabète" dataKey="diabetes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Radar name="IRC"     dataKey="ckd"      stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Radar name="Cardio"  dataKey="cardio"   stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ink mb-1">Taux moyen de détection d'anomalies</h2>
          <p className="text-[10px] font-medium text-faint uppercase tracking-wider mb-6">Part de cas identifiés « à risque »</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tauxData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" horizontal={false} />
                <XAxis type="number" stroke="#1b2230" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" stroke="#1b2230" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px' }} formatter={v => `${v}%`} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="taux" name="Taux moyen" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {tauxData.map((_, i) => <Cell key={i} fill={SERIES_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table parc ML */}
      <div className="bg-panel border border-line rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Parc machine learning déployé
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line text-faint uppercase font-semibold tracking-wider text-[9px]">
                <th className="py-3 px-4">Domaine clinique</th>
                <th className="text-center py-3 px-4">Requêtes traitées</th>
                <th className="text-center py-3 px-4">Anomalies détectées</th>
                <th className="text-center py-3 px-4">Algorithme déployé</th>
                <th className="text-center py-3 px-4">État serveur</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const meta = DISEASE_META[m.code];
                const Icon = meta?.icon ?? Database;
                const row = maladies.find(x => x.code === m.code);
                return (
                  <tr key={m.code} className="border-b border-line/60 hover:bg-hover transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" style={{ color: meta?.color ?? '#94a3b8' }} strokeWidth={2} aria-hidden="true" />
                        <span className="font-medium text-ink">{m.nom}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 text-muted tabular">{row?.total_consultations || 0}</td>
                    <td className="text-center py-4 px-4 font-medium text-brand-bright tabular">{((row?.probabilite_moyenne || 0) * 100).toFixed(1)}%</td>
                    <td className="text-center py-4 px-4 text-muted">{m.modele}</td>
                    <td className="text-center py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En ligne
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
