from fastapi import APIRouter, HTTPException
from schemas.schemas import DiabetesInput, PredictionResponse
from models.loader import model_diabetes, scaler_diabetes, imputer_diabetes
from routers.predict_helper import run_prediction, FEATURES_DIABETES

router = APIRouter()

@router.post("/diabetes", response_model=PredictionResponse, summary="Prédiction risque diabète")
def predict_diabetes(patient: DiabetesInput):
    """
    Prédit le risque de diabète pour un patient.

    - **prediction** : 0 = faible risque, 1 = risque élevé
    - **probability** : probabilité de la classe 1 (0.0 → 1.0)
    - **shap_values** : contribution de chaque feature à la prédiction
    - **top_features** : 5 features les plus influentes
    """
    try:
        result = run_prediction(
            model    = model_diabetes,
            imputer  = imputer_diabetes,
            scaler   = scaler_diabetes,
            data_dict= patient.dict(),
            features = FEATURES_DIABETES,
            disease_key = "diabetes"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction diabète : {str(e)}")
