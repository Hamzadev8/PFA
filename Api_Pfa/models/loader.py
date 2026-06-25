import joblib
import numpy as np
import os

# Chemin vers tes fichiers .pkl (adapter si besoin)
MODELS_DIR = os.getenv("MODELS_DIR", "./models_pkl")

def load_artifact(name: str):
    path = os.path.join(MODELS_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Fichier introuvable : {path}")
    return joblib.load(path)

# ── Chargement au démarrage (une seule fois) ──────────────────────────────────
print("Chargement des modèles...")

model_diabetes    = load_artifact("model_diabetes.pkl")
scaler_diabetes   = load_artifact("scaler_diabetes.pkl")
imputer_diabetes  = load_artifact("imputer_diabetes.pkl")

model_ckd         = load_artifact("model_ckd.pkl")
scaler_ckd        = load_artifact("scaler_ckd.pkl")
imputer_ckd       = load_artifact("imputer_ckd.pkl")

model_framingham   = load_artifact("model_framingham.pkl")
scaler_framingham  = load_artifact("scaler_framingham.pkl")
imputer_framingham = load_artifact("imputer_framingham.pkl")

print("Modèles chargés avec succès.")

# ── Préprocessing générique ───────────────────────────────────────────────────
def preprocess(data: dict, feature_names: list, imputer, scaler) -> np.ndarray:
    """
    data          : dict des features envoyées par le frontend
    feature_names : ordre exact des colonnes utilisé à l'entraînement
    """
    import pandas as pd
    df = pd.DataFrame([data], columns=feature_names)
    df_imputed = imputer.transform(df)
    df_scaled  = scaler.transform(df_imputed)
    return df_scaled, df   # on retourne aussi df brut pour SHAP

# ── SHAP générique ────────────────────────────────────────────────────────────
import shap

TREE_MODELS = (
    __import__('sklearn.ensemble', fromlist=['GradientBoostingClassifier']).GradientBoostingClassifier,
    __import__('sklearn.ensemble', fromlist=['RandomForestClassifier']).RandomForestClassifier,
)

# ── Cache des explainers ──────────────────────────────────────────────────────
# Les explainers sont créés UNE seule fois par modèle puis réutilisés
# (évite de reconstruire un explainer à chaque requête de prédiction).
_EXPLAINER_CACHE = {}

def _get_explainer(model):
    key = id(model)
    explainer = _EXPLAINER_CACHE.get(key)
    if explainer is not None:
        return explainer

    if isinstance(model, TREE_MODELS):
        explainer = shap.TreeExplainer(model)
    else:
        # Modèle linéaire (LogisticRegression) → LinearExplainer : SHAP EXACT et
        # quasi instantané. Remplace l'ancien KernelExplainer qui, sans cache,
        # ré-évaluait le modèle des milliers de fois à chaque appel.
        n_features = model.coef_.shape[1]
        background = np.zeros((1, n_features))  # données standardisées → 0 ≈ patient moyen
        explainer = shap.LinearExplainer(model, background)

    _EXPLAINER_CACHE[key] = explainer
    return explainer

def compute_shap_single(model, X_scaled: np.ndarray, feature_names: list) -> dict:
    """
    Retourne les SHAP values pour UN seul patient sous forme de dict {feature: shap_value}.
    L'explainer est mis en cache (créé une seule fois par modèle).
    """
    import pandas as pd
    explainer = _get_explainer(model)

    if isinstance(model, TREE_MODELS):
        X_df = pd.DataFrame(X_scaled, columns=feature_names)
        sv = explainer.shap_values(X_df)
        sv_arr = np.array(sv)
        if isinstance(sv, list) and len(sv) == 2:
            sv1 = sv[1][0]
        elif sv_arr.ndim == 3:
            sv1 = sv_arr[1][0]
        else:
            sv1 = sv_arr[0]
        ev = explainer.expected_value
        ev_arr = np.array(ev).ravel()
        ev1 = float(ev_arr[1]) if ev_arr.size > 1 else float(ev_arr[0])
    else:
        # LinearExplainer : sortie (n_samples, n_features) sur la marge (log-odds
        # de la classe positive). Exact pour un modèle linéaire, aucune approximation.
        sv = explainer.shap_values(X_scaled)
        sv_arr = np.array(sv)
        sv1 = sv_arr[0] if sv_arr.ndim >= 2 else sv_arr
        ev_arr = np.array(explainer.expected_value).ravel()
        ev1 = float(ev_arr[-1])

    shap_dict = {feat: round(float(val), 6) for feat, val in zip(feature_names, sv1)}
    return shap_dict, round(ev1, 6)
