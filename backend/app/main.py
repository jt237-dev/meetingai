from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import meetings
from app.routes import upload
from app.routes import export 
from app.routes import tasks as tasks_router
from app.routes import participants as participants_router

import app.models
import os




app = FastAPI(title="MeetingAI API", version="1.0.0")

# CORS pour autoriser le frontend React.
# En production, définir la variable d'environnement FRONTEND_ORIGINS avec
# l'URL du frontend déployé (ex: "https://mon-app.vercel.app"). Plusieurs
# origines peuvent être séparées par des virgules. Les origines localhost
# restent autorisées pour le développement local.
_default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]
_env_origins = [
    o.strip() for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()
]
allowed_origins = _default_origins + _env_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Créer les tables automatiquement
Base.metadata.create_all(bind=engine)

# Inclure les routes
app.include_router(meetings.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(tasks_router.router, prefix="/api")
app.include_router(participants_router.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "MeetingAI API is running 🚀"}