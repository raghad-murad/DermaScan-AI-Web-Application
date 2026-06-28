import base64
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.auth.dependencies import get_current_user
from app.services.firestore_service import create_document, get_collection, get_document, update_document
from app.services.ml_service import predict

router = APIRouter()


@router.post("/")
async def create_analysis(
    patient_id: str = Form(...),
    image_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    image_bytes = await file.read()
    prediction = predict(image_bytes, image_type)

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    image_content_type = file.content_type or "image/jpeg"

    data = {
        "patient_id": patient_id,
        "doctor_id": current_user["uid"],
        "image_type": image_type,
        "image_url": "",
        "image_base64": image_base64,
        "image_content_type": image_content_type,
        "top_predictions": prediction["top_predictions"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
    }
    analysis_id = create_document("analyses", data)
    print(f"Saved analysis doc fields: {list(data.keys())}")
    return get_document("analyses", analysis_id)


@router.get("/")
async def list_analyses(patient_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    filters = []
    if current_user["role"] != "admin":
        filters.append(("doctor_id", "==", current_user["uid"]))
    if patient_id:
        filters.append(("patient_id", "==", patient_id))
    return get_collection("analyses", filters=filters or None)


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = get_document("analyses", analysis_id)
    if not analysis or (current_user["role"] != "admin" and analysis.get("doctor_id") != current_user["uid"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


@router.put("/{analysis_id}")
async def update_analysis(analysis_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    analysis = get_document("analyses", analysis_id)
    if not analysis or analysis.get("doctor_id") != current_user["uid"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    allowed_fields = {"notes"}
    update_data = {k: v for k, v in payload.items() if k in allowed_fields}
    update_document("analyses", analysis_id, update_data)
    return get_document("analyses", analysis_id)
