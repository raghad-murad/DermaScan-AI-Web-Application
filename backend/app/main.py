import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import account_requests, analysis, patients, support_tickets, users
from app.models.predictor import get_clinical_predictor, get_dermoscopy_predictor


def load_models_background():
    print("[Startup] Loading models in background...")
    try:
        get_clinical_predictor()
        get_dermoscopy_predictor()
        print("[Startup] Both models ready.")
    except Exception as e:
        print(f"[Startup] Model loading failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=load_models_background, daemon=True)
    thread.start()
    yield


app = FastAPI(title="DermOra AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(account_requests.router, prefix="/api/account-requests", tags=["account-requests"])
app.include_router(support_tickets.router, prefix="/api/support-tickets", tags=["support-tickets"])


@app.get("/")
async def root():
    return {"status": "DermOra AI backend running"}


@app.get("/health")
async def health():
    from app.models.predictor import _clinical, _dermoscopy
    return {
        "status": "ok",
        "models": {
            "clinical":   "ready" if _clinical   is not None else "loading",
            "dermoscopy": "ready" if _dermoscopy is not None else "loading",
        },
    }
