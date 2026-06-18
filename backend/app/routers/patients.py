from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.services.firestore_service import (
    create_document,
    delete_document,
    get_collection,
    get_document,
    update_document,
)

router = APIRouter()


def _get_owned_patient(patient_id: str, doctor_id: str) -> dict:
    patient = get_document("patients", patient_id)
    if not patient or patient.get("doctor_id") != doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.get("/")
async def list_patients(current_user: dict = Depends(get_current_user)):
    return get_collection("patients", filters=[("doctor_id", "==", current_user["uid"])])


@router.post("/")
async def create_patient(payload: dict, current_user: dict = Depends(get_current_user)):
    data = {
        **payload,
        "doctor_id": current_user["uid"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    patient_id = create_document("patients", data)
    return get_document("patients", patient_id)


@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    return _get_owned_patient(patient_id, current_user["uid"])


@router.put("/{patient_id}")
async def update_patient(patient_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    _get_owned_patient(patient_id, current_user["uid"])
    update_document("patients", patient_id, payload)
    return get_document("patients", patient_id)


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    _get_owned_patient(patient_id, current_user["uid"])
    delete_document("patients", patient_id)
    return {"status": "deleted", "id": patient_id}
