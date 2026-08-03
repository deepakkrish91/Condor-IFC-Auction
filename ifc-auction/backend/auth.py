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
TEAM_USERNAME = os.environ.get("TEAM_USERNAME", "IrisIFCTeams")
TEAM_PASSWORD = os.environ.get("TEAM_PASSWORD", "WelcomeTeam!")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def authenticate_user(username: str, password: str) -> str | None:
    """Returns role string or None if credentials invalid."""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return "admin"
    if username == TEAM_USERNAME and password == TEAM_PASSWORD:
        return "team"
    return None


def create_access_token(role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_role(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("sub")
        if role not in ("admin", "team"):
            raise ValueError
        return role
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_admin(role: str = Depends(get_current_role)):
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return role
