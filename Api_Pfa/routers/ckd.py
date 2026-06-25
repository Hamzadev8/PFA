from fastapi import APIRouter, HTTPException
from schemas.schemas import CKDInput, PredictionResponse
from models.loader import model_ckd, scaler_ckd, imputer_ckd
from routers.predict_helper import run_prediction, FEATURES_CKD

router = APIRouter()

@router.post("/ckd", response_model=PredictionResponse, summary="Prédiction risque IRC (CKD)")
def predict_ckd(patient: CKDInput):
    """
    Prédit le risque d'insuffisance rénale chronique (IRC/CKD).

    - **prediction** : 0 = faible risque, 1 = risque élevé
    - **probability** : probabilité de la classe 1 (0.0 → 1.0)
    - **shap_values** : contribution de chaque feature (sg, hemo, pcv, htn, al...)
    - **top_features** : 5 features les plus influentes
    """
    try:
        result = run_prediction(
            model    = model_ckd,
            imputer  = imputer_ckd,
            scaler   = scaler_ckd,
            data_dict= patient.dict(),
            features = FEATURES_CKD,
            disease_key = "ckd"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction IRC : {str(e)}")
