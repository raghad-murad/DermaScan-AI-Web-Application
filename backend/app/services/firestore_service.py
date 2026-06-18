from typing import Optional

from app.firebase_admin import db


def get_document(collection: str, doc_id: str) -> Optional[dict]:
    doc = db.collection(collection).document(doc_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


def get_collection(collection: str, filters: Optional[list[tuple]] = None) -> list[dict]:
    query = db.collection(collection)
    if filters:
        for field, op, value in filters:
            query = query.where(field, op, value)

    results = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results


def create_document(collection: str, data: dict, doc_id: Optional[str] = None) -> str:
    if doc_id:
        db.collection(collection).document(doc_id).set(data)
        return doc_id

    doc_ref = db.collection(collection).document()
    doc_ref.set(data)
    return doc_ref.id


def update_document(collection: str, doc_id: str, data: dict) -> None:
    db.collection(collection).document(doc_id).update(data)


def delete_document(collection: str, doc_id: str) -> None:
    db.collection(collection).document(doc_id).delete()
