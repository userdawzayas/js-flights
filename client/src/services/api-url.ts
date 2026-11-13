const localApiBaseUrl = "http://localhost:3000";

declare global {
  interface Window {
    jsFlightsConfig?: {
      apiBaseUrl: string;
    };
  }
}

export function apiUrl(path: string): string {
  const configuredBaseUrl =
    window.jsFlightsConfig?.apiBaseUrl || localApiBaseUrl;
  const baseUrl = `${configuredBaseUrl.replace(/\/+$/, "")}/`;
  return new URL(path.replace(/^\/+/, ""), baseUrl).toString();
}
