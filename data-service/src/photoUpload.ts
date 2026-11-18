import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { InvalidPhotoError, readCapturedAt } from "./photoCapture";
import type { NewPhotoMetadata, PhotoMetadata } from "./photoMetadata";

const MAX_JPEG_BYTES = 10 * 1024 * 1024;
const BUCKET = "fotos";
type Analysis = Pick<NewPhotoMetadata, "yoloResult" | "tesseractResult">;

interface UploadDependencies {
  authUrl: string;
  visionUrl: string;
  putOriginal: (bucket: string, key: string, jpeg: Buffer) => Promise<void>;
  deleteOriginal: (bucket: string, key: string) => Promise<void>;
  insertPhotoMetadata: (input: NewPhotoMetadata) => Promise<PhotoMetadata>;
}

class UploadError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function dependencyError(service: string, error: unknown): UploadError {
  const timedOut = error instanceof Error && error.name === "TimeoutError";
  return timedOut
    ? new UploadError(504, `Tempo limite excedido ao acessar ${service}.`)
    : new UploadError(502, `Falha ao acessar ${service}.`);
}

async function requireAdmin(req: IncomingMessage, authUrl: string): Promise<void> {
  const authorization = req.headers.authorization;
  if (!authorization || !/^Bearer \S+$/.test(authorization)) {
    throw new UploadError(401, "Informe um token Bearer válido.");
  }

  let profile: unknown;
  try {
    const response = await fetch(new URL("/api/user/me", authUrl), {
      headers: { authorization },
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401) {
        throw new UploadError(401, "Token inválido ou expirado.");
      }
      throw new Error("Falha do autenticador.");
    }
    profile = await response.json();
  } catch (error) {
    if (error instanceof UploadError) {
      throw error;
    }
    throw dependencyError("o autenticador", error);
  }

  if (!hasFields(profile) || typeof profile.isAdmin !== "boolean") {
    throw dependencyError("o autenticador", undefined);
  }
  if (!profile.isAdmin) {
    throw new UploadError(403, "Somente administradores podem enviar fotos.");
  }
}

async function readJpeg(req: IncomingMessage): Promise<Buffer<ArrayBuffer>> {
  const mediaType = req.headers["content-type"]?.split(";")[0].trim().toLowerCase();
  const encoding = req.headers["content-encoding"]?.trim().toLowerCase();
  if (mediaType !== "image/jpeg" || (encoding && encoding !== "identity")) {
    throw new UploadError(415, "Envie o JPEG original com Content-Type: image/jpeg.");
  }
  const tooLarge = new UploadError(413, "O JPEG excede o limite de 10 MiB.");
  if (Number(req.headers["content-length"]) > MAX_JPEG_BYTES) {
    throw tooLarge;
  }

  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > MAX_JPEG_BYTES) {
      throw tooLarge;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, bytes);
}

function hasFields(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDetection(value: unknown): value is { className: string; confidence: number; bbox: number[] } {
  return hasFields(value)
    && typeof value.className === "string"
    && typeof value.confidence === "number"
    && Number.isFinite(value.confidence)
    && Array.isArray(value.bbox)
    && value.bbox.length === 4
    && value.bbox.every(Number.isFinite);
}

async function analyze(jpeg: Buffer<ArrayBuffer>, visionUrl: string): Promise<Analysis> {
  try {
    const response = await fetch(new URL("/analyze", visionUrl), {
      method: "POST",
      headers: { "content-type": "image/jpeg" },
      body: jpeg,
      redirect: "error",
      signal: AbortSignal.timeout(125_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 400) {
        throw new InvalidPhotoError("O corpo da requisição deve conter um JPEG válido.");
      }
      throw new Error("Falha do analisador.");
    }

    const result: unknown = await response.json();
    if (!hasFields(result) || !Array.isArray(result.yoloResult) || !result.yoloResult.every(isDetection)) {
      throw new Error("Resultado YOLO inválido.");
    }
    const { yoloResult, tesseractResult } = result;
    if (yoloResult.length === 0 && tesseractResult === null) {
      return { yoloResult, tesseractResult };
    }
    if (yoloResult.length > 0 && hasFields(tesseractResult) && typeof tesseractResult.text === "string") {
      return { yoloResult, tesseractResult: { text: tesseractResult.text } };
    }
    throw new Error("Resultado OCR inválido.");
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      throw error;
    }
    throw dependencyError("o serviço de visão", error);
  }
}

function postgresCode(error: unknown): string | undefined {
  // O Drizzle encapsula os erros do driver em Error.cause.
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if ("code" in cause && typeof cause.code === "string") {
      return cause.code;
    }
  }
  return undefined;
}

async function insertWithDeadline(deps: UploadDependencies, input: NewPhotoMetadata): Promise<PhotoMetadata> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      deps.insertPhotoMetadata(input),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new DOMException("Prazo de gravação excedido.", "TimeoutError")), 15_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function discardOriginal(deps: UploadDependencies, key: string): Promise<void> {
  try {
    await deps.deleteOriginal(BUCKET, key);
  } catch {
    console.error("Falha ao remover o original após envio malsucedido:", key);
  }
}

async function upload(req: IncomingMessage, deps: UploadDependencies): Promise<PhotoMetadata> {
  await requireAdmin(req, deps.authUrl);
  const jpeg = await readJpeg(req);
  const capturedAt = await readCapturedAt(jpeg);
  const originalKey = `${capturedAt.toISOString()}-${randomUUID()}.jpg`;

  try {
    await deps.putOriginal(BUCKET, originalKey, jpeg);
  } catch (error) {
    console.error("Falha ao guardar o original:", originalKey);
    throw dependencyError("o SeaweedFS", error);
  }

  let analysis: Analysis;
  try {
    analysis = await analyze(jpeg, deps.visionUrl);
  } catch (error) {
    await discardOriginal(deps, originalKey);
    throw error;
  }

  try {
    return await insertWithDeadline(deps, { capturedAt, originalBucket: BUCKET, originalKey, ...analysis });
  } catch (error) {
    const code = postgresCode(error) ?? "";
    // Só apagar quando a resposta do PostgreSQL comprova que o INSERT foi rejeitado.
    if (/^(22|23|42)[A-Z0-9]{3}$/.test(code) || ["40001", "40P01", "57014"].includes(code)) {
      await discardOriginal(deps, originalKey);
    } else {
      console.error("Resultado da gravação no PostgreSQL incerto. Original preservado:", originalKey);
    }
    if (code === "57014" || code === "CONNECT_TIMEOUT") {
      throw new UploadError(504, "Tempo limite excedido ao gravar os metadados da foto.");
    }
    throw dependencyError("o PostgreSQL", error);
  }
}

export function createPhotoUploadServer(deps: UploadDependencies) {
  return createServer(async (req, res) => {
    const send = (status: number, body: object) => {
      if (!res.destroyed) {
        if (!req.readableEnded) {
          res.setHeader("connection", "close");
        }
        res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(body));
      }
    };

    try {
      if (req.url?.split("?", 1)[0] !== "/api/photos") {
        send(404, { error: "Rota não encontrada." });
      } else if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        send(405, { error: "Use POST para enviar fotos." });
      } else {
        send(201, await upload(req, deps));
      }
    } catch (error) {
      if (error instanceof UploadError || error instanceof InvalidPhotoError) {
        send(error instanceof UploadError ? error.status : 400, { error: error.message });
      } else {
        console.error("Falha inesperada ao receber foto.");
        send(500, { error: "Falha inesperada ao receber foto." });
      }
    }
  });
}
