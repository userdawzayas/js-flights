export type UserRole = "USER" | "ADMIN";

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: {
    name: string;
    role: UserRole;
  };
}

export const authSessionExpiredEvent = "authsessionexpired";

const authSessionStorageKey = "js-flights-auth-session";

export function getAuthSession(): AuthSession | null {
  const serializedSession = sessionStorage.getItem(authSessionStorageKey);
  if (serializedSession === null) return null;

  let session: unknown;
  try {
    session = JSON.parse(serializedSession);
  } catch {
    sessionStorage.removeItem(authSessionStorageKey);
    return null;
  }

  if (!isAuthSession(session) || session.expiresAt <= Date.now()) {
    sessionStorage.removeItem(authSessionStorageKey);
    return null;
  }

  return session;
}

export function storeAuthSession(session: AuthSession): void {
  if (!isAuthSession(session) || session.expiresAt <= Date.now()) {
    throw new Error("No se puede guardar una sesión no válida o caducada.");
  }
  sessionStorage.setItem(authSessionStorageKey, JSON.stringify(session));
}

export function logout(): void {
  sessionStorage.removeItem(authSessionStorageKey);
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    "expiresAt" in value &&
    typeof value.expiresAt === "number" &&
    Number.isSafeInteger(value.expiresAt) &&
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

