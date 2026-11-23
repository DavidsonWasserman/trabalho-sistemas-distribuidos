import { dependencyError, HttpError } from "./httpError";

export async function getAuthenticatedProfile(authorization: string | undefined, authUrl: string) {
  if (!authorization || !/^Bearer \S+$/.test(authorization)) {
    throw new HttpError(401, "Informe um token Bearer válido.");
  }

  let profile: unknown;
  try {
    const response = await fetch(new URL("/api/user/me", authUrl), {
      headers: { authorization },
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401) {
        throw new HttpError(401, "Token inválido ou expirado.");
      }
      throw new Error("Falha do autenticador.");
    }
    profile = await response.json();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw dependencyError("o autenticador", error);
  }

  if (typeof profile !== "object" || profile === null || !("isAdmin" in profile) || typeof profile.isAdmin !== "boolean") {
    throw dependencyError("o autenticador", undefined);
  }
  return { isAdmin: profile.isAdmin };
}
