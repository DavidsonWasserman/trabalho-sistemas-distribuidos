import { metrics, renderCharts } from "./charts.js";

const loginView = document.querySelector("#login-view");
const queryView = document.querySelector("#query-view");
const loginForm = document.querySelector("#login-form");
const periodForm = document.querySelector("#period-form");
const loginStatus = document.querySelector("#login-status");
const queryStatus = document.querySelector("#query-status");
const logout = document.querySelector("#logout");
const results = document.querySelector("#results");
const readings = document.querySelector("#measurements");
const charts = document.querySelector("#measurement-charts");
const variationsList = document.querySelector("#variations");
const alertsList = document.querySelector("#period-alerts");
const alertsEmpty = document.querySelector("#period-alerts-empty");
const photoControls = document.querySelector("#photo-controls");
const fromPhoto = document.querySelector("#from-photo");
const toPhoto = document.querySelector("#to-photo");
const toPhotoField = document.querySelector("#to-photo-field");
const fromDetail = document.querySelector("#from-photo-detail");
const toDetail = document.querySelector("#to-photo-detail");
const comparisonStatus = document.querySelector("#comparison-status");
const comparison = document.querySelector("#photo-comparison");
const photoTemplate = document.querySelector("#photo-card");

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });
const deltaFormat = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 10, signDisplay: "exceptZero" });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

const alertLimits = {
  temperature: { lower: 22, upper: 24 },
  humidity: { lower: 66, upper: 70 },
  pressure: { lower: 101270, upper: 101300 },
};

let token;
let currentQuery;

function message(element, text, error = false) {
  element.toggleAttribute("data-error", error);
  element.textContent = text;
}

function clearResults() {
  currentQuery?.abort();
  results.hidden = true;
  charts.replaceChildren();
  readings.replaceChildren();
  variationsList.replaceChildren();
  alertsList.replaceChildren();
  alertsEmpty.textContent = "";
  for (const detail of [fromDetail, toDetail]) {
    detail.replaceChildren();
    detail.hidden = true;
  }
  comparison.hidden = true;
  comparison.replaceChildren();
  message(comparisonStatus, "");
}

function endSession(reason = "") {
  token = undefined;
  clearResults();
  periodForm.reset();
  message(queryStatus, "");
  message(loginStatus, reason);
  queryView.hidden = true;
  logout.hidden = true;
  loginView.hidden = false;
  loginForm.elements.email.focus();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  message(loginStatus, "Entrando…");

  try {
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm))),
    });
    if (response.status === 400 || response.status === 401) {
      message(loginStatus, "E-mail ou senha inválidos.", true);
      return;
    }
    if (response.status === 429) {
      message(loginStatus, "Muitas tentativas. Aguarde antes de tentar novamente.", true);
      return;
    }
    if (!response.ok) throw new Error();

    const session = await response.json();
    if (typeof session.token !== "string" || !session.token) throw new Error();
    token = session.token;
    loginForm.reset();
    message(loginStatus, "");
    loginView.hidden = true;
    logout.hidden = false;
    queryView.hidden = false;
    periodForm.elements.start.focus();
  } catch {
    message(loginStatus, "Não foi possível entrar. Tente novamente.", true);
  } finally {
    button.disabled = false;
  }
});

logout.addEventListener("click", () => endSession());

function authenticatedFetch(path, signal) {
  return fetch(path, { headers: { Authorization: `Bearer ${token}` }, signal });
}

