import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = fileURLToPath(new URL("../", import.meta.url));
const distDirectory = path.join(clientRoot, "dist");
const configuredApiBaseUrl = process.env.API_BASE_URL?.trim();

if (process.env.NODE_ENV === "production" && !configuredApiBaseUrl) {
  throw new Error("Configura API_BASE_URL con la URL pública del backend.");
}

const apiBaseUrl = configuredApiBaseUrl || "http://localhost:3000";
let parsedApiBaseUrl;
try {
  parsedApiBaseUrl = new URL(apiBaseUrl);
} catch {
  throw new Error("API_BASE_URL debe ser una URL HTTP o HTTPS válida.");
}

if (
  !["http:", "https:"].includes(parsedApiBaseUrl.protocol) ||
  parsedApiBaseUrl.username ||
  parsedApiBaseUrl.password ||
  parsedApiBaseUrl.search ||
  parsedApiBaseUrl.hash
) {
  throw new Error("API_BASE_URL debe ser una URL HTTP o HTTPS válida.");
}

await rm(distDirectory, { recursive: true, force: true });

execFileSync(
  process.execPath,
  [
    path.join(clientRoot, "node_modules/typescript/bin/tsc"),
    "-p",
    path.join(clientRoot, "tsconfig.json"),
  ],
  { cwd: clientRoot, stdio: "inherit" },
);

const sourceHtml = await readFile(path.join(clientRoot, "index.html"), "utf8");
const builtHtml = sourceHtml.replace(
  'src="./dist/index.js"',
  'src="./index.js"',
);
if (builtHtml === sourceHtml) {
  throw new Error("No se encontró la entrada compilada en index.html.");
}

await mkdir(distDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(distDirectory, "index.html"), builtHtml),
  cp(
    path.join(clientRoot, "style.css"),
    path.join(distDirectory, "style.css"),
  ),
  writeFile(
    path.join(distDirectory, "config.js"),
    `window.jsFlightsConfig = ${JSON.stringify({
      apiBaseUrl: parsedApiBaseUrl.href.replace(/\/+$/, ""),
    })};\n`,
  ),
]);
