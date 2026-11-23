FROM python:3.12-slim-bookworm AS ocr-build

ARG TESSERACT_VERSION=5.5.4
ARG TESSDATA_VERSION=4.1.0

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential ca-certificates cmake curl libleptonica-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp/tesseract /ocr/tessdata \
    && curl -fsSL -o /tmp/tesseract.tar.gz \
        "https://codeload.github.com/tesseract-ocr/tesseract/tar.gz/refs/tags/${TESSERACT_VERSION}" \
    && tar -xzf /tmp/tesseract.tar.gz --strip-components=1 -C /tmp/tesseract \
    && cmake -S /tmp/tesseract -B /tmp/tesseract-build \
        -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
        -DBUILD_TRAINING_TOOLS=OFF -DGRAPHICS_DISABLED=ON \
        -DDISABLE_ARCHIVE=ON -DDISABLE_CURL=ON \
    && cmake --build /tmp/tesseract-build --target tesseract --parallel 2 \
    && install -m 755 /tmp/tesseract-build/bin/tesseract /ocr/tesseract \
    && for language in por eng; do \
        curl -fsSL -o "/ocr/tessdata/${language}.traineddata" \
            "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${TESSDATA_VERSION}/${language}.traineddata" \
            || exit 1; \
    done

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    YOLO_CONFIG_DIR=/tmp/Ultralytics \
    YOLO_AUTOINSTALL=False \
    TESSDATA_PREFIX=/usr/local/share/tessdata

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl libgl1 libglib2.0-0 liblept5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.8.0 torchvision==0.23.0 \
    && pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/models \
    && curl -fsSL -o /app/models/yolov8n.pt \
        https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt

COPY --from=ocr-build /ocr/tesseract /usr/local/bin/tesseract
COPY --from=ocr-build /ocr/tessdata /usr/local/share/tessdata
COPY app.py analysis.py ./

USER 65534:65534
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--timeout", "120", "app:create_production_app()"]
