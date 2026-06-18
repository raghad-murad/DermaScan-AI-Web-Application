from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProfile(BaseModel):
    uid: str
    email: str
    full_name: str
    role: str
    username: str
    phonenumber: str
    created_at: datetime


class Patient(BaseModel):
    id: Optional[str] = None
    full_name: str
    date_of_birth: str
    gender: str
    contact_number: str
    notes: Optional[str] = None
    doctor_id: str
    created_at: datetime


class Prediction(BaseModel):
    condition: str
    confidence: float
    icd10: Optional[str] = None


class Analysis(BaseModel):
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    image_type: str  # "clinical" or "dermoscopic"
    image_url: str
    top_predictions: list[Prediction]
    created_at: datetime
    status: str


class AccountRequest(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: str
    specialty: str
    hospital: str
    license_number: str
    status: str = "pending"  # pending/approved/rejected
    created_at: datetime
    admin_message: Optional[str] = None


class SupportTicket(BaseModel):
    id: Optional[str] = None
    doctor_id: str
    subject: str
    message: str
    status: str = "open"  # open/closed
    created_at: datetime
