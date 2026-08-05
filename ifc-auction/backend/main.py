import sys
import os
from pathlib import Path as _Path
from dotenv import load_dotenv

# Load .env from project root (one level above backend/)
load_dotenv(_Path(__file__).parent.parent / ".env")

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from auth import authenticate_user, create_access_token
from models import Base, engine
from seed import seed
from routes.admin import router as admin_router
from routes.team import router as team_router
from routes.websocket import router as ws_router

app = FastAPI(title="Condor IFC Auction")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed DB on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    from fastapi import HTTPException, status
    auth = authenticate_user(form_data.username, form_data.password)
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    # Embed role (as "role" key) and optional team_id into token
    token_payload = {"role": auth["role"]}
    if "team_id" in auth:
        token_payload["team_id"] = auth["team_id"]
    token = create_access_token(token_payload)
    response = {"access_token": token, "token_type": "bearer", "role": auth["role"]}
    if "team_id" in auth:
        response["team_id"] = auth["team_id"]
    return response


app.include_router(admin_router)
app.include_router(team_router)
app.include_router(ws_router)

# Serve React build in production
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    # Serve all static files from dist root (player images, team logos, favicons etc.)
    from fastapi.responses import Response
    import mimetypes

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            mime, _ = mimetypes.guess_type(str(file_path))
            return Response(file_path.read_bytes(), media_type=mime or "application/octet-stream")
        return FileResponse(frontend_dist / "index.html")
