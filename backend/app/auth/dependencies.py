from fastapi import HTTPException, Request, status
from firebase_admin import auth as firebase_auth

from app.firebase_admin import db


async def get_current_user(request: Request) -> dict:
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    id_token = authorization.removeprefix("Bearer ").strip()

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    uid = decoded_token["uid"]
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found",
        )

    user_data = user_doc.to_dict()
    return {
        "uid": uid,
        "email": user_data.get("email"),
        "role": user_data.get("role"),
        "full_name": user_data.get("full_name"),
    }
