import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.environ.get("JWT_SECRET", "changeme-insecure-default")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "IrisIFCAdmin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Welcome!")

# Legacy shared team login (kept for backwards compat)
TEAM_USERNAME = os.environ.get("TEAM_USERNAME", "IrisIFCTeams")
TEAM_PASSWORD = os.environ.get("TEAM_PASSWORD", "WelcomeTeam!")

# Per-team credentials: username -> (password, team_id)
TEAM_CREDENTIALS = {
    "forca_iris":      (os.environ.get("TEAM1_PASSWORD", "ForcaIris@2026"),    1),
    "kootkar_fc":      (os.environ.get("TEAM2_PASSWORD", "KootkarFC@2026"),    2),
    "iris_spartans":   (os.environ.get("TEAM3_PASSWORD", "Spartans@2026"),     3),
    "irisponsibles":   (os.environ.get("TEAM4_PASSWORD", "Irisponsibles@2026"), 4),
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def authenticate_user(username: str, password: str) -> dict | None:
    """
    Returns a dict with role and optional team_id, or None if invalid.
    """
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return {"role": "admin"}
    if username == TEAM_USERNAME and password == TEAM_PASSWORD:
        return {"role": "team"}
    if username in TEAM_CREDENTIALS:
        expected_password, team_id = TEAM_CREDENTIALS[username]
        if password == expected_password:
            return {"role": "team", "team_id": team_id}
    return None


def create_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def get_current_role(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("sub") or payload.get("role")
        if role not in ("admin", "team"):
            raise ValueError
        result = {"role": role}
        if "team_id" in payload:
            result["team_id"] = payload["team_id"]
        return result
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_admin(auth: dict = Depends(get_current_role)):
    if auth["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return auth
