from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.services.firestore_service import create_document, get_collection, get_document, update_document

router = APIRouter()


def _require_admin(current_user: dict) -> None:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.post("/")
async def create_account_request(payload: dict):
    data = {
        **payload,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "admin_message": None,
    }
    request_id = create_document("account_requests", data)
    return get_document("account_requests", request_id)


@router.get("/")
async def list_account_requests(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return get_collection("account_requests")


@router.put("/{request_id}")
async def update_account_request(
    request_id: str, payload: dict, current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)
    existing = get_document("account_requests", request_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    update_document("account_requests", request_id, payload)
    return get_document("account_requests", request_id)
