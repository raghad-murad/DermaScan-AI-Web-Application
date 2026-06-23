import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth

from app.auth.dependencies import get_current_user
from app.services.email_service import send_deletion_email
from app.services.firestore_service import (
    create_document,
    delete_document,
    get_collection,
    get_document,
    update_document,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _require_admin(current_user: dict) -> None:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def _create_user_with_role(payload: dict, role: str, extra_fields: set[str]) -> dict:
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name")
    if not email or not password or not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="full_name, email and password are required",
        )

    try:
        firebase_user = firebase_auth.create_user(email=email, password=password, display_name=full_name)
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists")

    data = {
        "full_name": full_name,
        "email": email,
        "username": payload.get("username", ""),
        "phonenumber": payload.get("phonenumber", ""),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **{field: payload.get(field, "") for field in extra_fields},
    }
    create_document("users", data, doc_id=firebase_user.uid)
    return get_document("users", firebase_user.uid)


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return get_document("users", current_user["uid"])


@router.put("/me")
async def update_my_profile(payload: dict, current_user: dict = Depends(get_current_user)):
    allowed_fields = {"full_name", "username", "phonenumber", "hospital", "license_number"}
    update_data = {k: v for k, v in payload.items() if k in allowed_fields}

    update_document("users", current_user["uid"], update_data)
    return get_document("users", current_user["uid"])


@router.get("/")
async def list_users(role: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    filters = [("role", "==", role)] if role else None
    return get_collection("users", filters=filters)


@router.post("/create-admin")
async def create_admin(payload: dict, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return _create_user_with_role(payload, "admin", extra_fields=set())


@router.post("/create-doctor")
async def create_doctor(payload: dict, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return _create_user_with_role(payload, "doctor", extra_fields={"specialty", "hospital", "license_number"})


@router.put("/{user_id}/email")
async def update_user_email(user_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    new_email = payload.get("new_email")
    if not new_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="new_email is required")

    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        firebase_auth.update_user(user_id, email=new_email)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update Firebase Auth email: {exc}")

    update_document("users", user_id, {"email": new_email})
    return get_document("users", user_id)


@router.delete("/{user_id}")
async def delete_user_account(user_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for collection in ("patients", "analyses", "support_tickets"):
        for doc in get_collection(collection, filters=[("doctor_id", "==", user_id)]):
            delete_document(collection, doc["id"])

    delete_document("users", user_id)

    try:
        firebase_auth.delete_user(user_id)
    except Exception:
        logger.exception("Failed to delete Firebase Auth user %s", user_id)

    try:
        send_deletion_email(user["email"], user["full_name"])
    except Exception:
        logger.exception("Failed to send deletion email to %s", user.get("email"))

    return {"message": "Account and all associated data deleted successfully"}


@router.put("/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_document("users", user_id, {"is_active": False})
    return get_document("users", user_id)
