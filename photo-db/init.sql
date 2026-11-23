BEGIN;

CREATE TABLE photo_metadata (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    captured_at timestamptz NOT NULL,
    original_bucket text NOT NULL,
    original_key text NOT NULL,
    yolo_result jsonb NOT NULL,
    tesseract_result jsonb,
    CONSTRAINT photo_metadata_original_unique UNIQUE (original_bucket, original_key)
);

CREATE INDEX photo_metadata_captured_at_id_idx ON photo_metadata (captured_at, id);

COMMIT;
