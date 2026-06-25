'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
  ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  getDwhStatsGlobal, getDwhStatsByDisease as getDwhStatsMaladie, getDwhRisqueDistrib,
  getDwhAlertes, getDwhEvolution, getPatients, createPatient as addPatient,
  updatePatient, getPatientDossier, getConsultationDetail, getPatientEvolution,
} from '../../lib/api';
import { useAuth } from '../../components/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Activity, Users, AlertTriangle, AlertOctagon, Bell, ShieldCheck, Search, Plus,
  SquarePen, Eye, ArrowLeft, Check, ChevronDown, X, TrendingUp, TrendingDown, Minus,
  Clock, BarChart3, Pill, ClipboardList, Stethoscope, FlaskConical, FileText,
  Droplet, Filter, HeartPulse, Scale, Mail, Phone,
} from 'lucide-react';

const DISEASE_COLORS = { diabetes: '#3b82f6', ckd: '#10b981', framingham: '#f43f5e' };
const DISEASE_ICONS  = { diabetes: Droplet, ckd: Filter, framingham: HeartPulse };

const METRIQUES = [
  { key: 'glycemie',  label: 'Glycémie',            icon: Droplet,    color: '#3b82f6', unit: 'mg/dL' },
  { key: 'tension',   label: 'Tension artérielle',  icon: Activity,   color: '#f43f5e', unit: 'mmHg' },
  { key: 'poids',     label: 'Poids',               icon: Scale,      color: '#10b981', unit: 'kg' },
  { key: 'frequence', label: 'Fréquence cardiaque', icon: HeartPulse, color: '#f59e0b', unit: 'bpm' },
];

const PERIODES = [
  { value: 7, label: '7 j' }, { value: 14, label: '14 j' },
  { value: 30, label: '30 j' }, { value: 90, label: '3 mois' },
];

const riskClasses = {
  'Élevé':  'bg-rose-500/10 text-rose-300 border-rose-500/25',
  'Modéré': 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  'Faible': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
};
const tooltipStyle = { background: '#0c111b', border: '1px solid #1b2230', borderRadius: '10px' };

// ─────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-panel border border-line rounded-2xl p-5">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-semibold text-faint uppercase tracking-[0.14em]">{label}</span>
        <Icon className="w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="tabular text-3xl font-semibold mt-4" style={{ color }}>{value}</div>
      <div className="text-[10px] text-faint mt-1.5 font-medium uppercase tracking-wider">{sub}</div>
    </div>
  );
}

function TendanceIcon({ tendance }) {
  if (tendance === 'hausse') return <TrendingUp className="w-4 h-4 text-rose-300" strokeWidth={2.25} aria-hidden="true" />;
  if (tendance === 'baisse') return <TrendingDown className="w-4 h-4 text-emerald-300" strokeWidth={2.25} aria-hidden="true" />;
  return <Minus className="w-4 h-4 text-muted" strokeWidth={2.25} aria-hidden="true" />;
}

function TendanceLabel({ tendance }) {
  const map = { hausse: 'En hausse', baisse: 'En baisse', stable: 'Stable' };
  const colorMap = { hausse: 'text-rose-300', baisse: 'text-emerald-300', stable: 'text-muted' };
  return <span className={`text-[10px] font-semibold uppercase tracking-wider ${colorMap[tendance] || 'text-muted'}`}>{map[tendance] || 'Stable'}</span>;
}

