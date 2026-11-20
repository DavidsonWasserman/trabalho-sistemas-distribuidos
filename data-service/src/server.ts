import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";
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
const storage = new S3Client({
  endpoint: process.env.PHOTO_S3_ENDPOINT ?? "http://seaweedfs:8333",
  region: "us-east-1",
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  maxAttempts: 1,
  credentials: {
    accessKeyId: requiredEnv("PHOTO_S3_ACCESS_KEY"),
    secretAccessKey: requiredEnv("PHOTO_S3_SECRET_KEY"),
  },
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
});
server.listen(Number(process.env.PORT ?? "3002"), "0.0.0.0");
