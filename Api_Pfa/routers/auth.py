from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import json, os

router = APIRouter()

# ── Config JWT ──────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "pfa2026-dev-secret-change-in-production")
ALGORITHM  = "HS256"
EXPIRE_MIN = 60 * 8  # 8 heures

# ── Bcrypt ──────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# ── Stockage JSON simple (remplace par DB plus tard) ────────
USERS_FILE = "users.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        # Utilisateurs démo par défaut
        default = [
            {"id": 1, "email": "medecin@pfa.ma", "hashed_password": pwd_context.hash("medecin123"), "role": "medecin", "name": "Dr. Karim Benali"},
            {"id": 2, "email": "patient@pfa.ma",  "hashed_password": pwd_context.hash("patient123"), "role": "patient", "name": "Mohammed Alami"},
            {"id": 3, "email": "admin@pfa.ma",    "hashed_password": pwd_context.hash("admin123"),   "role": "admin",   "name": "Admin Système"},
        ]
        save_users(default)
        return default
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

# ── Schémas ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "patient"
    name: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ── Helpers JWT ─────────────────────────────────────────────
def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

# ── Routes ──────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest):
    users = load_users()

    if any(u["email"] == data.email for u in users):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    if data.role not in ["patient", "medecin", "admin"]:
        raise HTTPException(status_code=400, detail="Rôle invalide")

    new_user = {
        "id": int(datetime.utcnow().timestamp()),
        "email": data.email,
        "hashed_password": pwd_context.hash(data.password),
        "role": data.role,
        "name": data.name,
    }
    users.append(new_user)
    save_users(users)

    token = create_token({"sub": new_user["email"], "role": new_user["role"], "id": new_user["id"]})
    return TokenResponse(
        access_token=token,
        user=UserOut(id=new_user["id"], email=new_user["email"], role=new_user["role"], name=new_user["name"])
    )


@router.post("/login", response_model=TokenResponse)
def login(data: RegisterRequest):
    users = load_users()
    found = next((u for u in users if u["email"] == data.email), None)

    if not found or not pwd_context.verify(data.password, found["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = create_token({"sub": found["email"], "role": found["role"], "id": found["id"]})
    return TokenResponse(
        access_token=token,
        user=UserOut(id=found["id"], email=found["email"], role=found["role"], name=found["name"])
    )


@router.get("/me", response_model=UserOut)
def me(payload: dict = Depends(verify_token)):
    users = load_users()
    found = next((u for u in users if u["email"] == payload["sub"]), None)
    if not found:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return UserOut(id=found["id"], email=found["email"], role=found["role"], name=found["name"])