from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.auth.dependencies import get_current_user
from app.services.firestore_service import create_document, get_collection, get_document
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

    data = {
        "patient_id": patient_id,
        "doctor_id": current_user["uid"],
        "image_type": image_type,
        "image_url": "",
        "top_predictions": prediction["top_predictions"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
    }
    analysis_id = create_document("analyses", data)
    return get_document("analyses", analysis_id)


@router.get("/")
async def list_analyses(current_user: dict = Depends(get_current_user)):
    return get_collection("analyses", filters=[("doctor_id", "==", current_user["uid"])])


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = get_document("analyses", analysis_id)
    if not analysis or analysis.get("doctor_id") != current_user["uid"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis
