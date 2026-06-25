from .database import engine, SessionLocal, Base
from .models import DimMaladie, DimMedecin, DimPatient

def init_db():
    """Crée toutes les tables et insère les données de référence."""
    Base.metadata.create_all(bind=engine)
    print("✓ Tables créées.")

    db = SessionLocal()
    try:
        # Maladies de référence
        if db.query(DimMaladie).count() == 0:
            maladies = [
                DimMaladie(
                    code="diabetes",
                    nom="Diabète",
                    description="Prédiction du risque diabétique (dataset Pima Indians)",
                    modele_type="GradientBoostingClassifier"
                ),
                DimMaladie(
                    code="ckd",
                    nom="Insuffisance Rénale Chronique (IRC)",
                    description="Détection précoce de l'IRC (dataset CKD UCI)",
                    modele_type="LogisticRegression"
                ),
                DimMaladie(
                    code="framingham",
                    nom="Risque Cardiovasculaire",
                    description="Score de Framingham — risque cardiovasculaire sur 10 ans",
                    modele_type="LogisticRegression"
                ),
            ]
            db.add_all(maladies)

        # Médecin de démo
        if db.query(DimMedecin).count() == 0:
            db.add(DimMedecin(
                nom="Benali", prenom="Karim",
                specialite="Médecine interne",
                email="medecin@pfa.ma"
            ))

        # Patient de démo
        if db.query(DimPatient).count() == 0:
            db.add(DimPatient(
                nom="Alami", prenom="Mohammed",
                age=45, sexe="M",
                email="patient@pfa.ma"
            ))

        db.commit()
        print("✓ Données de référence insérées.")
    except Exception as e:
        db.rollback()
        print(f"Erreur init_db : {e}")
    finally:
        db.close()
