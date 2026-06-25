from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, case
from models.database import get_db
from models.models import (
    FactConsultation, FactMesureQuotidienne, FactAlerteRisque,
    DimPatient, DimMaladie, DimMedecin
)
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


# ─────────────────────────────────────────────
# SCHEMAS PYDANTIC
# ─────────────────────────────────────────────

class MesureOut(BaseModel):
    date:             Optional[str]
    glycemie:         Optional[float]
    glycemie_statut:  Optional[str]
    tension:          Optional[float]
    tension_statut:   Optional[str]
    poids:            Optional[float]
    poids_statut:     Optional[str]
    frequence:        Optional[float]
    frequence_statut: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# ENREGISTREMENT
# ─────────────────────────────────────────────

@router.post("/consultation", summary="Enregistrer une prédiction")
def save_consultation(data: dict, db: Session = Depends(get_db)):
    maladie = db.query(DimMaladie).filter(
        DimMaladie.code == data.get("disease_code")
    ).first()
    if not maladie:
        raise HTTPException(status_code=404, detail="Maladie non trouvée")

    consultation = FactConsultation(
        patient_id      = data.get("patient_id"),
        medecin_id      = data.get("medecin_id"),
        maladie_id      = maladie.id,
        prediction      = data.get("prediction"),
        probabilite     = data.get("probability"),
        niveau_risque   = data.get("risk_level"),
        recommendation  = data.get("recommendation"),
        features_input  = data.get("features_input"),
        shap_values     = data.get("shap_values"),
        shap_base_value = data.get("shap_base_value"),
        top_features    = data.get("top_features"),
    )
    db.add(consultation)
    db.flush()  # obtenir l'id avant le commit

    if data.get("risk_level") == "Élevé":
        alerte = FactAlerteRisque(
            consultation_id = consultation.id,
            patient_id      = data.get("patient_id"),
            maladie_code    = data.get("disease_code"),
            niveau_alerte   = "CRITICAL",
            message         = (
                f"Risque élevé détecté : {data.get('disease_code')} "
                f"— probabilité {data.get('probability', 0)*100:.1f}%"
            )
        )
        db.add(alerte)

    db.commit()
    return {"status": "ok", "consultation_id": consultation.id}


@router.post("/mesure", summary="Enregistrer une mesure patient")
def save_mesure(data: dict, db: Session = Depends(get_db)):

    def statut(val, min_v, max_v):
        if val is None:
            return None
        if val > max_v:
            return "Élevé"
        if val < min_v:
            return "Bas"
        return "Normal"

    p_id = data.get("patient_id")
    if not p_id:
        raise HTTPException(status_code=400, detail="patient_id requis")

    # ✅ FIX : si le patient n'existe pas encore en base, le créer automatiquement
    patient = db.query(DimPatient).filter(DimPatient.id == int(p_id)).first()
    if not patient:
        patient = DimPatient(
            id     = int(p_id),
            nom    = "Patient",
            prenom = str(p_id),
            sexe   = "M"
        )
        db.add(patient)
        db.flush()

    mesure = FactMesureQuotidienne(
        patient_id       = int(p_id),
        glycemie         = data.get("glycemie"),
        tension          = data.get("tension"),
        poids            = data.get("poids"),
        frequence        = data.get("frequence"),
        glycemie_statut  = statut(data.get("glycemie"),  70,  100),
        tension_statut   = statut(data.get("tension"),   90,  130),
        poids_statut     = statut(data.get("poids"),     50,  90),
        frequence_statut = statut(data.get("frequence"), 60,  100),
        notes            = data.get("notes"),
    )
    db.add(mesure)
    db.commit()
    return {"status": "ok", "mesure_id": mesure.id}


# ─────────────────────────────────────────────
# ANALYTICS BI
# ─────────────────────────────────────────────

@router.get("/stats/global", summary="Statistiques globales")
def stats_global(db: Session = Depends(get_db)):
    total    = db.query(FactConsultation).count()
    a_risque = db.query(FactConsultation).filter(
        FactConsultation.niveau_risque == "Élevé"
    ).count()
    patients = db.query(DimPatient).count()
    alertes  = db.query(FactAlerteRisque).filter(
        FactAlerteRisque.vue == 0
    ).count()

    return {
        "total_consultations":    total,
        "patients_a_risque_eleve": a_risque,
        "total_patients":         patients,
        "alertes_non_vues":       alertes,
        "taux_risque_eleve":      round(a_risque / total * 100, 1) if total > 0 else 0
    }


