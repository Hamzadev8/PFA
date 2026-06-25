import numpy as np
from models.loader import compute_shap_single
from models.database import SessionLocal
from models.models import FactConsultation, DimMaladie, FactAlerteRisque

FEATURES_DIABETES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

FEATURES_CKD = [
    "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba",
    "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc",
    "rc", "htn", "dm", "cad", "appet", "pe", "ane"
]

FEATURES_FRAMINGHAM = [
    "male", "age", "education", "currentSmoker", "cigsPerDay",
    "BPMeds", "prevalentStroke", "prevalentHyp", "diabetes",
    "totChol", "sysBP", "diaBP", "BMI", "heartRate", "glucose"
]

DISEASE_NAMES = {
    "diabetes":   "Diabète",
    "ckd":        "Insuffisance Rénale Chronique (IRC)",
    "framingham": "Risque Cardiovasculaire (Framingham)"
}


def risk_label(prob: float) -> str:
    if prob < 0.35:
        return "Faible"
    elif prob < 0.65:
        return "Modéré"
    return "Élevé"


def recommendation(disease: str, risk: str) -> str:
    recs = {
        "diabetes": {
            "Faible":  "Maintenir un mode de vie sain. Contrôle glycémique annuel recommandé.",
            "Modéré":  "Surveillance glycémique régulière. Réduire les sucres rapides. Activité physique 30 min/jour.",
            "Élevé":   "Consultation endocrinologique urgente. Bilan HbA1c, HGPO. Mise sous traitement à évaluer."
        },
        "ckd": {
            "Faible":  "Hydratation correcte. Contrôle créatinine annuel.",
            "Modéré":  "Surveillance créatinine et protéinurie tous les 3 mois. Contrôle TA strict (< 130/80).",
            "Élevé":   "Consultation néphrologue urgente. Bilan rénal complet. Régime hypoprotidique et hyposodé."
        },
        "framingham": {
            "Faible":  "Mode de vie sain. Bilan lipidique tous les 5 ans.",
            "Modéré":  "Contrôle tensionnel et lipidique régulier. Arrêt du tabac. Activité cardio recommandée.",
            "Élevé":   "Consultation cardiologique urgente. ECG, écho cardiaque. Statines et antihypertenseurs à évaluer."
        }
    }
    return recs.get(disease, {}).get(risk, "Consulter un médecin spécialiste.")


def save_to_dwh(result: dict, disease_key: str, features_input: dict):
    """Sauvegarde la prédiction dans le DWH PostgreSQL."""
    print(f">>> save_to_dwh appelée pour : {disease_key}")
    try:
        db = SessionLocal()
        maladie = db.query(DimMaladie).filter(DimMaladie.code == disease_key).first()
        if maladie:
            consultation = FactConsultation(
                maladie_id      = maladie.id,
                prediction      = result["prediction"],
                probabilite     = result["probability"],
                niveau_risque   = result["risk_level"],
                recommendation  = result["recommendation"],
                features_input  = features_input,
                shap_values     = result["shap_values"],
                shap_base_value = result["shap_base_value"],
                top_features    = result["top_features"],
            )
            db.add(consultation)

            # Alerte automatique si risque élevé
            if result["risk_level"] == "Élevé":
                db.add(FactAlerteRisque(
                    maladie_code  = disease_key,
                    niveau_alerte = "CRITICAL",
                    message       = f"Risque élevé : {disease_key} — {result['probability']*100:.1f}%"
                ))
            db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DWH save error : {e}")
    finally:
        db.close()


def run_prediction(model, imputer, scaler, data_dict: dict, features: list, disease_key: str) -> dict:
    """Pipeline complet : préprocessing → prédiction → SHAP → sauvegarde DWH → réponse."""
    import pandas as pd

    # 1. Préprocessing
    df = pd.DataFrame([data_dict], columns=features)
    X_imputed = imputer.transform(df)
    X_scaled  = scaler.transform(X_imputed)

    # 2. Prédiction
    prob       = float(model.predict_proba(X_scaled)[0][1])
    prediction = int(prob >= 0.5)
    risk       = risk_label(prob)

    # 3. SHAP pour ce patient
    shap_dict, base_val = compute_shap_single(model, X_scaled, features)

    # 4. Top 5 features
    top5 = dict(
        sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
    )

    # 5. Résultat final
    result = {
        "disease":         DISEASE_NAMES[disease_key],
        "prediction":      prediction,
        "probability":     round(prob, 4),
        "risk_level":      risk,
        "recommendation":  recommendation(disease_key, risk),
        "shap_values":     shap_dict,
        "shap_base_value": base_val,
        "top_features":    top5
    }

    # 6. Sauvegarde dans le DWH
    save_to_dwh(result, disease_key, data_dict)

    return result