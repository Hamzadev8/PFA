# Déploiement — Plateforme IA & BI Maladies Chroniques

Déploiement conteneurisé de l'ensemble de la plateforme (base de données,
backend FastAPI, frontend Next.js) à l'aide de Docker et Docker Compose.

## Architecture

```
                         ┌─────────────────────────┐
   Navigateur  ───────►  │  frontend (Next.js)      │  :3000
                         └───────────┬─────────────┘
                                     │ HTTP/JSON (REST)
                         ┌───────────▼─────────────┐
                         │  backend (FastAPI)       │  :8000
                         │  IA · SHAP · Auth · BI   │
                         └───────────┬─────────────┘
                                     │ SQLAlchemy
                         ┌───────────▼─────────────┐
                         │  db (PostgreSQL)         │  :5432
                         │  Data Warehouse étoile   │   volume: pgdata
                         └─────────────────────────┘
              Réseau Docker interne : pfa-net
```

| Service    | Image / base        | Port hôte | Rôle                                |
|------------|---------------------|-----------|-------------------------------------|
| `db`       | postgres:16-alpine  | 5432*     | Entrepôt de données (DWH)           |
| `backend`  | python:3.12-slim    | 8000      | API REST, modèles IA, SHAP, BI      |
| `frontend` | node:20-alpine      | 3000      | Interface utilisateur               |

\* le port 5432 n'est pas publié par défaut (accès interne uniquement).

## Prérequis

- Docker Engine 24+ et le plugin Docker Compose v2
- Vérifier : `docker --version` et `docker compose version`

## Mise en route

```bash
# 1) Configurer les variables d'environnement
cp .env.example .env
#    puis éditer .env (au minimum : JWT_SECRET_KEY en production)

# 2) Construire et démarrer les trois services
docker compose up -d --build

# 3) Suivre les logs (optionnel)
docker compose logs -f
```

Accès une fois démarré :

- Frontend  : http://localhost:3000
- API       : http://localhost:8000
- Swagger   : http://localhost:8000/docs
- Santé API : http://localhost:8000/health

## Comptes de démonstration

Créés automatiquement au premier démarrage du backend :

| Rôle    | Email            | Mot de passe |
|---------|------------------|--------------|
| Médecin | medecin@pfa.ma   | medecin123   |
| Patient | patient@pfa.ma   | patient123   |
| Admin   | admin@pfa.ma     | admin123     |

## Initialisation de la base

- Le schéma du Data Warehouse (`Api_Pfa/migrations/schema.sql`) est joué
  automatiquement à la **première** création du volume PostgreSQL.
- Au démarrage, le backend (`init_db`) crée également les tables manquantes
  via SQLAlchemy et insère les données de référence (maladies, démo).
- Grâce à `depends_on: condition: service_healthy`, le backend ne démarre
  qu'une fois PostgreSQL réellement prêt.

## Commandes utiles

```bash
docker compose ps                 # état des services
docker compose logs -f backend    # logs d'un service
docker compose restart backend    # redémarrer un service
docker compose down               # arrêter (conserve les données)
docker compose down -v            # arrêter ET supprimer le volume (reset DB)
docker compose up -d --build      # reconstruire après modification du code
```

## Variables d'environnement

| Variable              | Service   | Description                                  |
|-----------------------|-----------|----------------------------------------------|
| `POSTGRES_USER/PASSWORD/DB` | db   | Identifiants et nom de la base               |
| `DATABASE_URL`        | backend   | Construite automatiquement vers le service `db` |
| `JWT_SECRET_KEY`      | backend   | Clé de signature JWT (**à changer en prod**) |
| `CORS_ORIGINS`        | backend   | Origines front autorisées                    |
| `NEXT_PUBLIC_API_URL` | frontend  | URL de l'API appelée depuis le navigateur    |
| `BACKEND_PORT` / `FRONTEND_PORT` | hôte | Ports publiés sur la machine hôte        |

> `NEXT_PUBLIC_API_URL` est **inlinée au build** du frontend (mécanisme Next.js).
> En cas de changement, reconstruire l'image : `docker compose up -d --build frontend`.

## Passage en production

1. Générer une vraie clé : `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
2. Mettre des mots de passe PostgreSQL forts.
3. Placer les services derrière un reverse proxy (Nginx / Traefik) avec **HTTPS**.
4. Régler `CORS_ORIGINS` et `NEXT_PUBLIC_API_URL` sur le domaine public réel.
5. Sauvegarder régulièrement le volume `pgdata`.
