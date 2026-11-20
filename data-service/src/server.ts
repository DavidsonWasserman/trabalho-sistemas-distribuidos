import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { addAbortSignal, Readable } from "node:stream";
import postgres from "postgres";
import { dependencyError, HttpError } from "./httpError";
import { createPhotoMetadataRepository } from "./photoMetadata";
import { createDataServer } from "./dataServer";
import { listMeasurements } from "./measurements";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Defina ${name} para iniciar o serviço de dados.`);
  }
  return value;
}

const sql = postgres({
  host: process.env.PHOTO_DB_HOST ?? "photo-db",
  port: Number(process.env.PHOTO_DB_PORT ?? "5432"),
  database: "photos",
  user: "photos",
  password: requiredEnv("PHOTO_DB_PASSWORD"),
  connect_timeout: 5,
  connection: { statement_timeout: 10_000 },
});
const storageConfig = {
  endpoint: process.env.PHOTO_S3_ENDPOINT ?? "http://seaweedfs:8333",
  region: "us-east-1",
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  maxAttempts: 1,
} as const;
const storage = new S3Client({
  ...storageConfig,
  credentials: {
    accessKeyId: requiredEnv("PHOTO_S3_ACCESS_KEY"),
    secretAccessKey: requiredEnv("PHOTO_S3_SECRET_KEY"),
  },
});
const photoReader = new S3Client({
  ...storageConfig,
  credentials: async () => ({
    accessKeyId: requiredEnv("PHOTO_S3_READ_ACCESS_KEY"),
    secretAccessKey: requiredEnv("PHOTO_S3_READ_SECRET_KEY"),
  }),
});

async function sendToStorage(send: (signal: AbortSignal) => Promise<unknown>): Promise<void> {
  const signal = AbortSignal.timeout(10_000);
  try {
    await send(signal);
  } catch (error) {
    throw signal.aborted ? signal.reason : error;
  }
}

const server = createDataServer({
  listMeasurements,
  authUrl: process.env.AUTH_SERVICE_URL ?? "http://auth-service:3001",
  visionUrl: process.env.VISION_SERVICE_URL ?? "http://vision-service:8000",
  ...createPhotoMetadataRepository(sql),
  putOriginal: (bucket, key, jpeg) => sendToStorage((abortSignal) => storage.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: jpeg,
    ContentType: "image/jpeg",
  }), { abortSignal })),
  deleteOriginal: (bucket, key) => sendToStorage((abortSignal) =>
    storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), { abortSignal })),
  async getOriginal(bucket, key) {
    const signal = AbortSignal.timeout(10_000);
    try {
      const { Body } = await photoReader.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: signal });
      if (!(Body instanceof Readable)) {
        throw new Error("O SeaweedFS retornou uma resposta sem JPEG.");
      }
      return addAbortSignal(signal, Body);
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        throw new HttpError(404, "O original da foto não está disponível.");
      }
      throw dependencyError("o SeaweedFS", signal.aborted ? signal.reason : error);
    }
  },
});
server.listen(Number(process.env.PORT ?? "3002"), "0.0.0.0");