@router.get("/stats/par_maladie", summary="Stats par maladie")
def stats_par_maladie(db: Session = Depends(get_db)):
    results = (
        db.query(
            DimMaladie.code,
            DimMaladie.nom,
            func.count(FactConsultation.id).label("total"),
            func.avg(FactConsultation.probabilite).label("prob_moyenne"),
            func.sum(
                case((FactConsultation.niveau_risque == "Élevé", 1), else_=0)
            ).label("risque_eleve")
        )
        .join(FactConsultation, DimMaladie.id == FactConsultation.maladie_id, isouter=True)
        .group_by(DimMaladie.code, DimMaladie.nom)
        .all()
    )
    return [
        {
            "code":                  r.code,
            "nom":                   r.nom,
            "total_consultations":   r.total or 0,
            "probabilite_moyenne":   round(float(r.prob_moyenne or 0), 3),
            "risque_eleve":          int(r.risque_eleve or 0),
        }
        for r in results
    ]


@router.get("/stats/evolution", summary="Évolution temporelle des consultations")
def stats_evolution(jours: int = 30, db: Session = Depends(get_db)):
    depuis = datetime.now() - timedelta(days=jours)
    results = (
        db.query(
            func.date(FactConsultation.created_at).label("jour"),
            func.count(FactConsultation.id).label("total"),
            func.sum(
                case((FactConsultation.niveau_risque == "Élevé", 1), else_=0)
            ).label("eleve")
        )
        .filter(FactConsultation.created_at >= depuis)
        .group_by(func.date(FactConsultation.created_at))
        .order_by(func.date(FactConsultation.created_at))
        .all()
    )
    return [
        {
            "date":  str(r.jour)[:10],
            "total": r.total,
            "eleve": int(r.eleve or 0),
        }
        for r in results
    ]


@router.get("/stats/risque_distribution", summary="Distribution des niveaux de risque")
def risque_distribution(db: Session = Depends(get_db)):
    results = (
        db.query(
            DimMaladie.code,
            FactConsultation.niveau_risque,
            func.count(FactConsultation.id).label("count")
        )
        .join(DimMaladie, FactConsultation.maladie_id == DimMaladie.id)
        .group_by(DimMaladie.code, FactConsultation.niveau_risque)
        .all()
    )
    data = {}
    for r in results:
        if r.code not in data:
            data[r.code] = {"Faible": 0, "Modéré": 0, "Élevé": 0}
        if r.niveau_risque in data[r.code]:
            data[r.code][r.niveau_risque] = r.count
    return data


@router.get("/alertes", summary="Alertes non vues")
def get_alertes(db: Session = Depends(get_db)):
    alertes = (
        db.query(FactAlerteRisque)
        .filter(FactAlerteRisque.vue == 0)
        .order_by(desc(FactAlerteRisque.created_at))
        .limit(20)
        .all()
    )
    return [
        {
            "id":      a.id,
            "maladie": a.maladie_code,
            "niveau":  a.niveau_alerte,
            "message": a.message,
            "date":    str(a.created_at)[:16]
        }
        for a in alertes
    ]


# ✅ CORRIGÉ — response_model + ordre ASC pour le graphique
@router.get(
    "/mesures/historique/{patient_id}",
    summary="Historique mesures patient",
    response_model=List[MesureOut]
)
def historique_mesures(patient_id: int, db: Session = Depends(get_db)):
    # ✅ FIX 1 : vérifier que le patient existe
    patient = db.query(DimPatient).filter(DimPatient.id == patient_id).first()
    if not patient:
        return []   # retourne liste vide au lieu de crasher

    mesures = (
        db.query(FactMesureQuotidienne)
        .filter(FactMesureQuotidienne.patient_id == patient_id)
        .order_by(FactMesureQuotidienne.created_at.asc())   # ✅ FIX 2 : ASC pour le graphique
        .limit(30)
        .all()
    )
    return [
        MesureOut(
            date             = str(m.created_at)[:10] if m.created_at else None,
            glycemie         = m.glycemie,
            glycemie_statut  = m.glycemie_statut,
            tension          = m.tension,
            tension_statut   = m.tension_statut,
            poids            = m.poids,
            poids_statut     = m.poids_statut,
            frequence        = m.frequence,
            frequence_statut = m.frequence_statut,
        )
        for m in mesures
    ]


# ─────────────────────────────────────────────
# GESTION DES PATIENTS
# ─────────────────────────────────────────────

@router.get("/patients", summary="Liste de tous les patients")
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(DimPatient).order_by(DimPatient.nom, DimPatient.prenom).all()
    return [
        {
            "id":         p.id,
            "nom":        p.nom,
            "prenom":     p.prenom,
            "age":        p.age,
            "sexe":       p.sexe,
            "email":      p.email,
            "telephone":  p.telephone,
            "created_at": str(p.created_at)[:10] if p.created_at else None
        }
        for p in patients
    ]


