import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let cacheDir: string | null = null;

async function dir(): Promise<string> {
  if (cacheDir) return cacheDir;
  const preferred = process.env.FINAL_SALE_CACHE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".cache");
  try {
    await mkdir(preferred, { recursive: true });
    cacheDir = preferred;
  } catch {
    const fallback = path.join(/*turbopackIgnore: true*/ os.tmpdir(), "final-sale-cache");
    await mkdir(fallback, { recursive: true });
    cacheDir = fallback;
  }
  return cacheDir;
}

export function hashKey(...parts: (string | Uint8Array)[]): string {
  const h = createHash("sha256");
  for (const p of parts) {
    h.update(typeof p === "string" ? p : Buffer.from(p));
    h.update("\u0000");
  }
  return h.digest("hex").slice(0, 40);
}

export async function cacheGet<T>(bucket: string, key: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(/*turbopackIgnore: true*/ await dir(), bucket, `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(bucket: string, key: string, value: unknown): Promise<void> {
  const d = path.join(/*turbopackIgnore: true*/ await dir(), bucket);
  await mkdir(d, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ d, `${key}.json`), JSON.stringify(value));
}

// ---- YouCam unit ledger: a hard cap so a live deploy cannot drain shared units. ----

type Ledger = { spent: number; calls: number; updated: string };

const DEFAULT_BUDGET = 40;

export function unitBudget(): number {
  const n = Number(process.env.YOUCAM_UNIT_BUDGET);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BUDGET;
}

export async function readLedger(): Promise<Ledger> {
  try {
    return JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ await dir(), "units.json"), "utf8")) as Ledger;
  } catch {
    return { spent: 0, calls: 0, updated: new Date(0).toISOString() };
  }
}

export async function addUnits(units: number): Promise<Ledger> {
  const l = await readLedger();
  const next = { spent: l.spent + units, calls: l.calls + 1, updated: new Date().toISOString() };
  await writeFile(path.join(/*turbopackIgnore: true*/ await dir(), "units.json"), JSON.stringify(next));
  return next;
}

// One live YouCam job at a time per server, so a double click can't fire two paid tasks.
let chain: Promise<unknown> = Promise.resolve();
export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
