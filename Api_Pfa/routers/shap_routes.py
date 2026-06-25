from fastapi import APIRouter, HTTPException
from schemas.schemas import SHAPImportanceResponse
import pandas as pd
import os

router = APIRouter()

SHAP_DIR = os.getenv("SHAP_DIR", "./shap_outputs")

DISEASE_MAP = {
    "diabetes":   "importance_diabetes.csv",
    "ckd":        "importance_ckd.csv",
    "framingham": "importance_framingham.csv"
}

DISEASE_NAMES = {
    "diabetes":   "Diabète",
    "ckd":        "Insuffisance Rénale Chronique",
    "framingham": "Risque Cardiovasculaire (Framingham)"
}

@router.get(
    "/importance/{disease}",
    response_model=SHAPImportanceResponse,
    summary="Importance SHAP globale par maladie"
)
def get_shap_importance(disease: str):
    """
    Retourne l'importance SHAP moyenne de chaque feature pour une maladie.

    - **disease** : `diabetes` | `ckd` | `framingham`

    Utilisé par le dashboard BI pour afficher les bar charts d'importance.
    """
    if disease not in DISEASE_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Maladie '{disease}' inconnue. Choisir parmi : {list(DISEASE_MAP.keys())}"
        )

    csv_path = os.path.join(SHAP_DIR, DISEASE_MAP[disease])
    if not os.path.exists(csv_path):
        raise HTTPException(
            status_code=503,
            detail=f"Fichier SHAP introuvable : {csv_path}. Lancer d'abord le notebook SHAP."
        )

    try:
        df = pd.read_csv(csv_path)

        # Format attendu : colonnes 'feature' et 'importance'
        # (tel qu'exporté par : pd.DataFrame({'feature': ..., 'importance': ...}).to_csv())
        if "feature" in df.columns and "importance" in df.columns:
            features_dict = dict(zip(df["feature"], df["importance"].round(6)))
        else:
            # Fallback : première colonne = feature, deuxième = importance
            features_dict = dict(zip(df.iloc[:, 0], df.iloc[:, 1].round(6)))

        # Trier par importance décroissante
        features_dict = dict(
            sorted(features_dict.items(), key=lambda x: x[1], reverse=True)
        )

        return {
            "disease":  DISEASE_NAMES[disease],
            "features": features_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lecture SHAP : {str(e)}")


@router.get("/importance", summary="Liste des maladies disponibles")
def list_diseases():
    return {"available_diseases": list(DISEASE_MAP.keys())}
