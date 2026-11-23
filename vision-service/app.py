from collections.abc import Callable
from io import BytesIO

from flask import Flask, request
from PIL import Image, ImageOps

from analysis import Detection, YoloDetector, read_text


def create_app(
    detect: Callable[[Image.Image], list[Detection]],
    ocr: Callable[[Image.Image], str],
) -> Flask:
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/analyze")
    def analyze():
        if request.mimetype != "image/jpeg":
            return {"error": "Envie a foto com Content-Type: image/jpeg."}, 415

        payload = request.get_data()
        try:
            with Image.open(BytesIO(payload), formats=["JPEG"]) as source:
                ImageOps.exif_transpose(source, in_place=True)
                image = source.convert("RGB")
        except (OSError, ValueError, SyntaxError, Image.DecompressionBombError):
            return {"error": "O corpo da requisição deve conter um JPEG válido."}, 400

        with image:
            detections = detect(image)
            ocr_result = {"text": ocr(image)} if detections else None
        return {"yoloResult": detections, "tesseractResult": ocr_result}

    @app.errorhandler(500)
    def analysis_failed(_error):
        return {"error": "Falha ao analisar a foto."}, 500

    return app


def create_production_app() -> Flask:
    return create_app(YoloDetector(), read_text)
