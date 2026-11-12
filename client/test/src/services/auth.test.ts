// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authSessionExpiredEvent,
  getAuthSession,
  logout,
} from "../../../src/auth.ts";
import { fetchWithAuth, login } from "../../../src/services/auth.ts";

const fetchMock = vi.fn();

describe("client authentication", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("stores the server's bearer token, role, and expiration", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "signed-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: { name: "admin", role: "ADMIN" },
        }),
        { status: 200 },
      ),
    );
    const now = Date.now();

    await expect(login(" admin ", "secret")).resolves.toMatchObject({
      accessToken: "signed-token",
      user: { name: "admin", role: "ADMIN" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "admin", password: "secret" }),
      },
    );
    expect(getAuthSession()?.expiresAt).toBeGreaterThanOrEqual(
      now + 60 * 60 * 1000,
    );
    expect(getAuthSession()?.expiresAt).toBeLessThanOrEqual(
      Date.now() + 60 * 60 * 1000,
    );
  });

  it("surfaces rejected credentials without creating a session", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Credenciales incorrectas." }), {
        status: 401,
      }),
    );

    await expect(login("admin", "wrong")).rejects.toThrow(
      "Credenciales incorrectas.",
    );
    expect(getAuthSession()).toBeNull();
  });

  it("clears expired and malformed stored sessions", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "signed-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: { name: "admin", role: "ADMIN" },
        }),
        { status: 200 },
      ),
    );
    await login("admin", "secret");
    const session = getAuthSession();
    expect(session).not.toBeNull();
    sessionStorage.setItem(
      "js-flights-auth-session",
      JSON.stringify({ ...session, expiresAt: Date.now() - 1 }),
    );
    expect(getAuthSession()).toBeNull();

    sessionStorage.setItem("js-flights-auth-session", "{");
    expect(getAuthSession()).toBeNull();
  });

  it("clears the session on logout", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "signed-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: { name: "admin", role: "ADMIN" },
        }),
        { status: 200 },
      ),
    );
    await login("admin", "secret");

    logout();

    expect(getAuthSession()).toBeNull();
  });

  it("clears a session rejected by a protected endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: "signed-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: { name: "admin", role: "ADMIN" },
        }),
        { status: 200 },
      ),
    );
    await login("admin", "secret");
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const expiredHandler = vi.fn();
    window.addEventListener(authSessionExpiredEvent, expiredHandler);

    await fetchWithAuth("http://localhost:3000/cities", {
      method: "POST",
    });

    expect(getAuthSession()).toBeNull();
    expect(expiredHandler).toHaveBeenCalledOnce();
    window.removeEventListener(authSessionExpiredEvent, expiredHandler);
  });
});
