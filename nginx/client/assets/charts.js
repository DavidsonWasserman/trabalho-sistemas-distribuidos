export const metrics = [
  { field: "temperature", label: "Temperatura", unit: "°C" },
  { field: "humidity", label: "Umidade", unit: "%" },
  { field: "pressure", label: "Pressão", unit: "Pa" },
  { field: "rssi", label: "RSSI", unit: "" },
];

const axisNumber = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 10 });
const axisTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "UTC",
});

function drawSeries(canvas, readings, field, start, end) {
  const context = canvas.getContext("2d");
  if (!context) return;

  let min = Infinity;
  let max = -Infinity;
  for (const reading of readings) {
    const value = reading[field];
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const scale = 2;
  context.scale(scale, scale);
  const width = canvas.width / scale;
  const height = canvas.height / scale;
  const top = 12;
  const bottom = height - 30;
  const right = width - 10;
  const ticks = min === max ? [min] : [max, min];
  context.font = "12px system-ui";
  const left = Math.max(...ticks.map((tick) => context.measureText(axisNumber.format(tick)).width)) + 12;
  const x = (time) => left + (time - start) / (end - start) * (right - left);
  const y = (value) => min === max ? (top + bottom) / 2 : bottom - (value - min) / (max - min) * (bottom - top);

  context.fillStyle = "#4c6256";
  context.strokeStyle = "#d5e0d4";
  context.textBaseline = "middle";
  for (const tick of ticks) {
    const position = y(tick);
    context.fillText(axisNumber.format(tick), 0, position);
    context.beginPath();
    context.moveTo(left, position);
    context.lineTo(right, position);
    context.stroke();
  }
  context.fillText(axisTime.format(start), left, bottom + 16);
  context.textAlign = "right";
  context.fillText(axisTime.format(end), right, bottom + 16);

  context.strokeStyle = "#246447";
  context.fillStyle = "#246447";
  context.lineWidth = 2;
  context.beginPath();
  let connected = false;
  for (const reading of readings) {
    const value = reading[field];
    if (Number.isFinite(value)) {
      const horizontal = x(reading.time);
      const vertical = y(value);
      if (connected) context.lineTo(horizontal, vertical);
      else context.moveTo(horizontal, vertical);
      context.fillRect(horizontal - 2, vertical - 2, 4, 4);
    }
    connected = Number.isFinite(value);
  }
  context.stroke();
}

export function renderCharts(container, measurements, start, end) {
  if (!measurements.length) return;
  const readings = measurements.map((reading) => ({ ...reading, time: Date.parse(reading.timestamp) }));
  for (const { field, label, unit } of metrics) {
    const chart = container.appendChild(document.createElement("figure"));
    chart.className = "panel";
    chart.appendChild(document.createElement("figcaption")).textContent = unit ? `${label} (${unit})` : label;
    if (!readings.some((reading) => Number.isFinite(reading[field]))) {
      chart.appendChild(document.createElement("p")).textContent = "Sem leituras.";
      continue;
    }
    const canvas = chart.appendChild(document.createElement("canvas"));
    canvas.width = 880;
    canvas.height = 296;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Série de ${label} em UTC. Os valores estão na tabela de leituras.`);
    drawSeries(canvas, readings, field, start.getTime(), end.getTime());
  }
}
