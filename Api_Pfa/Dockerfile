# ─────────────────────────────────────────────────────────────
# Backend FastAPI — Plateforme IA Maladies Chroniques
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Évite les .pyc et force la sortie non bufferisée (logs en temps réel)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    MODELS_DIR=/app/models_pkl \
    SHAP_DIR=/app/shap_outputs

WORKDIR /app

# Dépendances système minimales (psycopg2 / build de quelques wheels)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# 1) Dépendances Python (couche mise en cache tant que requirements.txt ne change pas)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 2) Code applicatif + artefacts de modèles (.pkl) + sorties SHAP
COPY . .

EXPOSE 8000

# Healthcheck : l'endpoint /health renvoie 200 quand l'API est prête
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
