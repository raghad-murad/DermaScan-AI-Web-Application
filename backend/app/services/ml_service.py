# TODO: Replace this mock implementation with the real ResNet-101 model.
def predict(image_bytes: bytes, image_type: str) -> dict:
    return {
        "top_predictions": [
            {"condition": "Melanoma", "confidence": 0.78, "icd10": "C43.9"},
            {"condition": "Basal Cell Carcinoma", "confidence": 0.15, "icd10": "C44.91"},
            {"condition": "Actinic Keratosis", "confidence": 0.07, "icd10": "L57.0"},
        ],
        "model_used": "mock",
        "image_type": image_type,
    }
