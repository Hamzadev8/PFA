from fastapi import APIRouter, HTTPException
from schemas.schemas import FraminghamInput, PredictionResponse
from models.loader import model_framingham, scaler_framingham, imputer_framingham
from routers.predict_helper import run_prediction, FEATURES_FRAMINGHAM

router = APIRouter()

@router.post("/framingham", response_model=PredictionResponse, summary="Prédiction risque cardiovasculaire")
def predict_framingham(patient: FraminghamInput):
    """
    Prédit le risque cardiovasculaire sur 10 ans (score de Framingham).

    - **prediction** : 0 = faible risque, 1 = risque élevé
    - **probability** : probabilité de la classe 1 (0.0 → 1.0)
    - **shap_values** : contribution de chaque feature (age, sysBP, totChol...)
    - **top_features** : 5 features les plus influentes
    """
    try:
        result = run_prediction(
            model    = model_framingham,
            imputer  = imputer_framingham,
            scaler   = scaler_framingham,
            data_dict= patient.dict(),
            features = FEATURES_FRAMINGHAM,
            disease_key = "framingham"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction cardio : {str(e)}")
