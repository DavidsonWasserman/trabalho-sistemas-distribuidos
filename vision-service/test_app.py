import unittest
from io import BytesIO
from unittest.mock import Mock

from PIL import Image

from app import create_app


CUP = {"className": "cup", "confidence": 0.9, "bbox": [1, 2, 20, 30]}
VASE = {"className": "vase", "confidence": 0.8, "bbox": [20, 0, 35, 30]}
PLANT = {"className": "potted plant", "confidence": 0.7, "bbox": [0, 0, 12, 20]}


def jpeg_payload() -> bytes:
    with Image.new("RGB", (32, 48)) as image, BytesIO() as buffer:
        exif = image.getexif()
        exif[274] = 6  # Rotação de 90 graus no sentido horário.
        image.save(buffer, format="JPEG", exif=exif)
        return buffer.getvalue()


class AnalysisRouteTest(unittest.TestCase):
    def setUp(self):
        self.detect = Mock(return_value=[])
        self.ocr = Mock(return_value="")
        self.client = create_app(self.detect, self.ocr).test_client()
        self.jpeg = jpeg_payload()

    def analyze(self):
        return self.client.post("/analyze", data=self.jpeg, content_type="image/jpeg")

    def test_no_object_skips_ocr(self):
        response = self.analyze()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"yoloResult": [], "tesseractResult": None})
        self.detect.assert_called_once()
        self.ocr.assert_not_called()

    def test_object_without_text_returns_empty_string(self):
        self.detect.return_value = [CUP]
        response = self.analyze()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json, {"yoloResult": [CUP], "tesseractResult": {"text": ""}}
        )
        self.ocr.assert_called_once()

    def test_multiple_objects_run_ocr_once_on_the_oriented_photo(self):
        def recognize(image):
            self.assertEqual(image.size, (48, 32))
            self.assertIs(image, self.detect.call_args.args[0])
            return "Amostra 42"

        self.detect.return_value = [CUP, VASE, PLANT]
        self.ocr.side_effect = recognize
        response = self.analyze()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json,
            {
                "yoloResult": [CUP, VASE, PLANT],
                "tesseractResult": {"text": "Amostra 42"},
            },
        )
        self.ocr.assert_called_once()

    def test_rejects_unsupported_content_type(self):
        response = self.client.post("/analyze", data=self.jpeg, content_type="image/png")

        self.assertEqual(response.status_code, 415)
        self.detect.assert_not_called()
        self.ocr.assert_not_called()

    def test_rejects_invalid_jpeg(self):
        response = self.client.post(
            "/analyze", data=self.jpeg[:-40], content_type="image/jpeg"
        )

        self.assertEqual(response.status_code, 400)
        self.detect.assert_not_called()
        self.ocr.assert_not_called()

    def test_ocr_failure_returns_an_error(self):
        self.detect.return_value = [CUP]
        self.ocr.side_effect = RuntimeError("OCR indisponível")
        with self.assertLogs(level="ERROR"):
            response = self.analyze()

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json, {"error": "Falha ao analisar a foto."})

    def test_inference_failure_returns_an_error_and_skips_ocr(self):
        self.detect.side_effect = RuntimeError("Inferência indisponível")
        with self.assertLogs(level="ERROR"):
            response = self.analyze()

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json, {"error": "Falha ao analisar a foto."})
        self.ocr.assert_not_called()

    def test_health(self):
        self.assertEqual(self.client.get("/health").json, {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
