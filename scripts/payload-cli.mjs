import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localEnvironmentFile = path.join(projectRoot, ".env.local");

if (existsSync(localEnvironmentFile)) {
  process.loadEnvFile(localEnvironmentFile);
}

const [command] = process.argv.slice(2);
const isMigrationCommand = command?.startsWith("migrate");

if (isMigrationCommand) {
  if (!process.env.DATABASE_URL_MIGRATIONS) {
    throw new Error("Define DATABASE_URL_MIGRATIONS en .env.local antes de ejecutar migraciones.");
  }

  process.env.DATABASE_URL = process.env.DATABASE_URL_MIGRATIONS;
} else if (!process.env.DATABASE_URL) {
  throw new Error("Define DATABASE_URL en .env.local antes de ejecutar Payload.");
}

const payloadBinary = path.join(projectRoot, "node_modules", "payload", "bin.js");
const result = spawnSync(process.execPath, [payloadBinary, ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
