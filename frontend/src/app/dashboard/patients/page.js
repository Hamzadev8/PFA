'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useRouter } from 'next/navigation';
import { getPatients, createPatient, updatePatient, getPatientDossier } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Skeleton, SkeletonText } from '../../components/ui/Skeleton';
import {
  Plus, SquarePen, FolderOpen, X, Search, User,
  AlertTriangle, Droplet, Filter, HeartPulse, Stethoscope, Activity, Bell,
} from 'lucide-react';

const EMPTY_FORM = { nom: '', prenom: '', age: '', sexe: 'M', email: '', telephone: '' };
const DISEASE_ICON = { diabetes: Droplet, ckd: Filter, framingham: HeartPulse };
const RISK_TONE = { 'Élevé': 'danger', 'Modéré': 'warning', 'Faible': 'success' };

// ── Modale Dossier Patient ──────────────────────────────────
function DossierModal({ patientId, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('consultations');

  useEffect(() => {
    getPatientDossier(patientId)
      .then(setDossier)
      .catch(() => setError('Impossible de charger le dossier.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  const tabs = [
    { key: 'consultations', icon: Stethoscope, label: 'Consultations', count: dossier?.consultations.length },
    { key: 'mesures',       icon: Activity,    label: 'Mesures',       count: dossier?.mesures.length },
    { key: 'alertes',       icon: Bell,        label: 'Alertes',       count: dossier?.alertes.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-canvas/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-panel border border-line rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/10 border border-brand/25 shrink-0">
              <FolderOpen className="w-4 h-4 text-brand-bright" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink truncate">
                {dossier ? `${dossier.patient.prenom} ${dossier.patient.nom}` : 'Dossier médical'}
              </h2>
              {dossier && (
                <p className="text-[11px] text-faint truncate">
                  {dossier.patient.age} ans · {dossier.patient.sexe === 'M' ? 'Homme' : 'Femme'} · {dossier.patient.email}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <div className="p-6 space-y-3"><SkeletonText lines={4} /></div>}
        {error && (
          <div className="flex-1 flex items-center justify-center gap-2 text-rose-300 text-sm py-12">
            <AlertTriangle className="w-4 h-4" strokeWidth={2.25} /> {error}
          </div>
        )}

        {dossier && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-line px-4 pt-3 gap-1">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                      tab === t.key ? 'text-ink border-brand' : 'text-muted hover:text-ink border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
                    {t.label} <span className="text-faint">({t.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {tab === 'consultations' && (
                dossier.consultations.length === 0
                  ? <p className="text-muted text-sm text-center py-8">Aucune consultation enregistrée.</p>
                  : dossier.consultations.map(c => {
                    const Icon = DISEASE_ICON[c.maladie_code] ?? Activity;
                    return (
                      <div key={c.id} className="bg-panel-2 border border-line rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Icon className="w-4 h-4 text-muted shrink-0" strokeWidth={2} aria-hidden="true" />
                            <span className="text-sm font-medium text-ink">{c.maladie_nom}</span>
                            <Badge tone={RISK_TONE[c.risk_level] ?? 'neutral'}>{c.risk_level}</Badge>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">{c.recommendation}</p>
                          <p className="text-[10px] text-faint mt-1 tabular">{c.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="tabular text-lg font-semibold text-ink">{(c.probability * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-faint">probabilité</p>
                        </div>
                      </div>
                    );
                  })
              )}

              {tab === 'mesures' && (
                dossier.mesures.length === 0
                  ? <p className="text-muted text-sm text-center py-8">Aucune mesure enregistrée.</p>
                  : dossier.mesures.map(m => (
                    <div key={m.id} className="bg-panel-2 border border-line rounded-xl p-4">
                      <p className="text-[10px] text-faint font-medium mb-2 tabular">{m.date}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Glycémie',  val: m.glycemie,  unit: 'mg/dL', statut: m.glycemie_statut },
                          { label: 'Tension',   val: m.tension,   unit: 'mmHg',  statut: m.tension_statut },
                          { label: 'Poids',     val: m.poids,     unit: 'kg',    statut: m.poids_statut },
                          { label: 'Fréquence', val: m.frequence, unit: 'bpm',   statut: m.frequence_statut },
                        ].filter(x => x.val !== null).map(x => (
                          <div key={x.label} className="bg-panel rounded-lg px-3 py-2 border border-line">
                            <p className="text-[10px] text-faint font-medium uppercase tracking-wider">{x.label}</p>
                            <p className="tabular text-sm font-medium text-ink">{x.val} <span className="text-[10px] text-faint">{x.unit}</span></p>
                            {x.statut && (
                              <span className={`text-[9px] font-semibold ${
                                x.statut === 'Normal' ? 'text-emerald-300' : x.statut === 'Élevé' ? 'text-rose-300' : 'text-brand-bright'
                              }`}>{x.statut}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}

              {tab === 'alertes' && (
                dossier.alertes.length === 0
                  ? <p className="text-muted text-sm text-center py-8">Aucune alerte.</p>
                  : dossier.alertes.map(a => (
                    <div key={a.id} className="bg-rose-500/[0.06] border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                      <div>
                        <p className="text-xs font-medium text-rose-200">{a.niveau} · {a.maladie}</p>
                        <p className="text-xs text-muted mt-0.5">{a.message}</p>
                        <p className="text-[10px] text-faint mt-1 tabular">{a.date}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modale Formulaire Patient ───────────────────────────────
function PatientFormModal({ patient, onClose, onSaved }) {
  const [form, setForm]     = useState(patient ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const isEdit = !!patient;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await updatePatient(patient.id, form);
      else await createPatient(form);
      onSaved();
    } catch (err) {
      setError(err.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'nom',       label: 'Nom',       type: 'text',   required: true,  colSpan: 1 },
    { key: 'prenom',    label: 'Prénom',    type: 'text',   required: true,  colSpan: 1 },
    { key: 'age',       label: 'Âge',       type: 'number', required: false, colSpan: 1 },
    { key: 'telephone', label: 'Téléphone', type: 'text',   required: false, colSpan: 1 },
    { key: 'email',     label: 'Email',     type: 'email',  required: false, colSpan: 2 },
  ];

  const inputCls = 'w-full bg-panel-2 border border-line rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-canvas/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-panel border border-line rounded-2xl w-full max-w-md shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            {isEdit
              ? <SquarePen className="w-4 h-4 text-brand-bright" strokeWidth={2} aria-hidden="true" />
              : <Plus className="w-4 h-4 text-emerald-300" strokeWidth={2.25} aria-hidden="true" />}
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.colSpan === 2 ? 'col-span-2' : ''}>
                <label htmlFor={`p-${f.key}`} className="block text-[11px] font-medium text-muted mb-1.5">{f.label}</label>
                <input id={`p-${f.key}`} type={f.type} value={form[f.key] ?? ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required} className={inputCls} />
              </div>
            ))}
            <div>
              <label htmlFor="p-sexe" className="block text-[11px] font-medium text-muted mb-1.5">Sexe</label>
              <select id="p-sexe" value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })}
                className={`${inputCls} cursor-pointer appearance-none`}>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={saving} className="flex-1">{isEdit ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────
export default function PatientsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [modalForm, setModalForm]   = useState(null);
  const [dossierPatientId, setDossierPatientId] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await getPatients());
    } catch {
      setError("Impossible de charger les patients. Vérifiez la connexion à l'API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  if (authLoading || !user || user.role !== 'admin') return null;

  const filtered = patients.filter(p =>
    `${p.nom} ${p.prenom} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">Gestion des patients</h1>
          <p className="text-muted text-sm mt-1.5">
            {loading ? '—' : `${patients.length} patient${patients.length > 1 ? 's' : ''} enregistré${patients.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setModalForm('new')} icon={Plus}>Nouveau patient</Button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={2} aria-hidden="true" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-panel-2 border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-brand-bright/50 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-panel border border-line rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3 rounded" /><Skeleton className="h-2.5 w-1/2 rounded" /></div>
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <User className="w-9 h-9 mx-auto mb-3 text-faint opacity-50" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">{search ? 'Aucun résultat pour cette recherche.' : 'Aucun patient enregistré.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-panel border border-line rounded-2xl p-5 flex flex-col gap-4 hover:border-line-2 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-panel-2 border border-line shrink-0">
                  <User className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.prenom} {p.nom}</p>
                  <p className="text-[11px] text-faint truncate">{p.email ?? '—'}</p>
                </div>
                <Badge tone="neutral" className="shrink-0 tabular">#{p.id}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Âge',  value: p.age ? `${p.age} ans` : '—' },
                  { label: 'Sexe', value: p.sexe === 'M' ? 'Homme' : 'Femme' },
                  { label: 'Tél.', value: p.telephone ?? '—' },
                ].map(x => (
                  <div key={x.label} className="bg-panel-2 rounded-lg px-2 py-1.5 border border-line">
                    <p className="text-[9px] font-medium text-faint uppercase tracking-wider">{x.label}</p>
                    <p className="text-[11px] font-medium text-muted truncate">{x.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm" className="flex-1" icon={FolderOpen} onClick={() => setDossierPatientId(p.id)}>Dossier</Button>
                <Button variant="secondary" size="sm" className="flex-1" icon={SquarePen} onClick={() => setModalForm(p)}>Modifier</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalForm && (
        <PatientFormModal
          patient={modalForm === 'new' ? null : modalForm}
          onClose={() => setModalForm(null)}
          onSaved={() => { setModalForm(null); fetchPatients(); }}
        />
      )}
      {dossierPatientId && (
        <DossierModal patientId={dossierPatientId} onClose={() => setDossierPatientId(null)} />
      )}
    </div>
  );
}
