import { createServer } from "node:http";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getAuthenticatedProfile } from "./authentication";
import { dependencyError, HttpError } from "./httpError";
import { queryPeriod, type PeriodDependencies } from "./periodQuery";
import { InvalidPhotoError } from "./photoCapture";
import { uploadPhoto, type UploadDependencies } from "./photoUpload";

interface PhotoOriginalDependencies {
  findPhotoOriginal: (id: number) => Promise<{ bucket: string; key: string } | undefined>;
  getOriginal: (bucket: string, key: string) => Promise<Readable>;
}

export function createDataServer(deps: UploadDependencies & PeriodDependencies & PhotoOriginalDependencies) {
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
      const url = req.url ?? "";
      const queryIndex = url.indexOf("?");
      const path = queryIndex < 0 ? url : url.slice(0, queryIndex);
      const original = /^\/api\/photos\/([1-9]\d{0,9})\/original$/.exec(path);
      if (path === "/api/period") {
        res.setHeader("cache-control", "no-store");
        if (req.method !== "GET") {
          res.setHeader("allow", "GET");
          send(405, { error: "Use GET para consultar um período." });
        } else {
          const params = new URLSearchParams(queryIndex < 0 ? "" : url.slice(queryIndex + 1));
          send(200, await queryPeriod(req.headers.authorization, params, deps));
        }
      } else if (original) {
        res.setHeader("cache-control", "no-store");
        if (req.method !== "GET") {
          res.setHeader("allow", "GET");
          send(405, { error: "Use GET para consultar uma foto." });
          return;
        }

        await getAuthenticatedProfile(req.headers.authorization, deps.authUrl);
        const id = Number(original[1]);
        if (id > 2_147_483_647) {
          throw new HttpError(404, "Foto não encontrada.");
        }
        const photo = await deps.findPhotoOriginal(id).catch((error: unknown) => {
          throw dependencyError("o PostgreSQL", error);
        });
        if (!photo) {
          throw new HttpError(404, "Foto não encontrada.");
        }

        const body = await deps.getOriginal(photo.bucket, photo.key);
        res.writeHead(200, { "content-type": "image/jpeg", "x-content-type-options": "nosniff" });
        await pipeline(body, res);
      } else if (path === "/api/photos") {
        if (req.method !== "POST") {
          res.setHeader("allow", "POST");
          send(405, { error: "Use POST para enviar fotos." });
        } else {
          send(201, await uploadPhoto(req, deps));
        }
      } else {
        send(404, { error: "Rota não encontrada." });
      }
    } catch (error) {
      if (error instanceof HttpError || error instanceof InvalidPhotoError) {
        send(error instanceof HttpError ? error.status : 400, { error: error.message });
      } else {
        console.error("Falha inesperada no serviço de dados.");
        send(500, { error: "Falha inesperada no serviço de dados." });
      }
    }
  });
}
