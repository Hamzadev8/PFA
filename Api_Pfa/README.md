# API PFA — Plateforme IA Maladies Chroniques

## Structure du projet

```
api_pfa/
├── main.py                        # Point d'entrée FastAPI
├── requirements.txt
├── models/
│   ├── loader.py                  # Chargement des .pkl + SHAP
│   └── __init__.py
├── routers/
│   ├── predict_helper.py          # Pipeline préprocessing → prédiction → SHAP
│   ├── diabetes.py                # POST /predict/diabetes
│   ├── ckd.py                     # POST /predict/ckd
│   ├── framingham.py              # POST /predict/framingham
│   ├── shap_routes.py             # GET  /shap/importance/{disease}
│   └── __init__.py
└── schemas/
    ├── schemas.py                 # Modèles Pydantic (entrée + sortie)
    └── __init__.py
```

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Copier tes fichiers `.pkl` dans un dossier `models_pkl/` à la racine :

```
models_pkl/
├── model_diabetes.pkl
├── scaler_diabetes.pkl
├── imputer_diabetes.pkl
├── model_ckd.pkl
├── scaler_ckd.pkl
├── imputer_ckd.pkl
├── model_framingham.pkl
├── scaler_framingham.pkl
└── imputer_framingham.pkl
```

Copier tes fichiers SHAP dans `shap_outputs/` :

```
shap_outputs/
├── importance_diabetes.csv
├── importance_ckd.csv
└── importance_framingham.csv
```

> Format des CSV : deux colonnes `feature` et `importance`

## Lancement

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Documentation interactive

Ouvrir dans le navigateur :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc**       : http://localhost:8000/redoc

## Exemples d'appels

### Prédiction diabète
```bash
curl -X POST http://localhost:8000/predict/diabetes \
  -H "Content-Type: application/json" \
  -d '{
    "Pregnancies": 2, "Glucose": 148, "BloodPressure": 72,
    "SkinThickness": 35, "Insulin": 0, "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627, "Age": 50
  }'
```

### Prédiction IRC
```bash
curl -X POST http://localhost:8000/predict/ckd \
  -H "Content-Type: application/json" \
  -d '{
    "age": 55, "bp": 90, "sg": 1.01, "al": 3, "su": 0,
    "rbc": 1, "pc": 1, "pcc": 0, "ba": 0, "bgr": 200,
    "bu": 80, "sc": 4.5, "sod": 130, "pot": 5.0, "hemo": 8,
    "pcv": 25, "wbcc": 9000, "rbcc": 3.0, "htn": 1, "dm": 1,
    "cad": 0, "appet": 0, "pe": 1, "ane": 1
  }'
```

### Importance SHAP globale
```bash
curl http://localhost:8000/shap/importance/ckd
```

## Réponse type

```json
{
  "disease": "Insuffisance Rénale Chronique (IRC)",
  "prediction": 1,
  "probability": 0.8742,
  "risk_level": "Élevé",
  "recommendation": "Consultation néphrologue urgente. Bilan rénal complet...",
  "shap_values": { "sg": -0.142, "hemo": 0.098, "pcv": 0.075, ... },
  "shap_base_value": 0.604,
  "top_features": { "sg": -0.142, "hemo": 0.098, "pcv": 0.075, "htn": 0.059, "al": 0.040 }
}
```