async function loadPhoto(card, id, signal) {
  const image = card.querySelector("img");
  const status = card.querySelector(".photo-status");
  try {
    const response = await authenticatedFetch(`/api/photos/${id}/original`, signal);
    if (signal.aborted) return;
    if (response.status === 401) {
      endSession("Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok) throw new Error();

    const blob = await response.blob();
    if (signal.aborted) return;
    const url = URL.createObjectURL(blob);
    signal.addEventListener("abort", () => URL.revokeObjectURL(url), { once: true });
    image.src = url;
    await image.decode();
    if (signal.aborted) return;
    image.hidden = false;
    status.hidden = true;
  } catch {
    if (!signal.aborted) status.textContent = "O original da foto está indisponível.";
  }
}

function renderVariations(variations) {
  for (const { field, label, unit } of metrics) {
    const value = variations[field];
    const item = variationsList.appendChild(document.createElement("div"));
    item.appendChild(document.createElement("dt")).textContent = label;
    const suffix = unit === "%" ? " p.p." : unit ? ` ${unit}` : "";
    item.appendChild(document.createElement("dd")).textContent = value === null
      ? "Leituras insuficientes"
      : `${deltaFormat.format(value)}${suffix}`;
  }
}

function renderAlerts(measurements) {
  const items = document.createDocumentFragment();
  let hasValues = false;

  for (const { field, label, unit } of metrics) {
    const limits = alertLimits[field];
    if (!limits) continue;

    const low = { count: 0, extreme: null };
    const high = { count: 0, extreme: null };
    for (const reading of measurements) {
      const value = reading[field];
      if (!Number.isFinite(value)) continue;
      hasValues = true;

      if (value <= limits.lower) {
        low.count++;
        if (!low.extreme || value < low.extreme[field]) low.extreme = reading;
      }
      if (value >= limits.upper) {
        high.count++;
        if (!high.extreme || value > high.extreme[field]) high.extreme = reading;
      }
    }

    for (const { direction, operator, limit, extremeLabel, result } of [
      { direction: "baixa", operator: "≤", limit: limits.lower, extremeLabel: "Menor valor", result: low },
      { direction: "alta", operator: "≥", limit: limits.upper, extremeLabel: "Maior valor", result: high },
    ]) {
      const { count, extreme } = result;
      if (!extreme) continue;

      const item = items.appendChild(document.createElement("li"));
      item.appendChild(document.createElement("strong")).textContent = `${label} ${direction}`;
      const details = item.appendChild(document.createElement("p"));
      const readingsLabel = count === 1 ? "leitura" : "leituras";
      const suffix = unit === "%" ? unit : ` ${unit}`;
      details.textContent = `Limite ${operator} ${numberFormat.format(limit)}${suffix} · ${count} ${readingsLabel}`
        + ` · ${extremeLabel} ${numberFormat.format(extreme[field])}${suffix} em `;
      const time = details.appendChild(document.createElement("time"));
      time.dateTime = extreme.timestamp;
      time.textContent = `${dateFormat.format(new Date(extreme.timestamp))} UTC`;
    }
  }

  const hasAlerts = items.childElementCount > 0;
  alertsList.replaceChildren(items);
  alertsList.hidden = !hasAlerts;
  alertsEmpty.hidden = hasAlerts;
  alertsEmpty.textContent = hasValues ? "Nenhum alerta neste período." : "Sem valores de temperatura, umidade ou pressão neste período.";
}

function photoCard({ id, capturedAt, yoloResult, tesseractResult }) {
  const card = photoTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector("h3").textContent = `Foto ${id}`;
  card.querySelector("img").alt = `Foto ${id} da horta`;
  const time = card.querySelector("time");
  time.dateTime = capturedAt;
  time.textContent = `${dateFormat.format(new Date(capturedAt))} UTC`;

  const objects = card.querySelector(".objects");
  if (Array.isArray(yoloResult) && yoloResult.length) {
    const list = objects.appendChild(document.createElement("ul"));
    for (const { className, confidence } of yoloResult) {
      const item = list.appendChild(document.createElement("li"));
      item.textContent = `${className} (${percentFormat.format(confidence)} de confiança)`;
    }
  } else {
    objects.textContent = "Nenhum objeto identificado.";
  }

  card.querySelector(".ocr").textContent = tesseractResult?.text?.trim()
    || (tesseractResult === null ? "OCR não executado." : "Nenhum texto reconhecido.");
  return card;
}

function renderComparison({ fromPhotoId, toPhotoId, detectionChanges, ocr }) {
  const heading = document.createElement("h3");
  heading.textContent = `Diferenças da foto ${fromPhotoId} para a foto ${toPhotoId}`;
  const description = document.createElement("p");
  description.textContent = detectionChanges.length
    ? "Variação na contagem de objetos detectados por classe"
    : "As contagens de objetos detectados são iguais.";
  comparison.replaceChildren(heading, description);
  if (detectionChanges.length) {
    const list = comparison.appendChild(document.createElement("ul"));
    for (const { className, delta } of detectionChanges) {
      list.appendChild(document.createElement("li")).textContent = `${className} · ${deltaFormat.format(delta)}`;
    }
  }
  comparison.appendChild(document.createElement("p")).textContent = ocr.changed === null
    ? "OCR indisponível para pelo menos uma das fotos."
    : ocr.changed ? "O texto reconhecido mudou." : "O texto reconhecido é igual.";
  comparison.hidden = false;
}

function renderPhotos(records, period, signal) {
  document.querySelector("#photos-empty").hidden = records.length > 0;
  photoControls.hidden = records.length === 0;
  if (!records.length) return;

  const photosById = new Map(records.map((record) => [String(record.id), record]));
  function photoOption(photo) {
    return new Option(`Foto ${photo.id} · ${dateFormat.format(new Date(photo.capturedAt))} UTC`, photo.id);
  }

  const slots = [{ container: fromDetail }, { container: toDetail }];
  let comparisonRequest;
  signal.addEventListener("abort", () => {
    fromPhoto.onchange = null;
    toPhoto.onchange = null;
    fromPhoto.replaceChildren();
    toPhoto.replaceChildren();
    comparisonRequest?.abort();
    for (const slot of slots) slot.request?.abort();
  }, { once: true });

  function showPhoto(slot, id) {
    if (slot.id === id) return;
    slot.id = id;
    slot.request?.abort();
    slot.container.replaceChildren();
    slot.container.hidden = !id;
    if (!id) return;

    slot.request = new AbortController();
    const photo = photosById.get(id);
    const card = photoCard(photo);
    slot.container.appendChild(card);
    void loadPhoto(card, photo.id, slot.request.signal);
  }

  async function updateComparison() {
    comparisonRequest?.abort();
    comparison.hidden = true;
    comparison.replaceChildren();
    showPhoto(slots[1], toPhoto.value);
    message(comparisonStatus, "");
    if (!toPhoto.value) return;

    comparisonRequest = new AbortController();
    const requestSignal = comparisonRequest.signal;
    const params = new URLSearchParams(period);
    params.set("fromPhotoId", fromPhoto.value);
    params.set("toPhotoId", toPhoto.value);
    message(comparisonStatus, "Comparando…");
    try {
      const response = await authenticatedFetch(`/api/period?${params}`, requestSignal);
      if (requestSignal.aborted) return;
      if (response.status === 401) {
        endSession("Sua sessão expirou. Entre novamente.");
        return;
      }
      if (!response.ok) throw new Error();
      const { photoComparison } = await response.json();
      if (requestSignal.aborted) return;
      renderComparison(photoComparison);
      message(comparisonStatus, "Comparação atualizada.");
    } catch {
      if (!requestSignal.aborted) message(comparisonStatus, "Não foi possível comparar as fotos.", true);
    }
  }

  function updateReference() {
    const selected = toPhoto.value;
    toPhoto.replaceChildren(new Option("Selecione uma segunda foto", ""));
    for (const photo of records) {
      if (String(photo.id) !== fromPhoto.value) toPhoto.appendChild(photoOption(photo));
    }
    toPhoto.value = selected !== fromPhoto.value && photosById.has(selected) ? selected : "";
    showPhoto(slots[0], fromPhoto.value);
    void updateComparison();
  }

  const options = document.createDocumentFragment();
  for (const photo of records) options.appendChild(photoOption(photo));
  fromPhoto.replaceChildren(options);
  toPhotoField.hidden = records.length < 2;
  fromPhoto.onchange = updateReference;
  toPhoto.onchange = updateComparison;
  updateReference();
}

function renderResults({ measurements, photos, variations }, period, start, end, signal) {
  renderAlerts(measurements);
  renderVariations(variations);
  renderCharts(charts, measurements, start, end);
  const rows = document.createDocumentFragment();
  for (const { timestamp, temperature, humidity, pressure, rssi } of measurements) {
    const row = rows.appendChild(document.createElement("tr"));
    row.insertCell().textContent = dateFormat.format(new Date(timestamp));
    for (const value of [temperature, humidity, pressure, rssi]) {
      row.insertCell().textContent = value === null ? "—" : numberFormat.format(value);
    }
  }
  readings.replaceChildren(rows);
  document.querySelector("#measurements-table").hidden = measurements.length === 0;
  document.querySelector("#measurements-empty").hidden = measurements.length > 0;
  renderPhotos(photos, period, signal);
  results.hidden = false;
  message(queryStatus, "");
}

periodForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResults();

  const start = new Date(`${periodForm.elements.start.value}Z`);
  const end = new Date(`${periodForm.elements.end.value}Z`);
  if (!(start < end)) {
    message(queryStatus, "Informe um início anterior ao fim.", true);
    return;
  }

  currentQuery = new AbortController();
  const { signal } = currentQuery;
  const params = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
  message(queryStatus, "Consultando…");

  try {
    const query = new URLSearchParams(params);
    query.set("includeVariations", "true");
    const response = await authenticatedFetch(`/api/period?${query}`, signal);
    if (signal.aborted) return;
    if (response.status === 401) {
      endSession("Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!signal.aborted) renderResults(data, params, start, end, signal);
  } catch {
    if (!signal.aborted) message(queryStatus, "Não foi possível consultar o período. Tente novamente.", true);
  }
});
