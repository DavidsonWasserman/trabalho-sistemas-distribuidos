import subprocess
from io import BytesIO
from pathlib import Path
from typing import TypedDict

from PIL import Image


INTEREST_CLASSES = {"cup", "vase", "potted plant"}
MODEL_PATH = Path(__file__).with_name("models") / "yolov8n.pt"


class Detection(TypedDict):
    className: str
    confidence: float
    bbox: list[float]


class YoloDetector:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        from ultralytics import YOLO

        if not model_path.is_file():
            raise FileNotFoundError(f"Pesos do YOLOv8 ausentes em {model_path}")
        self.model = YOLO(model_path, task="detect")
        self.class_ids = [
            class_id
            for class_id, name in self.model.names.items()
            if name in INTEREST_CLASSES
        ]
        if len(self.class_ids) != len(INTEREST_CLASSES):
            raise ValueError("O modelo YOLOv8 precisa ter as três classes de interesse.")

    def __call__(self, image: Image.Image) -> list[Detection]:
        (result,) = self.model.predict(
            image, device="cpu", classes=self.class_ids, conf=0.25, verbose=False
        )
        return [
            Detection(
                className=result.names[int(box.cls.item())],
                confidence=box.conf.item(),
                bbox=box.xyxy[0].tolist(),
            )
            for box in result.boxes
        ]


def read_text(image: Image.Image) -> str:
    with BytesIO() as image_buffer:
        image.save(image_buffer, format="PNG")
        result = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", "por+eng"],
            input=image_buffer.getvalue(),
            capture_output=True,
            check=True,
            timeout=30,
        )
    return result.stdout.decode("utf-8").strip()
