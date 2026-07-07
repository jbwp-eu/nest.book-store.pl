import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Reads ADMIN_PASSWORD from ../backend/.env (same value as seed / backend e2e). */
export function readAdminPasswordFromBackendEnv(
  configDir: string,
): string | undefined {
  const envPath = resolve(configDir, "../backend/.env");
  if (!existsSync(envPath)) return undefined;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    if (key !== "ADMIN_PASSWORD") continue;

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return undefined;
}
