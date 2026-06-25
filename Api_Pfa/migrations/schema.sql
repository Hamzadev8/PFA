-- ============================================================
-- SCHÉMA DATA WAREHOUSE — Plateforme IA Maladies Chroniques
-- PFA 2026
-- ============================================================

-- Créer la base de données
-- CREATE DATABASE pfa_maladies;

-- ─────────────────────────────────────────────
-- DIMENSIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dim_patient (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100),
    prenom      VARCHAR(100),
    age         INTEGER,
    sexe        VARCHAR(10),
    email       VARCHAR(150) UNIQUE,
    telephone   VARCHAR(20),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dim_medecin (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100),
    prenom      VARCHAR(100),
    specialite  VARCHAR(100),
    email       VARCHAR(150) UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dim_maladie (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE,   -- diabetes / ckd / framingham
    nom         VARCHAR(100),
    description TEXT,
    modele_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS dim_temps (
    id        SERIAL PRIMARY KEY,
    date      TIMESTAMP WITH TIME ZONE UNIQUE,
    annee     INTEGER,
    mois      INTEGER,
    semaine   INTEGER,
    jour      INTEGER,
    trimestre INTEGER
);

-- ─────────────────────────────────────────────
-- FAITS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fact_consultation (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER REFERENCES dim_patient(id),
    medecin_id      INTEGER REFERENCES dim_medecin(id),
    maladie_id      INTEGER REFERENCES dim_maladie(id) NOT NULL,
    temps_id        INTEGER REFERENCES dim_temps(id),

    -- Résultat IA
    prediction      INTEGER,            -- 0 ou 1
    probabilite     FLOAT,              -- 0.0 → 1.0
    niveau_risque   VARCHAR(20),        -- Faible / Modéré / Élevé
    recommendation  TEXT,

    -- Données JSON
    features_input  JSONB,              -- données saisies par le médecin
    shap_values     JSONB,              -- valeurs SHAP par feature
    shap_base_value FLOAT,
    top_features    JSONB,              -- top 5 features

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fact_mesure_quotidienne (
    id               SERIAL PRIMARY KEY,
    patient_id       INTEGER REFERENCES dim_patient(id),
    glycemie         FLOAT,             -- mg/dL  (normal: 70-100)
    tension          FLOAT,             -- mm Hg  (normal: 90-130)
    poids            FLOAT,             -- kg
    frequence        FLOAT,             -- bpm    (normal: 60-100)
    glycemie_statut  VARCHAR(10),       -- Normal / Élevé / Bas
    tension_statut   VARCHAR(10),
    poids_statut     VARCHAR(10),
    frequence_statut VARCHAR(10),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fact_alerte_risque (
    id              SERIAL PRIMARY KEY,
    consultation_id INTEGER REFERENCES fact_consultation(id),
    patient_id      INTEGER REFERENCES dim_patient(id),
    maladie_code    VARCHAR(20),
    niveau_alerte   VARCHAR(20),        -- WARNING / CRITICAL
    message         TEXT,
    vue             INTEGER DEFAULT 0,  -- 0=non vue, 1=vue
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEX pour les performances BI
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_consultation_maladie  ON fact_consultation(maladie_id);
CREATE INDEX IF NOT EXISTS idx_consultation_risque   ON fact_consultation(niveau_risque);
CREATE INDEX IF NOT EXISTS idx_consultation_date     ON fact_consultation(created_at);
CREATE INDEX IF NOT EXISTS idx_mesure_patient        ON fact_mesure_quotidienne(patient_id);
CREATE INDEX IF NOT EXISTS idx_mesure_date           ON fact_mesure_quotidienne(created_at);
CREATE INDEX IF NOT EXISTS idx_alerte_vue            ON fact_alerte_risque(vue);

-- ─────────────────────────────────────────────
-- DONNÉES DE RÉFÉRENCE
-- ─────────────────────────────────────────────

INSERT INTO dim_maladie (code, nom, description, modele_type) VALUES
('diabetes',   'Diabète',                       'Prédiction risque diabétique (Pima Indians)',         'GradientBoostingClassifier'),
('ckd',        'Insuffisance Rénale (IRC)',      'Détection précoce IRC (CKD UCI)',                    'LogisticRegression'),
('framingham', 'Risque Cardiovasculaire',        'Score Framingham — risque cardiovasculaire 10 ans',  'LogisticRegression')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────
-- VUES BI utiles
-- ─────────────────────────────────────────────

-- Vue : taux de risque par maladie
CREATE OR REPLACE VIEW vue_risque_par_maladie AS
SELECT
    m.code,
    m.nom,
    COUNT(c.id)                                              AS total_consultations,
    ROUND(AVG(c.probabilite)::numeric, 3)                   AS prob_moyenne,
    COUNT(CASE WHEN c.niveau_risque = 'Élevé'  THEN 1 END)  AS risque_eleve,
    COUNT(CASE WHEN c.niveau_risque = 'Modéré' THEN 1 END)  AS risque_modere,
    COUNT(CASE WHEN c.niveau_risque = 'Faible' THEN 1 END)  AS risque_faible
FROM dim_maladie m
LEFT JOIN fact_consultation c ON m.id = c.maladie_id
GROUP BY m.code, m.nom;

-- Vue : évolution mensuelle
CREATE OR REPLACE VIEW vue_evolution_mensuelle AS
SELECT
    DATE_TRUNC('month', created_at) AS mois,
    COUNT(*)                         AS total,
    COUNT(CASE WHEN niveau_risque = 'Élevé' THEN 1 END) AS risque_eleve
FROM fact_consultation
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mois;
