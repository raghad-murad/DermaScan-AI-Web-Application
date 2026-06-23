import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.services.email_service import send_approval_email, send_rejection_email
from app.services.firestore_service import create_document, get_collection, get_document, update_document

logger = logging.getLogger(__name__)

router = APIRouter()


def _require_admin(current_user: dict) -> None:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.post("/")
async def create_account_request(payload: dict):
    email = payload.get("email")
    if email:
        existing = get_collection("account_requests", filters=[("email", "==", email)])
        if any(r.get("status") in ("pending", "approved") for r in existing):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A request with this email already exists")

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
    updated = get_document("account_requests", request_id)

    new_status = payload.get("status")
    if new_status == "approved":
        print(f"Sending email to {updated['email']}")
        try:
            send_approval_email(updated["email"], updated["full_name"])
        except Exception:
            logger.exception("Failed to send approval email to %s", updated.get("email"))
    elif new_status == "rejected":
        print(f"Sending email to {updated['email']}")
        try:
            send_rejection_email(updated["email"], updated["full_name"], payload.get("admin_message") or "Not specified")
        except Exception:
            logger.exception("Failed to send rejection email to %s", updated.get("email"))

    return updated
