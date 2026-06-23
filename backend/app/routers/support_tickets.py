from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.services.firestore_service import create_document, get_collection, get_document, update_document

router = APIRouter()


def _require_doctor(current_user: dict) -> None:
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")


def _require_admin(current_user: dict) -> None:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.post("/")
async def create_support_ticket(payload: dict, current_user: dict = Depends(get_current_user)):
    _require_doctor(current_user)
    data = {
        **payload,
        "doctor_id": current_user["uid"],
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ticket_id = create_document("support_tickets", data)
    return get_document("support_tickets", ticket_id)


@router.post("/delete-account")
async def request_account_deletion(current_user: dict = Depends(get_current_user)):
    _require_doctor(current_user)
    data = {
        "subject": "Account Deletion Request",
        "message": "Doctor requests permanent account deletion",
        "type": "deletion_request",
        "doctor_id": current_user["uid"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ticket_id = create_document("support_tickets", data)
    return get_document("support_tickets", ticket_id)


@router.get("/")
async def list_support_tickets(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        return get_collection("support_tickets")
    return get_collection("support_tickets", filters=[("doctor_id", "==", current_user["uid"])])


@router.put("/{ticket_id}")
async def update_support_ticket(
    ticket_id: str, payload: dict, current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)
    existing = get_document("support_tickets", ticket_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    update_document("support_tickets", ticket_id, payload)
    return get_document("support_tickets", ticket_id)