@router.post("/patient", summary="Créer un nouveau patient")
def create_patient(data: dict, db: Session = Depends(get_db)):
    if not data.get("nom") or not data.get("prenom"):
        raise HTTPException(status_code=400, detail="Nom et Prénom requis")

    email = data.get("email")
    if email:
        exist = db.query(DimPatient).filter(DimPatient.email == email).first()
        if exist:
            raise HTTPException(status_code=400, detail="Un patient avec cet email existe déjà")

    patient = DimPatient(
        nom       = data.get("nom"),
        prenom    = data.get("prenom"),
        age       = data.get("age"),
        sexe      = data.get("sexe", "M"),
        email     = email,
        telephone = data.get("telephone")
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {
        "status": "ok",
        "patient": {
            "id":        patient.id,
            "nom":       patient.nom,
            "prenom":    patient.prenom,
            "age":       patient.age,
            "sexe":      patient.sexe,
            "email":     patient.email,
            "telephone": patient.telephone
        }
    }


@router.put("/patient/{patient_id}", summary="Modifier un patient")
def update_patient(patient_id: int, data: dict, db: Session = Depends(get_db)):
    patient = db.query(DimPatient).filter(DimPatient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouvé")

    email = data.get("email")
    if email and email != patient.email:
        exist = db.query(DimPatient).filter(DimPatient.email == email).first()
        if exist:
            raise HTTPException(status_code=400, detail="Un patient avec cet email existe déjà")

    patient.nom       = data.get("nom",       patient.nom)
    patient.prenom    = data.get("prenom",    patient.prenom)
    patient.age       = data.get("age",       patient.age)
    patient.sexe      = data.get("sexe",      patient.sexe)
    patient.email     = email if email else   patient.email
    patient.telephone = data.get("telephone", patient.telephone)

    db.commit()
    return {"status": "ok", "message": "Patient mis à jour"}


@router.get("/patient/{patient_id}/dossier", summary="Dossier médical complet d'un patient")
def get_patient_dossier(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(DimPatient).filter(DimPatient.id == patient_id).first()
    if not patient:
        patient = db.query(DimPatient).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient non trouvé")
        patient_id = patient.id

    consultations = (
        db.query(FactConsultation)
        .filter(FactConsultation.patient_id == patient_id)
        .order_by(desc(FactConsultation.created_at))
        .all()
    )
    mesures = (
        db.query(FactMesureQuotidienne)
        .filter(FactMesureQuotidienne.patient_id == patient_id)
        .order_by(desc(FactMesureQuotidienne.created_at))
        .all()
    )
    alertes = (
        db.query(FactAlerteRisque)
        .filter(FactAlerteRisque.patient_id == patient_id)
        .order_by(desc(FactAlerteRisque.created_at))
        .all()
    )

    return {
        "patient": {
            "id":         patient.id,
            "nom":        patient.nom,
            "prenom":     patient.prenom,
            "age":        patient.age,
            "sexe":       patient.sexe,
            "email":      patient.email,
            "telephone":  patient.telephone,
            "created_at": str(patient.created_at)[:10] if patient.created_at else None
        },
        "consultations": [
            {
                "id":              c.id,
                "maladie_code":    c.maladie.code if c.maladie else None,
                "maladie_nom":     c.maladie.nom  if c.maladie else None,
                "prediction":      c.prediction,
                "probability":     c.probabilite,
                "risk_level":      c.niveau_risque,
                "recommendation":  c.recommendation,
                "features_input":  c.features_input,
                "top_features":    c.top_features,
                "date":            str(c.created_at)[:16] if c.created_at else None
            }
            for c in consultations
        ],
        "mesures": [
            {
                "id":               m.id,
                "date":             str(m.created_at)[:10] if m.created_at else None,
                "glycemie":         m.glycemie,
                "glycemie_statut":  m.glycemie_statut,
                "tension":          m.tension,
                "tension_statut":   m.tension_statut,
                "poids":            m.poids,
                "poids_statut":     m.poids_statut,
                "frequence":        m.frequence,
                "frequence_statut": m.frequence_statut,
                "notes":            m.notes
            }
            for m in mesures
        ],
        "alertes": [
            {
                "id":      a.id,
                "maladie": a.maladie_code,
                "niveau":  a.niveau_alerte,
                "message": a.message,
                "date":    str(a.created_at)[:16] if a.created_at else None,
                "vue":     a.vue
            }
            for a in alertes
        ]
    }


@router.get("/patient/{patient_id}/consultations", summary="Historique consultations d'un patient")
def get_patient_consultations(
    patient_id: int,
    maladie_code: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    patient = db.query(DimPatient).filter(DimPatient.id == patient_id).first()
    if not patient:
        patient = db.query(DimPatient).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient non trouvé")
        patient_id = patient.id

    query = db.query(FactConsultation).filter(FactConsultation.patient_id == patient_id)

    if maladie_code:
        maladie = db.query(DimMaladie).filter(DimMaladie.code == maladie_code).first()
        if maladie:
            query = query.filter(FactConsultation.maladie_id == maladie.id)

    consultations = query.order_by(desc(FactConsultation.created_at)).limit(limit).all()

    return {
        "patient_id": patient_id,
        "total":      len(consultations),
        "consultations": [
            {
                "id":             c.id,
                "maladie_code":   c.maladie.code if c.maladie else None,
                "maladie_nom":    c.maladie.nom  if c.maladie else None,
                "prediction":     c.prediction,
                "probability":    c.probabilite,
                "risk_level":     c.niveau_risque,
                "recommendation": c.recommendation,
                "top_features":   c.top_features,
                "date":           str(c.created_at)[:16] if c.created_at else None
            }
            for c in consultations
        ]
    }


@router.get("/consultation/{consultation_id}", summary="Détail complet d'une consultation")
def get_consultation_detail(consultation_id: int, db: Session = Depends(get_db)):
    consultation = db.query(FactConsultation).filter(
        FactConsultation.id == consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation non trouvée")

    return {
        "id":               consultation.id,
        "patient_id":       consultation.patient_id,
        "maladie_code":     consultation.maladie.code if consultation.maladie else None,
        "maladie_nom":      consultation.maladie.nom  if consultation.maladie else None,
        "prediction":       consultation.prediction,
        "probability":      consultation.probabilite,
        "risk_level":       consultation.niveau_risque,
        "recommendation":   consultation.recommendation,
        "features_input":   consultation.features_input,
        "shap_values":      consultation.shap_values,
        "shap_base_value":  consultation.shap_base_value,
        "top_features":     consultation.top_features,
        "date":             str(consultation.created_at)[:16] if consultation.created_at else None
    }


@router.get("/patient/{patient_id}/evolution", summary="Évolution des métriques patient")
def get_patient_evolution(
    patient_id: int,
    metrique: str = "glycemie",
    jours: int = 30,
    db: Session = Depends(get_db)
):
    patient = db.query(DimPatient).filter(DimPatient.id == patient_id).first()
    if not patient:
        patient = db.query(DimPatient).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient non trouvé")
        patient_id = patient.id

    valid_metriques = ["glycemie", "tension", "poids", "frequence"]
    if metrique not in valid_metriques:
        raise HTTPException(
            status_code=400,
            detail=f"Métrique invalide. Valeurs autorisées : {valid_metriques}"
        )

    depuis = datetime.now() - timedelta(days=jours)
    mesures = (
        db.query(FactMesureQuotidienne)
        .filter(
            FactMesureQuotidienne.patient_id == patient_id,
            FactMesureQuotidienne.created_at >= depuis
        )
        .order_by(FactMesureQuotidienne.created_at.asc())
        .all()
    )

    points = []
    values = []
    for m in mesures:
        val    = getattr(m, metrique, None)
        statut = getattr(m, f"{metrique}_statut", None)
        points.append({
            "date":   str(m.created_at)[:10] if m.created_at else None,
            "valeur": val,
            "statut": statut
        })
        if val is not None:
            values.append(val)

    stats = {}
    if values:
        stats = {
            "min":            round(min(values), 1),
            "max":            round(max(values), 1),
            "moyenne":        round(sum(values) / len(values), 1),
            "derniere_valeur": round(values[-1], 1),
            "nb_mesures":     len(values),
        }
        if len(values) >= 4:
            debut = sum(values[:3]) / 3
            fin   = sum(values[-3:]) / 3
            diff  = fin - debut
            stats["tendance"] = "hausse" if diff > 2 else ("baisse" if diff < -2 else "stable")
        else:
            stats["tendance"] = "stable"

    plages = {
        "glycemie":  {"min_normal": 70,  "max_normal": 100, "unite": "mg/dL"},
        "tension":   {"min_normal": 90,  "max_normal": 130, "unite": "mmHg"},
        "poids":     {"min_normal": 50,  "max_normal": 90,  "unite": "kg"},
        "frequence": {"min_normal": 60,  "max_normal": 100, "unite": "bpm"},
    }

    return {
        "patient_id":      patient_id,
        "metrique":        metrique,
        "periode_jours":   jours,
        "plage_reference": plages.get(metrique, {}),
        "statistiques":    stats,
        "points":          points
    }
