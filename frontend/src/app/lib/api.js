const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('pfa_token');
};

const authFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem('pfa_token');
    sessionStorage.removeItem('pfa_user');
    document.cookie = 'pfa_role=; path=/; max-age=0';
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Erreur serveur ${res.status}`);
  }

  return res.json();
};

// ── Prédictions ─────────────────────────────
export const predictDiabetes   = (data) => authFetch('/predict/diabetes',   { method: 'POST', body: JSON.stringify(data) });
export const predictCKD        = (data) => authFetch('/predict/ckd',        { method: 'POST', body: JSON.stringify(data) });
export const predictFramingham = (data) => authFetch('/predict/framingham', { method: 'POST', body: JSON.stringify(data) });

// ── SHAP ─────────────────────────────────────
export const getShapImportance = (disease) => authFetch(`/shap/importance/${disease}`);

// ── DWH Stats ────────────────────────────────
export const getDwhStatsGlobal      = ()      => authFetch('/dwh/stats/global');
export const getDwhStatsByDisease   = ()      => authFetch('/dwh/stats/par_maladie');
export const getDwhEvolution        = (jours = 30) => authFetch(`/dwh/stats/evolution?jours=${jours}`);
export const getDwhRisqueDistrib    = ()      => authFetch('/dwh/stats/risque_distribution');

// ── Alertes ──────────────────────────────────
export const getDwhAlertes = () => authFetch('/dwh/alertes');

// ── Patients ─────────────────────────────────
export const getPatients           = ()              => authFetch('/dwh/patients');
export const createPatient         = (data)          => authFetch('/dwh/patient',          { method: 'POST', body: JSON.stringify(data) });
export const updatePatient         = (id, data)      => authFetch(`/dwh/patient/${id}`,    { method: 'PUT',  body: JSON.stringify(data) });
export const getPatientDossier     = (id)            => authFetch(`/dwh/patient/${id}/dossier`);
export const getPatientConsultations = (id, maladie) => authFetch(`/dwh/patient/${id}/consultations${maladie ? `?maladie_code=${maladie}` : ''}`);
export const getPatientEvolution   = (id, metrique = 'glycemie', jours = 30) =>
  authFetch(`/dwh/patient/${id}/evolution?metrique=${metrique}&jours=${jours}`);

// ── Consultations ─────────────────────────────
export const getConsultationDetail = (id)   => authFetch(`/dwh/consultation/${id}`);
export const saveConsultation      = (data) => authFetch('/dwh/consultation', { method: 'POST', body: JSON.stringify(data) });
export const saveMesure            = (data) => authFetch('/dwh/mesure',       { method: 'POST', body: JSON.stringify(data) });
