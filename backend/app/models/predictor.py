import json, torch, torch.nn as nn, io
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from huggingface_hub import hf_hub_download
from app.config import settings

MODELS_DIR = Path(__file__).parent
CACHE_DIR  = MODELS_DIR / "cache"


def download_model_file(filename: str) -> Path:
    local_path = CACHE_DIR / filename
    if local_path.exists():
        print(f"[ML] Using cached: {filename}")
        return local_path
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[ML] Downloading from HuggingFace: {filename}")
    downloaded = hf_hub_download(
        repo_id=settings.HF_REPO_ID,
        filename=filename,
        token=settings.HF_TOKEN,
        local_dir=str(CACHE_DIR),
    )
    return Path(downloaded)


class SkinPredictor:
    CLINICAL_DISPLAY_NAMES = {
        "ACK": "Actinic Keratosis",
        "Acne and Rosacea": "Acne and Rosacea",
        "Atopic Dermatitis": "Atopic Dermatitis",
        "BCC": "Basal Cell Carcinoma",
        "Bacterial Infections": "Bacterial Infections",
        "Bullous Disease": "Bullous Disease",
        "Contact Dermatitis": "Contact Dermatitis",
        "Eczema": "Eczema",
        "Exanthems and Drug Eruptions": "Exanthems and Drug Eruptions",
        "Fungal Infections": "Fungal Infections",
        "Hair and Nail Diseases": "Hair and Nail Diseases",
        "Herpes and Viral STDs": "Herpes HPV and other STDs",
        "Infestations and Bites": "Infestations and Bites",
        "Lupus and Connective Tissue": "Lupus and Connective Tissue Diseases",
        "MEL": "Melanoma",
        "NEV": "Melanocytic Nevi",
        "Pigmentation Disorders": "Pigmentation Disorders",
        "Psoriasis and Lichen Planus": "Psoriasis and Lichen Planus",
        "SCC": "Squamous Cell Carcinoma",
        "SEK": "Seborrheic Keratosis",
        "Systemic Disease": "Systemic Disease",
        "Urticaria": "Urticaria",
        "Vascular Lesions": "Vascular Lesions",
        "Vasculitis": "Vasculitis",
        "Viral Infections": "Viral Infections",
    }

    DERMOSCOPY_DISPLAY_NAMES = {
        "AK": "Actinic Keratosis",
        "BCC": "Basal Cell Carcinoma",
        "BKL": "Benign Keratosis-like Lesions",
        "DF": "Dermatofibroma",
        "MEL": "Melanoma",
        "NV": "Melanocytic Nevi",
        "SCC": "Squamous Cell Carcinoma",
        "VASC": "Vascular Lesions",
    }

    CLINICAL_ICD10 = {
        "Actinic Keratosis": "L57.0",
        "Acne and Rosacea": "L70.0",
        "Atopic Dermatitis": "L20.9",
        "Basal Cell Carcinoma": "C44.91",
        "Bacterial Infections": "L08.9",
        "Bullous Disease": "L13.9",
        "Contact Dermatitis": "L25.9",
        "Eczema": "L30.9",
        "Exanthems and Drug Eruptions": "L27.0",
        "Fungal Infections": "B36.9",
        "Hair and Nail Diseases": "L60.9",
        "Herpes HPV and other STDs": "B00.9",
        "Infestations and Bites": "B88.9",
        "Lupus and Connective Tissue Diseases": "M32.9",
        "Melanoma": "C43.9",
        "Melanocytic Nevi": "D22.9",
        "Pigmentation Disorders": "L81.9",
        "Psoriasis and Lichen Planus": "L40.9",
        "Squamous Cell Carcinoma": "C44.92",
        "Seborrheic Keratosis": "L82.1",
        "Systemic Disease": "L99",
        "Urticaria": "L50.9",
        "Vascular Lesions": "L98.9",
        "Vasculitis": "L95.9",
        "Viral Infections": "B09",
    }

    DERMOSCOPY_ICD10 = {
        "Actinic Keratosis": "L57.0",
        "Basal Cell Carcinoma": "C44.91",
        "Benign Keratosis-like Lesions": "L82.1",
        "Dermatofibroma": "L98.0",
        "Melanoma": "C43.9",
        "Melanocytic Nevi": "D22.9",
        "Squamous Cell Carcinoma": "C44.92",
        "Vascular Lesions": "L98.9",
    }

    def __init__(
        self,
        prefix: str,
        display_names: dict[str, str] | None = None,
        icd10_map: dict[str, str] | None = None,
    ):
        self.display_names = display_names or {}
        self.icd10_map = icd10_map or {}

        config_path  = download_model_file(f"{prefix}_model_config.json")
        classes_path = download_model_file(f"{prefix}_classes.json")
        weights_path = download_model_file(f"{prefix}_resnet101.pth")

        with open(config_path) as f:
            self.config = json.load(f)
        with open(classes_path) as f:
            raw = json.load(f)
            self.idx_to_class = {int(k): v for k, v in raw.items()}

        num_classes = self.config["num_classes"]
        dropout_p   = self.config.get("dropout_p", 0.3)

        base = models.resnet101(weights=None)
        base.fc = nn.Sequential(
            nn.Dropout(p=dropout_p),
            nn.Linear(base.fc.in_features, num_classes)
        )
        self.model = base
        self.model.load_state_dict(
            torch.load(weights_path, map_location="cpu")
        )
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.config["mean"],
                std=self.config["std"]
            ),
        ])
        print(f"[ML] Loaded {prefix} model — {num_classes} classes")

    def predict(self, image_bytes: bytes, top_k: int = 3):
        image  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(image).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(tensor), dim=1)[0]
        top_probs, top_indices = torch.topk(probs, top_k)
        results = []
        for prob, idx in zip(top_probs, top_indices):
            raw_name     = self.idx_to_class[idx.item()]
            display_name = self.display_names.get(raw_name, raw_name)
            icd10        = self.icd10_map.get(display_name, "N/A") if self.icd10_map else "N/A"
            results.append({
                "condition" : display_name,
                "confidence": round(prob.item(), 4),
                "icd10"     : icd10,
            })
        return results


_clinical   = None
_dermoscopy = None


def get_clinical_predictor() -> SkinPredictor:
    global _clinical
    if _clinical is None:
        _clinical = SkinPredictor(
            "clinical",
            SkinPredictor.CLINICAL_DISPLAY_NAMES,
            SkinPredictor.CLINICAL_ICD10,
        )
    return _clinical


def get_dermoscopy_predictor() -> SkinPredictor:
    global _dermoscopy
    if _dermoscopy is None:
        _dermoscopy = SkinPredictor(
            "dermoscopy",
            SkinPredictor.DERMOSCOPY_DISPLAY_NAMES,
            SkinPredictor.DERMOSCOPY_ICD10,
        )
    return _dermoscopy


def predict(image_bytes: bytes, image_type: str, top_k: int = 3):
    if image_type == "dermoscopic":
        predictor  = get_dermoscopy_predictor()
        model_name = "ResNet-101 dermoscopy (FocalLoss+InvSqrt γ=1.0)"
    else:
        predictor  = get_clinical_predictor()
        model_name = "ResNet-101 clinical (FocalLoss+MedianFreq)"

    return {
        "top_predictions": predictor.predict(image_bytes, top_k),
        "model_used"     : model_name,
        "image_type"     : image_type,
    }
