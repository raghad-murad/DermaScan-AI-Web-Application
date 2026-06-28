import json, torch, torch.nn as nn, io
from torchvision import models, transforms
from PIL import Image
from pathlib import Path

MODELS_DIR = Path(__file__).parent

class SkinPredictor:
    def __init__(self, model_dir: Path):
        with open(model_dir / "model_config.json") as f:
            self.config = json.load(f)
        with open(model_dir / "classes.json") as f:
            raw = json.load(f)
            self.idx_to_class = {int(k): v for k, v in raw.items()}

        num_classes = self.config["num_classes"]
        dropout_p   = self.config.get("dropout_p", 0.3)

        pth_files = list(model_dir.glob("*.pth"))
        if not pth_files:
            raise FileNotFoundError(f"No .pth file found in {model_dir}")

        base = models.resnet101(weights=None)
        base.fc = nn.Sequential(
            nn.Dropout(p=dropout_p),
            nn.Linear(base.fc.in_features, num_classes)
        )
        self.model = base
        self.model.load_state_dict(
            torch.load(pth_files[0], map_location="cpu")
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
        print(f"[ML] Loaded {model_dir.name} — {num_classes} classes")

    def predict(self, image_bytes: bytes, top_k: int = 3):
        image  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(image).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(tensor), dim=1)[0]
        top_probs, top_indices = torch.topk(probs, top_k)
        return [
            {
                "condition" : self.idx_to_class[idx.item()],
                "confidence": round(prob.item(), 4),
                "icd10"     : "N/A"
            }
            for prob, idx in zip(top_probs, top_indices)
        ]

_clinical   = None
_dermoscopy = None

def get_clinical_predictor() -> SkinPredictor:
    global _clinical
    if _clinical is None:
        _clinical = SkinPredictor(MODELS_DIR / "clinical")
    return _clinical

def get_dermoscopy_predictor() -> SkinPredictor:
    global _dermoscopy
    if _dermoscopy is None:
        _dermoscopy = SkinPredictor(MODELS_DIR / "dermoscopy")
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
        "image_type"     : image_type
    }
