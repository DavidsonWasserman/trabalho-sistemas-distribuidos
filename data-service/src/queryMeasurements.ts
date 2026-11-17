import { HttpError } from "@influxdata/influxdb-client";
import { InfluxConfigurationError, listMeasurements } from "./measurements";

function parseUtcDate(value: string): Date {
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!parts) {
    throw new RangeError("Use horários ISO 8601 em UTC, por exemplo 2026-11-17T12:00:00Z.");
  }

  const canonical = `${parts[1]}.${(parts[2] ?? "").padEnd(3, "0")}Z`;
  const date = new Date(canonical);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonical) {
    throw new RangeError("Informe datas válidas.");
  }
  return date;
}

async function main(args: string[]): Promise<void> {
  if (args.length !== 2) {
    throw new RangeError("Informe o início e o fim do período em UTC.");
  }

  const measurements = await listMeasurements(parseUtcDate(args[0]), parseUtcDate(args[1]));
  console.log(JSON.stringify(measurements, null, 2));
}

main(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof RangeError || error instanceof InfluxConfigurationError) {
    console.error(error.message);
  } else if (error instanceof HttpError) {
    console.error(`Falha ao consultar o InfluxDB (HTTP ${error.statusCode}).`);
  } else {
    console.error("Falha ao consultar as leituras do InfluxDB.");
  }
  process.exitCode = 1;
});
