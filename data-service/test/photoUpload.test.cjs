const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createServer, request } = require("node:http");
const { test } = require("node:test");
const { createDataServer } = require("../dist/dataServer");

const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAEAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AH//Z",
  "base64",
);

function withCapture(date, offset) {
  const tags = [[0x9003, date]];
  if (offset !== undefined) tags.push([0x9011, offset]);

  // TIFF little-endian, IFD0 -> Exif IFD, seguido pelas strings ASCII.
  const tiff = Buffer.from("49492a0008000000010069870400010000001a00000000000000", "hex");
  const directory = Buffer.alloc(2 + 12 * tags.length + 4);
  directory.writeUInt16LE(tags.length);
  let stringOffset = tiff.length + directory.length;
  const strings = tags.map(([tag, value], index) => {
    const bytes = Buffer.from(value + "\0", "ascii");
    const entry = 2 + 12 * index;
    directory.writeUInt16LE(tag, entry);
    directory.writeUInt16LE(2, entry + 2);
    directory.writeUInt32LE(bytes.length, entry + 4);
    directory.writeUInt32LE(stringOffset, entry + 8);
    stringOffset += bytes.length;
    return bytes;
  });
  const app1 = Buffer.from([0xff, 0xe1, 0, 0]);
  const signature = Buffer.from("Exif\0\0");
  app1.writeUInt16BE(stringOffset + signature.length + 2, 2);
  return Buffer.concat([JPEG.subarray(0, 2), app1, signature, tiff, directory, ...strings, JPEG.subarray(2)]);
}

async function listen(t, server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

async function setup(t) {
  const calls = [];
  let visionStatus = 200;
  let visionResult = { yoloResult: [], tesseractResult: null };
  let storageError;
  let databaseError;
  let id = 0;

  const internalUrl = await listen(t, createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/api/user/me") {
      calls.push(["auth", req.headers.authorization]);
      if (req.headers.authorization === "Bearer unavailable") res.statusCode = 500;
      else if (!["Bearer admin", "Bearer client"].includes(req.headers.authorization)) res.statusCode = 401;
      res.end(JSON.stringify({ isAdmin: req.headers.authorization === "Bearer admin" }));
      return;
    }
    assert.equal(req.url, "/analyze");
    assert.equal(req.method, "POST");
    assert.equal(req.headers["content-type"], "image/jpeg");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    calls.push(["vision", Buffer.concat(chunks)]);
    res.statusCode = visionStatus;
    res.end(JSON.stringify(visionResult));
  }));

  const url = (await listen(t, createDataServer({
    authUrl: internalUrl,
    visionUrl: internalUrl,
    async putOriginal(bucket, key, jpeg) {
      calls.push(["put", bucket, key, jpeg]);
      if (storageError) throw storageError;
    },
    async deleteOriginal(bucket, key) {
      calls.push(["delete", bucket, key]);
    },
    async insertPhotoMetadata(input) {
      calls.push(["insert", input]);
      if (databaseError) throw databaseError;
      return { ...input, id: ++id };
    },
  }))) + "/api/photos";

  return {
    url,
    calls,
    setVision(status, result) { visionStatus = status; visionResult = result; },
    failStorage(error) { storageError = error; },
    failDatabase(error) { databaseError = error; },
    send(jpeg, authorization = "Bearer admin", contentType = "image/jpeg") {
      return fetch(url, {
        method: "POST",
        headers: { authorization, "content-type": contentType },
        body: jpeg,
      });
    },
  };
}

test("confere o perfil atual antes de processar a foto", async (t) => {
  const api = await setup(t);
  assert.equal((await api.send(JPEG, "")).status, 401);
  assert.equal((await api.send(JPEG, "Bearer invalid")).status, 401);
  assert.equal((await api.send(JPEG, "Bearer client")).status, 403);
  assert.equal((await api.send(JPEG, "Bearer unavailable")).status, 502);
  assert.deepEqual(api.calls.map(([step]) => step), ["auth", "auth", "auth"]);
});

test("recusa tipo incompatível, JPEG inválido, EXIF ausente e datas inválidas", async (t) => {
  const api = await setup(t);
  assert.equal((await api.send(JPEG, undefined, "image/png")).status, 415);
  assert.equal((await api.send(Buffer.from("not a jpeg"))).status, 400);
  const missing = await api.send(JPEG);
  assert.equal(missing.status, 400);
  assert.match((await missing.json()).error, /DateTimeOriginal/);
  assert.equal((await api.send(withCapture("2026:02:30 09:30:00"))).status, 400);
  assert.equal((await api.send(withCapture("2026:11:18 09:30:00", "+99:00"))).status, 400);
  assert.equal((await api.send(withCapture("2018:11:04 00:30:00"))).status, 400);
  assert.equal((await api.send(withCapture("2019:02:16 23:30:00"))).status, 400);
  assert.ok(api.calls.every(([step]) => step === "auth"));
});

