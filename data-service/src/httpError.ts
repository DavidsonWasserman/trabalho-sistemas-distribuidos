export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function dependencyError(service: string, error: unknown): HttpError {
  const timedOut = error instanceof Error && error.name === "TimeoutError";
  return timedOut
    ? new HttpError(504, `Tempo limite excedido ao acessar ${service}.`)
    : new HttpError(502, `Falha ao acessar ${service}.`);
}
