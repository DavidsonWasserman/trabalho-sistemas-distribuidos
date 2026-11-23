import { InfluxDB, flux, fluxDateTime } from "@influxdata/influxdb-client";

export interface Measurement {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  rssi: number | null;
}

export class InfluxConfigurationError extends Error {}

function requiredEnv(name: "INFLUX_HOST" | "INFLUX_ORG" | "INFLUX_TOKEN"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new InfluxConfigurationError(`Defina ${name} no .env.`);
  }
  return value;
}

function numberOrNull(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("O InfluxDB retornou uma medição não numérica.");
  }
  return value;
}

export async function listMeasurements(start: Date, end: Date): Promise<Measurement[]> {
  const startTime = start.getTime();
  const endTime = end.getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime >= endTime) {
    throw new RangeError("Informe datas válidas com início anterior ao fim.");
  }

  const queryApi = new InfluxDB({
    url: requiredEnv("INFLUX_HOST"),
    token: requiredEnv("INFLUX_TOKEN"),
  }).getQueryApi(requiredEnv("INFLUX_ORG"));

  const startLiteral = fluxDateTime(start.toISOString());
  const endLiteral = fluxDateTime(end.toISOString());
  const query = flux`
    from(bucket: "horticultura")
      |> range(start: ${startLiteral}, stop: ${endLiteral})
      |> filter(fn: (r) => r._measurement == "measurements")
      |> filter(fn: (r) =>
        r._field == "temperature" or r._field == "humidity" or
        r._field == "pressure" or r._field == "rssi"
      )
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  return queryApi.collectRows(query, (values, tableMeta) => {
    const row = tableMeta.toObject(values);
    if (typeof row._time !== "string") {
      throw new Error("O InfluxDB retornou uma leitura sem horário.");
    }
    return {
      timestamp: row._time,
      temperature: numberOrNull(row.temperature),
      humidity: numberOrNull(row.humidity),
      pressure: numberOrNull(row.pressure),
      rssi: numberOrNull(row.rssi),
    };
  });
}
