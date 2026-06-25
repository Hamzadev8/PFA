from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# ─────────────────────────────────────────────
# DIMENSIONS
# ─────────────────────────────────────────────

class DimPatient(Base):
    """Dimension Patient — données démographiques."""
    __tablename__ = "dim_patient"

    id          = Column(Integer, primary_key=True, index=True)
    nom         = Column(String(100))
    prenom      = Column(String(100))
    age         = Column(Integer)
    sexe        = Column(String(10))   # M / F
    email       = Column(String(150), unique=True, nullable=True)
    telephone   = Column(String(20), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    consultations = relationship("FactConsultation", back_populates="patient")
    mesures       = relationship("FactMesureQuotidienne", back_populates="patient")


class DimMedecin(Base):
    """Dimension Médecin."""
    __tablename__ = "dim_medecin"

    id          = Column(Integer, primary_key=True, index=True)
    nom         = Column(String(100))
    prenom      = Column(String(100))
    specialite  = Column(String(100))
    email       = Column(String(150), unique=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    consultations = relationship("FactConsultation", back_populates="medecin")


class DimMaladie(Base):
    """Dimension Maladie."""
    __tablename__ = "dim_maladie"

    id          = Column(Integer, primary_key=True, index=True)
    code        = Column(String(20), unique=True)   # diabetes / ckd / framingham
    nom         = Column(String(100))
    description = Column(Text, nullable=True)
    modele_type = Column(String(50))                # GradientBoosting / LogisticRegression

    consultations = relationship("FactConsultation", back_populates="maladie")


class DimTemps(Base):
    """Dimension Temps — calendrier pour analyses temporelles."""
    __tablename__ = "dim_temps"

    id       = Column(Integer, primary_key=True, index=True)
    date     = Column(DateTime(timezone=True), unique=True)
    annee    = Column(Integer)
    mois     = Column(Integer)
    semaine  = Column(Integer)
    jour     = Column(Integer)
    trimestre = Column(Integer)

# ─────────────────────────────────────────────
# FAITS (Tables de faits)
# ─────────────────────────────────────────────

class FactConsultation(Base):
    """
    Fait principal — chaque prédiction IA effectuée par un médecin.
    Stocke les données d'entrée, le résultat et les SHAP values.
    """
    __tablename__ = "fact_consultation"

    id              = Column(Integer, primary_key=True, index=True)
    patient_id      = Column(Integer, ForeignKey("dim_patient.id"), nullable=True)
    medecin_id      = Column(Integer, ForeignKey("dim_medecin.id"), nullable=True)
    maladie_id      = Column(Integer, ForeignKey("dim_maladie.id"))
    temps_id        = Column(Integer, ForeignKey("dim_temps.id"), nullable=True)

    # Résultat de la prédiction
    prediction      = Column(Integer)           # 0 ou 1
    probabilite     = Column(Float)             # 0.0 → 1.0
    niveau_risque   = Column(String(20))        # Faible / Modéré / Élevé
    recommendation  = Column(Text)

    # Données d'entrée et SHAP (stockées en JSON)
    features_input  = Column(JSON)              # données saisies
    shap_values     = Column(JSON)              # valeurs SHAP
    shap_base_value = Column(Float)
    top_features    = Column(JSON)              # top 5 features

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    patient  = relationship("DimPatient",  back_populates="consultations")
    medecin  = relationship("DimMedecin",  back_populates="consultations")
    maladie  = relationship("DimMaladie",  back_populates="consultations")


class FactMesureQuotidienne(Base):
    """
    Fait — mesures quotidiennes saisies par le patient.
    Glycémie, tension, poids, fréquence cardiaque.
    """
    __tablename__ = "fact_mesure_quotidienne"

    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(Integer, ForeignKey("dim_patient.id"))

    # Mesures
    glycemie    = Column(Float, nullable=True)   # mg/dL
    tension     = Column(Float, nullable=True)   # mm Hg systolique
    poids       = Column(Float, nullable=True)   # kg
    frequence   = Column(Float, nullable=True)   # bpm

    # Statuts automatiques
    glycemie_statut  = Column(String(10), nullable=True)  # Normal/Élevé/Bas
    tension_statut   = Column(String(10), nullable=True)
    poids_statut     = Column(String(10), nullable=True)
    frequence_statut = Column(String(10), nullable=True)

    notes       = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("DimPatient", back_populates="mesures")


class FactAlerteRisque(Base):
    """
    Fait — alertes générées automatiquement quand le risque dépasse un seuil.
    """
    __tablename__ = "fact_alerte_risque"

    id              = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("fact_consultation.id"))
    patient_id      = Column(Integer, ForeignKey("dim_patient.id"), nullable=True)
    maladie_code    = Column(String(20))
    niveau_alerte   = Column(String(20))   # WARNING / CRITICAL
    message         = Column(Text)
    vue             = Column(Integer, default=0)   # 0=non vue, 1=vue
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
