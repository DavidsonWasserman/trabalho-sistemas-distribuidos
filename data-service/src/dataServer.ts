import { createServer } from "node:http";
import { HttpError } from "./httpError";
import { queryPeriod, type PeriodDependencies } from "./periodQuery";
import { InvalidPhotoError } from "./photoCapture";
import { uploadPhoto, type UploadDependencies } from "./photoUpload";

export function createDataServer(deps: UploadDependencies & PeriodDependencies) {
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
      if (path === "/api/period") {
        res.setHeader("cache-control", "no-store");
        if (req.method !== "GET") {
          res.setHeader("allow", "GET");
          send(405, { error: "Use GET para consultar um período." });
        } else {
          const params = new URLSearchParams(queryIndex < 0 ? "" : url.slice(queryIndex + 1));
          send(200, await queryPeriod(req.headers.authorization, params, deps));
        }
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
