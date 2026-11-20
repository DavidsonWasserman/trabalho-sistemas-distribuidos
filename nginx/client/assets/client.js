const loginView = document.querySelector("#login-view");
const queryView = document.querySelector("#query-view");
const loginForm = document.querySelector("#login-form");
const periodForm = document.querySelector("#period-form");
const loginStatus = document.querySelector("#login-status");
const queryStatus = document.querySelector("#query-status");
const logout = document.querySelector("#logout");
const results = document.querySelector("#results");
const readings = document.querySelector("#measurements");
const photos = document.querySelector("#photos");
const photoTemplate = document.querySelector("#photo-card");

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

let token;
let currentQuery;
let photoObserver;
const photoUrls = new Set();

function message(element, text, error = false) {
  element.toggleAttribute("data-error", error);
  element.textContent = text;
}

function clearResults() {
  currentQuery?.abort();
  photoObserver?.disconnect();
  for (const url of photoUrls) URL.revokeObjectURL(url);
  photoUrls.clear();
  results.hidden = true;
  readings.replaceChildren();
  photos.replaceChildren();
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
    photoUrls.add(url);
    image.src = url;
    await image.decode();
    image.hidden = false;
    status.hidden = true;
  } catch {
    if (!signal.aborted) status.textContent = "O original da foto está indisponível.";
  }
}

function renderResults({ measurements, photos: photoRecords }, signal) {
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
  document.querySelector("#photos-empty").hidden = photoRecords.length > 0;

  photoObserver = new IntersectionObserver((entries, observer) => {
    if (signal.aborted) return;
    for (const { isIntersecting, target } of entries) {
      if (isIntersecting) {
        observer.unobserve(target);
        void loadPhoto(target, target.dataset.id, signal);
      }
    }
  });

  const cards = document.createDocumentFragment();
  for (const { id, capturedAt, yoloResult, tesseractResult } of photoRecords) {
    const card = photoTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.id = id;
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
    cards.appendChild(card);
    photoObserver.observe(card);
  }
  photos.replaceChildren(cards);
  results.hidden = measurements.length === 0 && photoRecords.length === 0;
  message(queryStatus, results.hidden ? "Nenhuma leitura ou foto encontrada neste período." : "");
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
    const response = await authenticatedFetch(`/api/period?${params}`, signal);
    if (signal.aborted) return;
    if (response.status === 401) {
      endSession("Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!signal.aborted) renderResults(data, signal);
  } catch {
    if (!signal.aborted) message(queryStatus, "Não foi possível consultar o período. Tente novamente.", true);
  }
});
