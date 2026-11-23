import { HttpError } from "@influxdata/influxdb-client";
import { InfluxConfigurationError, listMeasurements } from "./measurements";

import { parseUtcDate } from "./utcDate";

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
