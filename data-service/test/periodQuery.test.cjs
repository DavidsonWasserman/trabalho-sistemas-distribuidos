const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createServer } = require("node:http");
const { Readable } = require("node:stream");
const { test } = require("node:test");
const { createDataServer } = require("../dist/dataServer");

async function listen(t, server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("consulta como cliente e calcula diferenças com resultados persistidos e campos ausentes", async (t) => {
  const authUrl = await listen(t, createServer((req, res) => {
    assert.equal(req.url, "/api/user/me");
    assert.equal(req.headers.authorization, "Bearer client");
    res.end(JSON.stringify({ isAdmin: false }));
  }));
  const start = "2026-11-17T12:00:00Z";
  const middle = "2026-11-17T12:10:00Z";
  const end = "2026-11-17T12:20:00Z";
  const readings = [
    { timestamp: start, temperature: null, humidity: 60, pressure: null, rssi: -55 },
    { timestamp: middle, temperature: 24, humidity: 57, pressure: null, rssi: null },
  ];
  const photos = [
    { id: 1, capturedAt: new Date(start), yoloResult: [], tesseractResult: null },
    {
      id: 2,
      capturedAt: new Date(middle),
      yoloResult: [{ className: "vase", confidence: 0.8, bbox: [0, 0, 5, 5] }],
      tesseractResult: { text: "" },
    },
  ];

  const url = await listen(t, createDataServer({
    authUrl,
    async listMeasurements(from, to) {
      assert.deepEqual([from, to], [new Date(start), new Date(end)]);
      return [...readings].reverse();
    },
    async listPhotoMetadata(from, to) {
      assert.deepEqual([from, to], [new Date(start), new Date(end)]);
      return photos;
    },
  }));

  const headers = { authorization: "Bearer client" };
  const path = `${url}/api/period?start=${start}&end=${end}`;
  const baseResponse = await fetch(path, { headers });
  assert.equal(baseResponse.status, 200);
  const base = await baseResponse.json();
  assert.deepEqual(base.measurements, readings);
  assert.deepEqual(base.photos, JSON.parse(JSON.stringify(photos)));
  assert.deepEqual(Object.keys(base).sort(), ["measurements", "photos"]);

  const comparison = await fetch(`${path}&includeVariations=true&fromPhotoId=1&toPhotoId=2`, { headers });
  assert.equal(comparison.status, 200);
  const result = await comparison.json();
  assert.deepEqual(result.variations, { temperature: null, humidity: -3, pressure: null, rssi: null });
  assert.deepEqual(result.photoComparison, {
    fromPhotoId: 1,
    toPhotoId: 2,
    detectionChanges: [{ className: "vase", delta: 1 }],
    ocr: { fromText: null, toText: "", changed: null },
  });
});

test("entrega o original ao cliente autenticado pelo ID cadastrado", async (t) => {
  const authUrl = await listen(t, createServer((req, res) => {
    res.writeHead(req.headers.authorization === "Bearer client" ? 200 : 401);
    res.end(JSON.stringify({ isAdmin: false }));
  }));
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const url = await listen(t, createDataServer({
    authUrl,
    async findPhotoOriginal(id) {
      return id === 1 ? { bucket: "fotos", key: "captura.jpg" } : undefined;
    },
    async getOriginal(bucket, key) {
      assert.deepEqual({ bucket, key }, { bucket: "fotos", key: "captura.jpg" });
      return Readable.from([jpeg]);
    },
  }));
  const original = `${url}/api/photos/1/original`;
  const options = { headers: { authorization: "Bearer client" } };
  assert.equal((await fetch(original)).status, 401);
  assert.equal((await fetch(original, { headers: { authorization: "Bearer invalid" } })).status, 401);
  assert.equal((await fetch(`${url}/api/photos/2/original`, options)).status, 404);
  assert.equal((await fetch(original, { ...options, method: "POST" })).status, 405);

  const response = await fetch(original, options);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), jpeg);
});
