import {
  authSessionExpiredEvent,
  getAuthSession,
  logout,
  storeAuthSession,
  type AuthSession,
} from "../auth.js";

const authApi = "http://localhost:3000/auth/login";

export async function login(name: string, password: string): Promise<AuthSession> {
  const response = await fetch(authApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), password }),
  });

  if (!response.ok) {
    const result: unknown = await response.json();
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "No se pudo iniciar sesión.";
    throw new Error(message);
  }

  const result: unknown = await response.json();
  if (!isLoginResponse(result)) {
    throw new Error("La respuesta del servidor no contiene una sesión válida.");
  }

  const expiresAt = Date.now() + result.expiresIn * 1000;
  if (!Number.isSafeInteger(expiresAt)) {
    throw new Error("La respuesta del servidor no contiene una sesión válida.");
  }

  const session: AuthSession = {
    accessToken: result.accessToken,
    expiresAt,
    user: result.user,
  };
  storeAuthSession(session);
  return session;
}

export async function fetchWithAuth(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const session = getAuthSession();
  let response: Response;

  if (session) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    response = await fetch(url, { ...init, headers });
  } else {
    response = await fetch(url, init);
  }

  if (response.status === 401) {
    logout();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(authSessionExpiredEvent));
    }
  }

  return response;
}

function isLoginResponse(
  value: unknown,
): value is {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthSession["user"];
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    "tokenType" in value &&
    value.tokenType === "Bearer" &&
    "expiresIn" in value &&
    typeof value.expiresIn === "number" &&
    Number.isSafeInteger(value.expiresIn) &&
    value.expiresIn > 0 &&
    "user" in value &&
    isAuthUser(value.user)
  );
}

function isAuthUser(
  value: unknown,
): value is AuthSession["user"] {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    "role" in value &&
    (value.role === "USER" || value.role === "ADMIN")
  );
}
