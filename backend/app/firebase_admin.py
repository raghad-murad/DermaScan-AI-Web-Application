import json
import os
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin import auth as firebase_auth

def _initialize():
    if firebase_admin._apps:
        return

    service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()

    if service_account_json:
        try:
            service_account_dict = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_dict)
            print("[Firebase] Initialized from environment variable")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
    else:
        from app.config import settings
        if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            raise ValueError("No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH")
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        print("[Firebase] Initialized from file path")

    firebase_admin.initialize_app(cred)

_initialize()

db = firestore.client()
auth = firebase_auth