import { Temporal } from "@js-temporal/polyfill";
import { getAuthenticatedProfile } from "./authentication";
import { dependencyError, HttpError } from "./httpError";
import type { Measurement } from "./measurements";
import type { PhotoMetadata } from "./photoMetadata";
import { parseUtcDate } from "./utcDate";

export interface PeriodDependencies {
  authUrl: string;
  listMeasurements: (start: Date, end: Date) => Promise<Measurement[]>;
  listPhotoMetadata: (start: Date, end: Date) => Promise<PhotoMetadata[]>;
}

function readParameter(params: URLSearchParams, name: string): string | undefined {
  const values = params.getAll(name);
  if (values.length > 1) {
    throw new HttpError(400, `Informe ${name} uma única vez.`);
  }
  return values[0];
}

function readPeriod(params: URLSearchParams) {
  const start = readParameter(params, "start");
  const end = readParameter(params, "end");
  if (start === undefined || end === undefined) {
    throw new HttpError(400, "Informe start e end para consultar o período.");
  }

  try {
    const startDate = parseUtcDate(start);
    const endDate = parseUtcDate(end);
    if (startDate >= endDate) {
      throw new RangeError("O início deve ser anterior ao fim.");
    }
    return { startDate, endDate };
  } catch (error) {
    if (error instanceof RangeError) {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
}

function readPhotoPair(params: URLSearchParams) {
  const from = readParameter(params, "fromPhotoId");
  const to = readParameter(params, "toPhotoId");
  if (from === undefined && to === undefined) {
    return undefined;
  }

  const fromId = Number(from);
  const toId = Number(to);
  if (!/^[1-9]\d*$/.test(from ?? "") || !/^[1-9]\d*$/.test(to ?? "")
    || !Number.isSafeInteger(fromId) || !Number.isSafeInteger(toId) || fromId === toId) {
    throw new HttpError(400, "Informe fromPhotoId e toPhotoId como IDs inteiros positivos e distintos.");
  }
  return { fromId, toId };
}

function measurementVariations(measurements: Measurement[]) {
  const fields = ["temperature", "humidity", "pressure", "rssi"] as const;
  return Object.fromEntries(fields.map((field) => {
    let firstValue: number | undefined;
    let firstTimestamp: string | undefined;
    let delta: number | null = null;
    for (const reading of measurements) {
      const value = reading[field];
      if (value === null) continue;
      if (firstValue === undefined) {
        firstValue = value;
        firstTimestamp = reading.timestamp;
      } else if (reading.timestamp !== firstTimestamp) {
        delta = value - firstValue;
      }
    }
    return [field, delta];
  }));
}

function detectionCounts(result: PhotoMetadata["yoloResult"]): Map<string, number> {
  const counts = new Map<string, number>();
  if (Array.isArray(result)) {
    for (const detection of result) {
      if (detection && typeof detection === "object" && !Array.isArray(detection)
        && typeof detection.className === "string") {
        counts.set(detection.className, (counts.get(detection.className) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function ocrText(result: PhotoMetadata["tesseractResult"]): string | null {
  return result && typeof result === "object" && !Array.isArray(result) && typeof result.text === "string"
    ? result.text
    : null;
}

function comparePhotos(photos: PhotoMetadata[], pair: { fromId: number; toId: number }) {
  const from = photos.find((photo) => photo.id === pair.fromId);
  const to = photos.find((photo) => photo.id === pair.toId);
  if (!from || !to) {
    throw new HttpError(404, "As duas fotos selecionadas devem estar no período consultado.");
  }

  const fromCounts = detectionCounts(from.yoloResult);
  const toCounts = detectionCounts(to.yoloResult);
  const classes = [...new Set([...fromCounts.keys(), ...toCounts.keys()])].sort();
  const detectionChanges = classes.map((className) => ({
    className,
    delta: (toCounts.get(className) ?? 0) - (fromCounts.get(className) ?? 0),
  })).filter(({ delta }) => delta !== 0);

  const fromText = ocrText(from.tesseractResult);
  const toText = ocrText(to.tesseractResult);
  return {
    fromPhotoId: from.id,
    toPhotoId: to.id,
    detectionChanges,
    ocr: {
      fromText,
      toText,
      changed: fromText === null || toText === null ? null : fromText !== toText,
    },
  };
}

export async function queryPeriod(authorization: string | undefined, params: URLSearchParams, deps: PeriodDependencies) {
  await getAuthenticatedProfile(authorization, deps.authUrl);
  const { startDate, endDate } = readPeriod(params);
  const includeVariations = readParameter(params, "includeVariations");
  if (includeVariations !== undefined && includeVariations !== "true" && includeVariations !== "false") {
    throw new HttpError(400, "Use true ou false em includeVariations.");
  }
  const pair = readPhotoPair(params);

  const [readings, photos] = await Promise.all([
    deps.listMeasurements(startDate, endDate).catch((error: unknown) => { throw dependencyError("o InfluxDB", error); }),
    deps.listPhotoMetadata(startDate, endDate).catch((error: unknown) => { throw dependencyError("o PostgreSQL", error); }),
  ]);
  const measurements = readings
    .map((reading) => ({ reading, time: Temporal.Instant.from(reading.timestamp) }))
    .sort((a, b) => Temporal.Instant.compare(a.time, b.time))
    .map(({ reading }) => reading);

  return {
    measurements,
    photos,
    ...(includeVariations === "true" && { variations: measurementVariations(measurements) }),
    ...(pair && { photoComparison: comparePhotos(photos, pair) }),
  };
}
