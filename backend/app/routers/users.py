from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.services.firestore_service import get_document, update_document

router = APIRouter()


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return get_document("users", current_user["uid"])


@router.put("/me")
async def update_my_profile(payload: dict, current_user: dict = Depends(get_current_user)):
    allowed_fields = {"full_name", "username", "phonenumber"}
    update_data = {k: v for k, v in payload.items() if k in allowed_fields}

    update_document("users", current_user["uid"], update_data)
    return get_document("users", current_user["uid"])