test("preserva os bytes e roda uma análise por envio, inclusive em reenvios", async (t) => {
  const api = await setup(t);
  const jpeg = withCapture("2026:11:18 09:30:00");
  const first = await api.send(jpeg);
  const second = await api.send(jpeg);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const firstPhoto = await first.json();
  const secondPhoto = await second.json();
  assert.notEqual(firstPhoto.id, secondPhoto.id);
  assert.notEqual(firstPhoto.originalKey, secondPhoto.originalKey);
  assert.equal(firstPhoto.capturedAt, "2026-11-18T12:30:00.000Z");
  assert.equal(firstPhoto.originalBucket, "fotos");
  assert.match(firstPhoto.originalKey, /^2026-11-18T12:30:00\.000Z-[a-f\d-]+\.jpg$/);
  assert.deepEqual(firstPhoto.yoloResult, []);
  assert.equal(firstPhoto.tesseractResult, null);
  assert.deepEqual(api.calls.map(([step]) => step), [
    "auth", "put", "vision", "insert", "auth", "put", "vision", "insert",
  ]);
  for (const call of api.calls) {
    if (call[0] === "put") assert.deepEqual(call[3], jpeg);
    if (call[0] === "vision") assert.deepEqual(call[1], jpeg);
  }
});

test("respeita OffsetTimeOriginal e grava detecção e OCR", async (t) => {
  const api = await setup(t);
  const analysis = {
    yoloResult: [{ className: "cup", confidence: 0.9, bbox: [0, 0, 4, 4] }],
    tesseractResult: { text: "" },
  };
  api.setVision(200, analysis);
  const response = await api.send(withCapture("2026:11:18 09:30:00", "+02:00"));
  assert.equal(response.status, 201);
  const photo = await response.json();
  assert.equal(photo.capturedAt, "2026-11-18T07:30:00.000Z");
  assert.deepEqual(photo.yoloResult, analysis.yoloResult);
  assert.deepEqual(photo.tesseractResult, analysis.tesseractResult);
});

test("rejeita corpo acima de 10 MiB, inclusive sem Content-Length", async (t) => {
  const api = await setup(t);
  const body = Buffer.alloc(10 * 1024 * 1024 + 1);
  assert.equal((await api.send(body)).status, 413);
  const status = await new Promise((resolve, reject) => {
    const req = request(api.url, {
      method: "POST",
      headers: { authorization: "Bearer admin", "content-type": "image/jpeg" },
    }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
  assert.equal(status, 413);
  assert.ok(api.calls.every(([step]) => step === "auth"));
});

test("não analisa quando o armazenamento expira", async (t) => {
  const api = await setup(t);
  api.failStorage(new DOMException("expired", "TimeoutError"));
  assert.equal((await api.send(withCapture("2026:11:18 09:30:00"))).status, 504);
  assert.deepEqual(api.calls.map(([step]) => step), ["auth", "put"]);
});

test("remove o original em caso de JPEG corrompido ou falha da análise", async (t) => {
  const api = await setup(t);
  const jpeg = withCapture("2026:11:18 09:30:00");
  for (const [visionStatus, result, expected] of [[400, {}, 400], [500, {}, 502], [200, {}, 502]]) {
    api.calls.length = 0;
    api.setVision(visionStatus, result);
    assert.equal((await api.send(jpeg)).status, expected);
    assert.deepEqual(api.calls.map(([step]) => step), ["auth", "put", "vision", "delete"]);
    assert.deepEqual(api.calls[3].slice(1), api.calls[1].slice(1, 3));
  }
});

test("só remove o original após rejeição confirmada pelo PostgreSQL", async (t) => {
  const api = await setup(t);
  const jpeg = withCapture("2026:11:18 09:30:00");
  const rejected = Object.assign(new Error("constraint violation"), { code: "23514" });
  api.failDatabase(new Error("query failed", { cause: rejected }));
  assert.equal((await api.send(jpeg)).status, 502);
  assert.deepEqual(api.calls.map(([step]) => step), ["auth", "put", "vision", "insert", "delete"]);

  api.calls.length = 0;
  api.failDatabase(new Error("connection lost"));
  assert.equal((await api.send(jpeg)).status, 502);
  assert.deepEqual(api.calls.map(([step]) => step), ["auth", "put", "vision", "insert"]);
});
