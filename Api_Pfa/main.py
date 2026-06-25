import os
import sys

# Console Windows (cp1252) : forcer l'UTF-8 pour que les messages de démarrage
# contenant des caractères Unicode (✓, ⚠) ne fassent pas planter le serveur.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import diabetes, ckd, framingham, shap_routes, auth
from routers.dwh_routes import router as dwh_router
from models.init_db import init_db


app = FastAPI(
    title="API Plateforme IA - Maladies Chroniques",
    description="Diagnostic précoce et prise en charge personnalisée : Diabète, IRC, Cardio",
    version="2.0.0"
)

# Origines autorisées — configurables via la variable d'env CORS_ORIGINS
# (le wildcard "*" combiné à allow_credentials=True est rejeté par les navigateurs)
_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise la DB au démarrage
@app.on_event("startup")
def startup():
    try:
        init_db()
        print("✓ Base de données initialisée.")
    except Exception as e:
        print(f"⚠ DB non disponible (mode sans DB) : {e}")

# Routers IA
app.include_router(diabetes.router,    prefix="/predict", tags=["Diabète"])
app.include_router(ckd.router,         prefix="/predict", tags=["IRC (CKD)"])
app.include_router(framingham.router,  prefix="/predict", tags=["Cardio (Framingham)"])
app.include_router(shap_routes.router, prefix="/shap",    tags=["SHAP Interprétabilité"])
app.include_router(auth.router, prefix="/auth", tags=["Authentification"])


# Router DWH / BI
app.include_router(dwh_router, prefix="/dwh", tags=["Data Warehouse & BI"])

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "version": "2.0.0",
        "endpoints": {
            "IA": ["/predict/diabetes", "/predict/ckd", "/predict/framingham"],
            "SHAP": ["/shap/importance/{disease}"],
            "DWH": ["/dwh/stats/global", "/dwh/stats/par_maladie", "/dwh/alertes"]
        }
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
