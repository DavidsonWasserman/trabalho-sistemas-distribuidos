import { Temporal } from "@js-temporal/polyfill";
import { parse } from "exifr";

export class InvalidPhotoError extends Error {}

export async function readCapturedAt(jpeg: Buffer): Promise<Date> {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8 || jpeg[2] !== 0xff) {
    throw new InvalidPhotoError("O corpo da requisição deve conter um JPEG válido.");
  }

  let exif: { DateTimeOriginal?: unknown; OffsetTimeOriginal?: unknown } | undefined;
  try {
    const options = {
      pick: ["DateTimeOriginal", "OffsetTimeOriginal"],
      reviveValues: false,
      silentErrors: false,
    };
    exif = await parse(jpeg, options);
  } catch {
    throw new InvalidPhotoError("O JPEG contém metadados EXIF inválidos.");
  }

  const capturedAt = exif?.DateTimeOriginal;
  if (capturedAt === undefined) {
    throw new InvalidPhotoError("O JPEG deve conter a data de captura no campo EXIF DateTimeOriginal.");
  }

  const parts = typeof capturedAt === "string"
    ? /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(capturedAt)
    : null;
  const offset = exif?.OffsetTimeOriginal;
  if (!parts || (offset !== undefined && (typeof offset !== "string" || !/^[+-]\d{2}:\d{2}$/.test(offset)))) {
    throw new InvalidPhotoError("A data de captura ou o offset no EXIF é inválido.");
  }

  const [, year, month, day, hour, minute, second] = parts;
  try {
    if (year === "0000") {
      throw new RangeError();
    }
    const capture = Temporal.ZonedDateTime.from({
      timeZone: offset ?? "America/Sao_Paulo",
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
    }, { overflow: "reject", disambiguation: "reject" });
    return new Date(capture.epochMilliseconds);
  } catch {
    throw new InvalidPhotoError("A data de captura no EXIF é inválida, ambígua ou inexistente no fuso informado.");
  }
}
