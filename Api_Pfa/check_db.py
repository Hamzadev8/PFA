from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import DimPatient

def check_db():
    engine = create_engine("postgresql://postgres:postgres@localhost:5432/pfa_maladies")
    Session = sessionmaker(bind=engine)
    session = Session()
    patients = session.query(DimPatient).all()
    for p in patients:
        print(f"ID: {p.id}, Nom: {p.nom}, Prenom: {p.prenom}")
    session.close()

if __name__ == "__main__":
    check_db()
