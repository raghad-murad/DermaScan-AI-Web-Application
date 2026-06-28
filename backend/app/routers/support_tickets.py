import re
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth

from app.auth.dependencies import get_current_user
from app.firebase_admin import db
from app.services.firestore_service import create_document, get_collection, get_document, update_document
from app.services.email_service import send_email_change_approved_email, send_email_change_rejected_email

logger = logging.getLogger(__name__)

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


# Registered before /{ticket_id} so FastAPI doesn't greedily match "resolve" as a ticket_id.
@router.put("/resolve/{ticket_id}")
async def resolve_email_change_ticket(
    ticket_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    print(f"Resolving ticket: {ticket_id}")
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    action = body.get("action")  # "approve" or "reject"
    admin_message = body.get("admin_message", "")

    ticket_ref = db.collection("support_tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket_data = ticket_doc.to_dict()
    print(f"Ticket data: {ticket_data}")
    doctor_id = ticket_data.get("doctor_id")
    message = ticket_data.get("message", "")

    if action == "approve":
        match = re.search(r"from\s+(\S+)\s+to\s+(\S+)", message)
        if not match:
            raise HTTPException(status_code=400, detail="Could not parse email from ticket message")
        new_email = match.group(2).rstrip('.')

        try:
            firebase_auth.update_user(doctor_id, email=new_email)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Firebase Auth update failed: {str(e)}")

        db.collection("users").document(doctor_id).update({"email": new_email})
        ticket_ref.update({"status": "resolved", "admin_message": admin_message})

        try:
            doctor_doc = db.collection("users").document(doctor_id).get().to_dict() or {}
            send_email_change_approved_email(new_email, doctor_doc.get("full_name", "Doctor"), new_email)
        except Exception as e:
            print(f"Email send failed: {e}")

        return {"message": "Email updated successfully", "new_email": new_email}

    elif action == "reject":
        ticket_ref.update({"status": "rejected", "admin_message": admin_message})

        try:
            doctor_doc = db.collection("users").document(doctor_id).get().to_dict() or {}
            old_email = message.split("from ")[-1].split(" to ")[0].strip()
            send_email_change_rejected_email(
                old_email,
                doctor_doc.get("full_name", "Doctor"),
                admin_message or "No reason provided",
            )
        except Exception as e:
            print(f"Email send failed: {e}")

        return {"message": "Ticket rejected"}

    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")


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
