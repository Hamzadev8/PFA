from pydantic import BaseModel, Field
from typing import Dict, Optional

# ─────────────────────────────────────────────
# Schémas d'entrée (données patient)
# ─────────────────────────────────────────────

class DiabetesInput(BaseModel):
    Pregnancies:              float = Field(..., example=2,    description="Nombre de grossesses")
    Glucose:                  float = Field(..., example=120,  description="Concentration glucose (mg/dL)")
    BloodPressure:            float = Field(..., example=70,   description="Pression artérielle (mm Hg)")
    SkinThickness:            float = Field(..., example=20,   description="Épaisseur peau (mm)")
    Insulin:                  float = Field(..., example=80,   description="Insuline 2h (mu U/ml)")
    BMI:                      float = Field(..., example=25.5, description="IMC (kg/m²)")
    DiabetesPedigreeFunction: float = Field(..., example=0.5,  description="Fonction pedigree diabète")
    Age:                      float = Field(..., example=35,   description="Âge (ans)")

class CKDInput(BaseModel):
    age:   float = Field(..., example=50)
    bp:    float = Field(..., example=80,  description="Pression artérielle")
    sg:    float = Field(..., example=1.02, description="Densité urinaire")
    al:    float = Field(..., example=1,   description="Albumine urinaire (0-5)")
    su:    float = Field(..., example=0,   description="Sucre urinaire (0-5)")
    rbc:   float = Field(..., example=0,   description="GR urine (0=normal, 1=anormal)")
    pc:    float = Field(..., example=0,   description="Pus cellulaire (0=normal, 1=anormal)")
    pcc:   float = Field(..., example=0,   description="Caillots pus (0=non, 1=oui)")
    ba:    float = Field(..., example=0,   description="Bactéries (0=non, 1=oui)")
    bgr:   float = Field(..., example=100, description="Glycémie aléatoire (mg/dL)")
    bu:    float = Field(..., example=30,  description="Urée sanguine (mg/dL)")
    sc:    float = Field(..., example=1.0, description="Créatinine sérique (mg/dL)")
    sod:   float = Field(..., example=140, description="Sodium (mEq/L)")
    pot:   float = Field(..., example=4.5, description="Potassium (mEq/L)")
    hemo:  float = Field(..., example=13,  description="Hémoglobine (g/dL)")
    pcv:   float = Field(..., example=40,  description="Hématocrite (%)")
    wc:  float = Field(..., example=8000, description="Globules blancs (/cumm)")
    rc:  float = Field(..., example=4.5,  description="Globules rouges (millions/cumm)")
    htn:   float = Field(..., example=0,   description="Hypertension (0=non, 1=oui)")
    dm:    float = Field(..., example=0,   description="Diabète (0=non, 1=oui)")
    cad:   float = Field(..., example=0,   description="Coronaropathie (0=non, 1=oui)")
    appet: float = Field(..., example=1,   description="Appétit (0=mauvais, 1=bon)")
    pe:    float = Field(..., example=0,   description="Œdème (0=non, 1=oui)")
    ane:   float = Field(..., example=0,   description="Anémie (0=non, 1=oui)")

class FraminghamInput(BaseModel):
    male:           float = Field(..., example=1,   description="Sexe (1=homme, 0=femme)")
    age:            float = Field(..., example=55,  description="Âge (ans)")
    education:      float = Field(..., example=2,   description="Niveau éducation (1-4)")
    currentSmoker:  float = Field(..., example=0,   description="Fumeur actuel (0/1)")
    cigsPerDay:     float = Field(..., example=0,   description="Cigarettes/jour")
    BPMeds:         float = Field(..., example=0,   description="Médicaments TA (0/1)")
    prevalentStroke:float = Field(..., example=0,   description="AVC préexistant (0/1)")
    prevalentHyp:   float = Field(..., example=1,   description="Hypertension (0/1)")
    diabetes:       float = Field(..., example=0,   description="Diabète (0/1)")
    totChol:        float = Field(..., example=230, description="Cholestérol total (mg/dL)")
    sysBP:          float = Field(..., example=140, description="Pression systolique (mm Hg)")
    diaBP:          float = Field(..., example=90,  description="Pression diastolique (mm Hg)")
    BMI:            float = Field(..., example=27,  description="IMC (kg/m²)")
    heartRate:      float = Field(..., example=75,  description="Fréquence cardiaque (bpm)")
    glucose:        float = Field(..., example=85,  description="Glycémie (mg/dL)")

# ─────────────────────────────────────────────
# Schéma de réponse commun
# ─────────────────────────────────────────────

class PredictionResponse(BaseModel):
    disease:          str
    prediction:       int            # 0 = faible risque, 1 = risque élevé
    probability:      float          # probabilité classe 1 (0.0 → 1.0)
    risk_level:       str            # "Faible" / "Modéré" / "Élevé"
    recommendation:   str
    shap_values:      Dict[str, float]
    shap_base_value:  float
    top_features:     Dict[str, float]  # top 5 features SHAP

class SHAPImportanceResponse(BaseModel):
    disease:    str
    features:   Dict[str, float]   # feature -> importance moyenne
