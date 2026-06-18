from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import account_requests, analysis, patients, support_tickets, users

app = FastAPI(title="DermaScan AI Backend")

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
    return {"status": "DermaScan AI backend running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
