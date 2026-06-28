from app.models.predictor import predict as ml_predict

def predict(image_bytes: bytes, image_type: str) -> dict:
    return ml_predict(image_bytes, image_type, top_k=3)
