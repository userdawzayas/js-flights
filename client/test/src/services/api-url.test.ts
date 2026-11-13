// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { apiUrl } from "../../../src/services/api-url.ts";

afterEach(() => {
  delete window.jsFlightsConfig;
});

describe("apiUrl", () => {
  it("uses the local backend URL when no deployment config is present", () => {
    expect(apiUrl("auth/login")).toBe("http://localhost:3000/auth/login");
  });

  it("uses the configured backend URL and normalizes its trailing slash", () => {
    window.jsFlightsConfig = { apiBaseUrl: "https://api.example.com/" };

    expect(apiUrl("/cities/San%20Diego")).toBe(
      "https://api.example.com/cities/San%20Diego",
    );
  });
});