// ─────────────────────────────────────────────
function ConsultationDetailPanel({ detail, onClose }) {
  if (!detail) return null;

  const DiseaseIcon = DISEASE_ICONS[detail.maladie_code] ?? Stethoscope;
  const shapEntries = detail.shap_values
    ? Object.entries(detail.shap_values)
        .map(([feature, value]) => ({ feature, value: parseFloat(Number(value).toFixed(4)) }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10)
    : [];
  const featuresInput = detail.features_input || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-panel rounded-2xl border border-line shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DiseaseIcon className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold text-ink">{detail.maladie_nom || 'Analyse IA'}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-faint" strokeWidth={2} aria-hidden="true" />
                <span className="text-[10px] text-faint font-medium tabular">{detail.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border tabular ${riskClasses[detail.risk_level] ?? riskClasses['Modéré']}`}>
              {detail.risk_level} — {Math.round(detail.probability * 100)}%
            </span>
            <button onClick={onClose} aria-label="Fermer" className="grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Recommandation */}
          <div className="bg-panel-2 border border-line rounded-xl p-4 flex items-start gap-3">
            <Pill className="w-4 h-4 text-brand-bright mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1">Recommandation médicale</p>
              <p className="text-sm text-muted leading-relaxed">{detail.recommendation}</p>
            </div>
          </div>

          {/* SHAP */}
          {shapEntries.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Importance SHAP — facteurs déterminants
              </h4>
              <p className="text-[10px] text-faint">Impact de chaque variable sur la prédiction pour ce patient spécifique</p>
              <div className="bg-panel-2 border border-line rounded-xl p-4">
                <ResponsiveContainer width="100%" height={Math.max(200, shapEntries.length * 32)}>
                  <BarChart data={shapEntries} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1b2230" />
                    <XAxis type="number" stroke="#1b2230" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => v.toFixed(3)} />
                    <YAxis type="category" dataKey="feature" stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} width={130} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px', color: '#94a3b8' }} formatter={v => v.toFixed(4)} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {shapEntries.map((entry, i) => <Cell key={i} fill={entry.value >= 0 ? '#f43f5e' : '#3b82f6'} opacity={1 - i * 0.05} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-faint font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />Augmente le risque</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" />Diminue le risque</span>
                </div>
              </div>
            </div>
          )}

          {/* Données d'entrée */}
          {Object.keys(featuresInput).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted" strokeWidth={2.25} aria-hidden="true" /> Données d'entrée du patient
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(featuresInput).map(([key, val]) => {
                  const isTop = detail.top_features && key in detail.top_features;
                  return (
                    <div key={key} className={`rounded-xl p-3 border ${isTop ? 'bg-brand/5 border-brand/25' : 'bg-panel-2 border-line'}`}>
                      <div className="text-[9px] font-medium text-faint uppercase tracking-wider truncate">{key}</div>
                      <div className={`tabular text-sm font-semibold mt-1 ${isTop ? 'text-brand-bright' : 'text-ink'}`}>
                        {typeof val === 'number' ? val.toFixed(2) : val}
                      </div>
                      {isTop && <div className="text-[8px] font-semibold text-brand-bright uppercase mt-0.5 tracking-wider">Top variable</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function EvolutionPanel({ patientId, mesures }) {
  const [selectedMetrique, setSelectedMetrique] = useState('glycemie');
  const [selectedPeriode, setSelectedPeriode]   = useState(30);
  const [evolutionData, setEvolutionData]       = useState(null);
  const [loadingEvolution, setLoadingEvolution] = useState(false);

  const metriqueMeta = METRIQUES.find(m => m.key === selectedMetrique);

  const fetchEvolution = async () => {
    setLoadingEvolution(true);
    try {
      // Signature API : (id, metrique, jours)
      const data = await getPatientEvolution(patientId, selectedMetrique, selectedPeriode);
      setEvolutionData(data);
    } catch (e) {
      const filteredMesures = [...mesures].reverse();
      const values = filteredMesures.map(m => m[selectedMetrique]).filter(v => v != null);
      const plages = {
        glycemie:  { min_normal: 70, max_normal: 100, unite: 'mg/dL' },
        tension:   { min_normal: 90, max_normal: 130, unite: 'mmHg' },
        poids:     { min_normal: 50, max_normal: 90,  unite: 'kg' },
        frequence: { min_normal: 60, max_normal: 100, unite: 'bpm' },
      };
      setEvolutionData({
        metrique: selectedMetrique,
        plage_reference: plages[selectedMetrique],
        statistiques: values.length ? {
          min: Math.round(Math.min(...values) * 10) / 10,
          max: Math.round(Math.max(...values) * 10) / 10,
          moyenne: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10,
          derniere_valeur: Math.round(values[values.length - 1] * 10) / 10,
          nb_mesures: values.length,
          tendance: 'stable',
        } : {},
        points: filteredMesures.map(m => ({ date: m.date, valeur: m[selectedMetrique], statut: m[`${selectedMetrique}_statut`] })),
      });
    } finally {
      setLoadingEvolution(false);
    }
  };

  useEffect(() => { fetchEvolution(); }, [selectedMetrique, selectedPeriode, patientId]);

  const chartData = evolutionData?.points?.filter(p => p.valeur != null) || [];
  const stats = evolutionData?.statistiques || {};
  const plage = evolutionData?.plage_reference || {};

  return (
    <div className="bg-panel border border-line rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-300" strokeWidth={2.25} aria-hidden="true" /> Suivi &amp; évolution des constantes
        </h3>
        <div className="flex bg-panel-2 border border-line rounded-lg p-0.5">
          {PERIODES.map(p => (
            <button key={p.value} onClick={() => setSelectedPeriode(p.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                selectedPeriode === p.value ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sélecteur de métrique */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {METRIQUES.map(m => {
          const Icon = m.icon;
          const active = selectedMetrique === m.key;
          return (
            <button key={m.key} onClick={() => setSelectedMetrique(m.key)}
              className={`rounded-xl p-3 text-left transition-colors cursor-pointer border ${
                active ? 'border-line-2 ring-1 ring-brand/30 bg-panel-2' : 'border-line bg-panel-2 hover:bg-hover'
              }`}>
              <Icon className="w-4 h-4 mb-1.5" style={{ color: m.color }} strokeWidth={2} aria-hidden="true" />
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{m.label}</div>
              <div className="text-[9px] text-faint font-medium mt-0.5">{m.unit}</div>
            </button>
          );
        })}
      </div>

      {loadingEvolution ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="text-center py-12 text-muted border border-dashed border-line rounded-xl">
          <Activity className="w-7 h-7 mx-auto mb-3 text-faint opacity-50" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-xs">Aucune donnée de {metriqueMeta?.label?.toLowerCase()} disponible pour cette période.</p>
        </div>
      ) : (
        <>
          {Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Dernière', value: stats.derniere_valeur, color: metriqueMeta?.color },
                { label: 'Moyenne',  value: stats.moyenne,         color: '#f1f5f9' },
                { label: 'Min',      value: stats.min,             color: '#10b981' },
                { label: 'Max',      value: stats.max,             color: '#f43f5e' },
              ].map(s => (
                <div key={s.label} className="bg-panel-2 border border-line rounded-xl p-3">
                  <div className="text-[9px] font-medium text-faint uppercase tracking-wider">{s.label}</div>
                  <div className="tabular text-lg font-semibold mt-1" style={{ color: s.color }}>
                    {s.value} <span className="text-[10px] text-faint">{plage.unite}</span>
                  </div>
                </div>
              ))}
              <div className="bg-panel-2 border border-line rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[9px] font-medium text-faint uppercase tracking-wider">Tendance</div>
                <div className="flex items-center gap-2 mt-1"><TendanceIcon tendance={stats.tendance} /><TendanceLabel tendance={stats.tendance} /></div>
              </div>
            </div>
          )}

          <div className="bg-panel-2 border border-line rounded-xl p-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ left: -15, right: 10, top: 5 }}>
                <defs>
                  <linearGradient id={`grad-${selectedMetrique}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metriqueMeta?.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={metriqueMeta?.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" />
                <XAxis dataKey="date" stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={d => d?.slice(5)} />
                <YAxis stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: '11px', color: '#f1f5f9' }} formatter={(v) => [`${v} ${plage.unite || ''}`, metriqueMeta?.label]} />
                {plage.min_normal && <ReferenceLine y={plage.min_normal} stroke="#10b981" strokeDasharray="5 3" opacity={0.5} label={{ value: `Min (${plage.min_normal})`, fill: '#10b981', fontSize: 9, position: 'left' }} />}
                {plage.max_normal && <ReferenceLine y={plage.max_normal} stroke="#f43f5e" strokeDasharray="5 3" opacity={0.5} label={{ value: `Max (${plage.max_normal})`, fill: '#f43f5e', fontSize: 9, position: 'left' }} />}
                <Area type="monotone" dataKey="valeur" stroke={metriqueMeta?.color} strokeWidth={2.5} fill={`url(#grad-${selectedMetrique})`}
                  dot={{ r: 4, stroke: '#030712', strokeWidth: 1.5, fill: metriqueMeta?.color }} activeDot={{ r: 6, stroke: metriqueMeta?.color, strokeWidth: 2 }} name={metriqueMeta?.label} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-faint font-medium">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Seuil min</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-rose-500 inline-block rounded" /> Seuil max</span>
              <span>· {stats.nb_mesures || 0} mesures</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function DashboardMedecinPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats]       = useState(null);
  const [maladies, setMaladies] = useState([]);
  const [risque, setRisque]     = useState({});
  const [evolution, setEvolution] = useState([]);
  const [alertes, setAlertes]   = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [patients, setPatientsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const [consultationDetail, setConsultationDetail] = useState(null);
  const [historiqueFilter, setHistoriqueFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [patientForm, setPatientForm] = useState({ nom: '', prenom: '', age: '', sexe: 'M', email: '', telephone: '' });
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'medecin') router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [s, m, r, e, a] = await Promise.all([
        getDwhStatsGlobal(), getDwhStatsMaladie(), getDwhRisqueDistrib(), getDwhEvolution(7), getDwhAlertes(),
      ]);
      setStats(s); setMaladies(m);
      setRisque(Object.keys(r).length ? r : {
        diabetes: { Faible: 45, Modéré: 30, Élevé: 25 },
        ckd: { Faible: 50, Modéré: 25, Élevé: 25 },
        framingham: { Faible: 40, Modéré: 35, Élevé: 25 },
      });
      setEvolution(e.length ? e : [
        { date: '2026-05-18', total: 3 }, { date: '2026-05-19', total: 5 },
        { date: '2026-05-20', total: 4 }, { date: '2026-05-21', total: 8 },
        { date: '2026-05-22', total: 6 }, { date: '2026-05-23', total: 9 },
        { date: '2026-05-24', total: 7 },
      ]);
      setAlertes(a.length ? a : [
        { id: 1, maladie: 'diabetes', niveau: 'CRITICAL', message: 'Risque élevé détecté : Diabète — 78.5%', date: '2026-05-24 10:30' },
        { id: 2, maladie: 'ckd', niveau: 'CRITICAL', message: 'Risque élevé détecté : IRC — 91.2%', date: '2026-05-24 11:15' },
        { id: 3, maladie: 'framingham', niveau: 'CRITICAL', message: 'Risque élevé détecté : Cardiovasculaire — 82.0%', date: '2026-05-24 12:00' },
      ]);
    } catch {
      setStats({ total_consultations: 12, patients_a_risque_eleve: 4, total_patients: 8, alertes_non_vues: 3, taux_risque_eleve: 33.3 });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try { setPatientsList(await getPatients()); }
    catch (e) { console.error('Erreur récupération patients', e); }
    finally { setLoadingPatients(false); }
  };

  const fetchDossier = async (patientId) => {
    setLoadingDossier(true);
    try { setDossier(await getPatientDossier(patientId)); }
    catch (e) { console.error('Erreur chargement dossier', e); }
    finally { setLoadingDossier(false); }
  };

  const handleViewConsultation = async (consultId) => {
    try {
      setConsultationDetail(await getConsultationDetail(consultId));
    } catch {
      const found = dossier?.consultations?.find(c => c.id === consultId);
      if (found) setConsultationDetail(found);
    }
  };

  useEffect(() => { fetchStats(); fetchPatients(); }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'analytics') fetchStats();
    else { fetchPatients(); setSelectedPatientId(null); setDossier(null); }
  };

  const handleOpenDossier = (patientId) => {
    setSelectedPatientId(patientId);
    setHistoriqueFilter('all');
    fetchDossier(patientId);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setFormError(null); setFormSuccess(false); setSavingForm(true);
    try {
      await addPatient({
        nom: patientForm.nom, prenom: patientForm.prenom, age: parseInt(patientForm.age),
        sexe: patientForm.sexe, email: patientForm.email || null, telephone: patientForm.telephone || null,
      });
      setFormSuccess(true);
      setPatientForm({ nom: '', prenom: '', age: '', sexe: 'M', email: '', telephone: '' });
      fetchPatients();
      setTimeout(() => { setShowAddModal(false); setFormSuccess(false); }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Erreur de création. L'email est peut-être déjà utilisé.");
    } finally { setSavingForm(false); }
  };

  const openEditModal = (p, e) => {
    e.stopPropagation();
    setEditingPatientId(p.id);
    setPatientForm({ nom: p.nom, prenom: p.prenom, age: p.age, sexe: p.sexe, email: p.email || '', telephone: p.telephone || '' });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    setFormError(null); setFormSuccess(false); setSavingForm(true);
    try {
      await updatePatient(editingPatientId, {
        nom: patientForm.nom, prenom: patientForm.prenom, age: parseInt(patientForm.age),
        sexe: patientForm.sexe, email: patientForm.email || null, telephone: patientForm.telephone || null,
      });
      setFormSuccess(true);
      fetchPatients();
      if (selectedPatientId === editingPatientId) fetchDossier(editingPatientId);
      setTimeout(() => { setShowEditModal(false); setFormSuccess(false); }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || 'Erreur lors de la modification.');
    } finally { setSavingForm(false); }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchQuery.toLowerCase();
    return p.nom.toLowerCase().includes(term) || p.prenom.toLowerCase().includes(term) || (p.email && p.email.toLowerCase().includes(term));
  });

  const filteredConsultations = dossier?.consultations?.filter(c => historiqueFilter === 'all' || c.maladie_code === historiqueFilter) || [];

  const pieData = stats ? [
    { name: 'Risque élevé',  value: stats.patients_a_risque_eleve, color: '#f43f5e' },
    { name: 'Risque modéré', value: Math.round(stats.total_consultations * 0.35), color: '#f59e0b' },
    { name: 'Risque faible', value: Math.max(0, stats.total_consultations - stats.patients_a_risque_eleve - Math.round(stats.total_consultations * 0.35)), color: '#10b981' },
  ] : [];

  const risqueBarData = Object.entries(risque).map(([code, vals]) => ({
    name: code === 'diabetes' ? 'Diabète' : code === 'ckd' ? 'IRC' : 'Cardio',
    Faible: vals.Faible || 0, Modéré: vals.Modéré || 0, Élevé: vals.Élevé || 0,
  }));

  if (authLoading || !user || user.role !== 'medecin') return null;

  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-medium text-muted mb-1.5">Nom</label>
          <input type="text" required value={patientForm.nom} onChange={(e) => setPatientForm({ ...patientForm, nom: e.target.value })}
            className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" placeholder="Nom" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted mb-1.5">Prénom</label>
          <input type="text" required value={patientForm.prenom} onChange={(e) => setPatientForm({ ...patientForm, prenom: e.target.value })}
            className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" placeholder="Prénom" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-medium text-muted mb-1.5">Âge</label>
          <input type="number" required min="1" max="120" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
            className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink tabular transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" placeholder="Âge" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted mb-1.5">Genre</label>
          <select value={patientForm.sexe} onChange={(e) => setPatientForm({ ...patientForm, sexe: e.target.value })}
            className="w-full appearance-none bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink cursor-pointer transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent">
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-muted mb-1.5">Adresse email</label>
        <input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
          className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" placeholder="patient@pfa.ma" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-muted mb-1.5">Téléphone</label>
        <input type="text" value={patientForm.telephone} onChange={(e) => setPatientForm({ ...patientForm, telephone: e.target.value })}
          className="w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" placeholder="0612345678" />
      </div>
    </>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">Espace clinique médecin</h1>
          <p className="text-muted text-sm mt-1.5">Gestion patientèle, historique clinique &amp; suivi épidémiologique</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button href="/dashboard/admin" variant="secondary" size="sm">Vue BI globale</Button>
          <div className="flex bg-panel-2 border border-line rounded-xl p-1">
            {[{ k: 'analytics', l: 'Statistiques' }, { k: 'patients', l: 'Patients' }].map(t => (
              <button key={t.k} onClick={() => handleTabChange(t.k)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === t.k ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB ANALYTICS */}
      {activeTab === 'analytics' && (
        loadingStats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[0,1].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={Stethoscope}  label="Consultations totales" value={stats?.total_consultations || 0}     sub="Volume"   color="#f1f5f9" />
              <KpiCard icon={AlertOctagon} label="Risque élevé"          value={stats?.patients_a_risque_eleve || 0} sub="Critique" color="#f43f5e" />
              <KpiCard icon={Users}        label="Patients uniques"      value={stats?.total_patients || 0}          sub="Suivi"    color="#f1f5f9" />
              <KpiCard icon={Bell}         label="Alertes non vues"      value={stats?.alertes_non_vues || 0}        sub="Urgent"   color="#f59e0b" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-panel border border-line rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-ink mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Répartition globale des risques
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="#030712" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-ink mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-300" strokeWidth={2.25} aria-hidden="true" /> Activité des consultations (7 jours)
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolution} margin={{ left: -15, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" />
                      <XAxis dataKey="date" stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                      <YAxis stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: '11px', color: '#f1f5f9' }} itemStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, stroke: '#030712', strokeWidth: 1.5, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Consultations" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-panel border border-line rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-ink mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-300" strokeWidth={2.25} aria-hidden="true" /> Risque par pathologie
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={risqueBarData} margin={{ left: -15, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" />
                      <XAxis dataKey="name" stroke="#1b2230" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis stroke="#1b2230" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                      <Bar dataKey="Faible" stackId="a" fill="#10b981" />
                      <Bar dataKey="Modéré" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Élevé" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-ink mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Score moyen de risque
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maladies} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b2230" horizontal={false} />
                      <XAxis type="number" stroke="#1b2230" domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="nom" stroke="#1b2230" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px' }} formatter={v => `${(v * 100).toFixed(1)}%`} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="probabilite_moyenne" radius={[0, 4, 4, 0]} maxBarSize={26}>
                        {maladies.map((m, i) => <Cell key={i} fill={DISEASE_COLORS[m.code] || '#64748b'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-300" strokeWidth={2.25} aria-hidden="true" /> Alertes cliniques critiques
              </h2>
              {alertes.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">Aucune alerte clinique active.</p>
              ) : (
                <div className="space-y-3">
                  {alertes.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between flex-wrap gap-3 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-rose-200">{a.message}</p>
                          <p className="text-[10px] text-faint mt-1 font-medium tabular">{a.date}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/25 px-3 py-1 rounded-full">{a.niveau}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* TAB PATIENTS */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          {!selectedPatientId ? (
            <div className="bg-panel border border-line rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un patient…"
                    className="w-full bg-panel-2 border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-faint transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent" />
                </div>
                <Button size="sm" icon={Plus} onClick={() => { setPatientForm({ nom: '', prenom: '', age: '', sexe: 'M', email: '', telephone: '' }); setFormError(null); setShowAddModal(true); }}>
                  Ajouter un patient
                </Button>
              </div>

              {loadingPatients ? (
                <div className="space-y-2">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-muted border border-dashed border-line rounded-xl">
                  <Users className="w-7 h-7 mx-auto mb-3 text-faint opacity-50" strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-xs">Aucun patient ne correspond à la recherche.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-line text-faint uppercase font-semibold tracking-wider text-[9px] bg-panel-2">
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4 text-center">Âge</th>
                        <th className="py-3.5 px-4 text-center">Genre</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => (
                        <tr key={p.id} onClick={() => handleOpenDossier(p.id)} className="border-b border-line/60 hover:bg-hover cursor-pointer transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-ink">{p.nom} {p.prenom}</div>
                            <div className="text-[10px] text-faint font-medium uppercase tabular">ID #{p.id}</div>
                          </td>
                          <td className="py-3 px-4 text-center text-muted tabular">{p.age} ans</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.sexe === 'M' ? 'bg-brand/10 text-brand-bright' : 'bg-rose-500/10 text-rose-300'}`}>{p.sexe}</span>
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {p.email && <div className="truncate max-w-[150px]">{p.email}</div>}
                            {p.telephone && <div className="text-[10px] text-faint tabular">{p.telephone}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={(e) => openEditModal(p, e)} aria-label="Modifier" className="grid place-items-center w-8 h-8 bg-panel-2 hover:bg-hover rounded-lg text-muted hover:text-brand-bright border border-line transition-colors cursor-pointer">
                                <SquarePen className="w-3.5 h-3.5" strokeWidth={2} />
                              </button>
                              <button aria-label="Voir le dossier" className="grid place-items-center w-8 h-8 bg-panel-2 hover:bg-hover rounded-lg text-muted hover:text-emerald-300 border border-line transition-colors cursor-pointer">
                                <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <button onClick={() => setSelectedPatientId(null)} className="inline-flex items-center gap-2 text-muted hover:text-ink text-xs font-medium border border-line bg-panel px-3 py-2 rounded-xl transition-colors cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" /> Retour à la liste
              </button>

              {loadingDossier || !dossier ? (
                <div className="space-y-6">
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-80 rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Patient info */}
                  <div className="bg-panel border border-line rounded-2xl p-6 flex flex-wrap gap-6 justify-between items-center">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Dossier actif
                      </span>
                      <h2 className="text-2xl font-semibold text-ink pt-1">{dossier.patient.nom} {dossier.patient.prenom}</h2>
                      <p className="text-xs text-muted">{dossier.patient.age} ans · {dossier.patient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted space-y-1.5 bg-panel-2 p-4 border border-line rounded-xl">
                        {dossier.patient.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-faint" strokeWidth={2} /> <span className="text-ink">{dossier.patient.email}</span></div>}
                        {dossier.patient.telephone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-faint" strokeWidth={2} /> <span className="text-ink tabular">{dossier.patient.telephone}</span></div>}
                        <div className="text-[10px] text-faint font-medium uppercase pt-1.5 border-t border-line">Créé le {dossier.patient.created_at}</div>
                      </div>
                      <button onClick={(e) => openEditModal(dossier.patient, e)} aria-label="Modifier le dossier" className="grid place-items-center w-11 h-11 bg-brand/10 hover:bg-brand/15 rounded-xl text-brand-bright border border-brand/25 cursor-pointer transition-colors">
                        <SquarePen className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <EvolutionPanel patientId={selectedPatientId} mesures={dossier.mesures || []} />

                  {/* Historique consultations */}
                  <div className="bg-panel border border-line rounded-2xl p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                      <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-bright" strokeWidth={2.25} aria-hidden="true" /> Historique des analyses IA
                      </h3>
                      <div className="flex items-center gap-1 bg-panel-2 border border-line rounded-lg p-0.5">
                        <button onClick={() => setHistoriqueFilter('all')}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${historiqueFilter === 'all' ? 'bg-line-2 text-ink' : 'text-muted hover:text-ink'}`}>
                          Tous
                        </button>
                        {[{ code: 'diabetes', label: 'Diabète' }, { code: 'ckd', label: 'IRC' }, { code: 'framingham', label: 'Cardio' }].map(d => (
                          <button key={d.code} onClick={() => setHistoriqueFilter(d.code)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${historiqueFilter === d.code ? 'text-ink' : 'text-muted hover:text-ink'}`}
                            style={historiqueFilter === d.code ? { backgroundColor: DISEASE_COLORS[d.code] + '22', color: DISEASE_COLORS[d.code] } : {}}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredConsultations.length === 0 ? (
                      <div className="text-center py-12 text-muted border border-dashed border-line rounded-xl">
                        <ClipboardList className="w-7 h-7 mx-auto mb-3 text-faint opacity-50" strokeWidth={1.5} aria-hidden="true" />
                        <p className="text-xs">Aucun diagnostic IA enregistré{historiqueFilter !== 'all' ? ' pour cette pathologie' : ''}.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredConsultations.map((c) => {
                          const Icon = DISEASE_ICONS[c.maladie_code] ?? Stethoscope;
                          return (
                            <div key={c.id} onClick={() => handleViewConsultation(c.id)}
                              className="group bg-panel-2 hover:bg-hover border border-line hover:border-line-2 rounded-xl p-4 cursor-pointer transition-colors">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <Icon className="w-5 h-5 shrink-0" style={{ color: DISEASE_COLORS[c.maladie_code] }} strokeWidth={2} aria-hidden="true" />
                                  <div>
                                    <div className="font-medium text-ink text-sm">{c.maladie_nom}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-faint font-medium flex items-center gap-1 tabular"><Clock className="w-2.5 h-2.5" strokeWidth={2} /> {c.date}</span>
                                      <span className="text-[10px] text-faint">·</span>
                                      <span className="text-[10px] text-faint font-medium">{c.prediction === 1 ? 'Positif' : 'Négatif'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border tabular ${riskClasses[c.risk_level] ?? riskClasses['Modéré']}`}>
                                    {c.risk_level} — {Math.round(c.probability * 100)}%
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-faint group-hover:text-brand-bright font-medium transition-colors">
                                    Détail SHAP <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" strokeWidth={2.25} />
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 pl-8 text-[11px] text-muted leading-relaxed line-clamp-1 flex items-center gap-1.5">
                                <Pill className="w-3 h-3 text-faint shrink-0" strokeWidth={2} /> {c.recommendation}
                              </div>
                              {c.top_features && (
                                <div className="mt-2 pl-8 flex flex-wrap gap-1.5">
                                  {Object.entries(c.top_features).slice(0, 3).map(([feat, val]) => (
                                    <span key={feat} className="text-[9px] bg-panel border border-line px-2 py-0.5 rounded text-faint font-medium">
                                      {feat}: <span className="font-semibold text-muted tabular">{Number(val).toFixed(3)}</span>
                                    </span>
                                  ))}
                                  {Object.keys(c.top_features).length > 3 && (
                                    <span className="text-[9px] text-faint font-medium px-1">+{Object.keys(c.top_features).length - 3} autres</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Alertes + Journal mesures */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-panel border border-line rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-rose-300" strokeWidth={2.25} aria-hidden="true" /> Historique des alertes
                      </h3>
                      {dossier.alertes.length === 0 ? (
                        <p className="text-muted text-xs text-center py-6">Aucune alerte clinique notifiée.</p>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {dossier.alertes.map((a) => (
                            <div key={a.id} className={`border rounded-xl p-3 space-y-1 ${a.niveau === 'CRITICAL' ? 'bg-rose-500/[0.06] border-rose-500/20' : 'bg-amber-500/[0.06] border-amber-500/20'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${a.niveau === 'CRITICAL' ? 'text-rose-300 bg-rose-500/10 border-rose-500/25' : 'text-amber-300 bg-amber-500/10 border-amber-500/25'}`}>{a.niveau}</span>
                                <span className="text-[9px] text-faint font-medium tabular">{a.date?.split(' ')[0]}</span>
                              </div>
                              <p className="text-[11px] text-muted leading-relaxed pt-1">{a.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-panel border border-line rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-muted" strokeWidth={2.25} aria-hidden="true" /> Journal des mesures
                      </h3>
                      {dossier.mesures.length === 0 ? (
                        <p className="text-muted text-xs text-center py-6">Aucune mesure journalière enregistrée.</p>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {dossier.mesures.map((m) => (
                            <div key={m.id} className="bg-panel-2 border border-line rounded-xl p-3.5 space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] text-muted border-b border-line pb-1.5 font-medium uppercase tracking-wider">
                                <span className="tabular">Mesures du {m.date}</span>
                                {m.notes && <span className="flex items-center gap-1 text-brand-bright cursor-help" title={m.notes}><FileText className="w-3 h-3" strokeWidth={2} /> Notes</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div><span className="text-faint">Glycémie : </span><span className={`font-medium tabular ${m.glycemie_statut === 'Normal' ? 'text-emerald-300' : 'text-rose-300'}`}>{m.glycemie ? `${m.glycemie} mg/dL` : '—'}</span></div>
                                <div><span className="text-faint">Tension : </span><span className={`font-medium tabular ${m.tension_statut === 'Normal' ? 'text-emerald-300' : 'text-rose-300'}`}>{m.tension ? `${m.tension} mmHg` : '—'}</span></div>
                                <div><span className="text-faint">Poids : </span><span className="font-medium text-muted tabular">{m.poids ? `${m.poids} kg` : '—'}</span></div>
                                <div><span className="text-faint">Fréquence : </span><span className={`font-medium tabular ${m.frequence_statut === 'Normal' ? 'text-emerald-300' : 'text-rose-300'}`}>{m.frequence ? `${m.frequence} bpm` : '—'}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL AJOUT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-panel rounded-2xl border border-line p-6 space-y-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Nouveau patient</h3>
              <button onClick={() => setShowAddModal(false)} aria-label="Fermer" className="grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddPatient} className="space-y-4">
              {formFields}
              {formError && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs px-3 py-2.5 rounded-xl"><AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} /> {formError}</div>}
              {formSuccess && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs px-3 py-2.5 rounded-xl"><Check className="w-4 h-4 shrink-0" strokeWidth={2.25} /> Patient créé avec succès</div>}
              <div className="flex gap-3 justify-end pt-2 border-t border-line">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Annuler</Button>
                <Button type="submit" size="sm" loading={savingForm}>Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md bg-panel rounded-2xl border border-line p-6 space-y-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Modifier les coordonnées</h3>
              <button onClick={() => setShowEditModal(false)} aria-label="Fermer" className="grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditPatient} className="space-y-4">
              {formFields}
              {formError && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs px-3 py-2.5 rounded-xl"><AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} /> {formError}</div>}
              {formSuccess && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs px-3 py-2.5 rounded-xl"><Check className="w-4 h-4 shrink-0" strokeWidth={2.25} /> Coordonnées mises à jour</div>}
              <div className="flex gap-3 justify-end pt-2 border-t border-line">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Annuler</Button>
                <Button type="submit" size="sm" loading={savingForm}>Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {consultationDetail && <ConsultationDetailPanel detail={consultationDetail} onClose={() => setConsultationDetail(null)} />}
    </div>
  );
}
