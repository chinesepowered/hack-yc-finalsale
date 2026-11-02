import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ImageBytes = { bytes: Uint8Array; type: "image/jpeg" | "image/png" };

const MAX_BYTES = 9 * 1024 * 1024;
const DEMO_ROOT = path.join(process.cwd(), "public", "demo");

export class BadImage extends Error {}

/** Accepts a data URL from the browser, or a path to one of the bundled demo images. */
export async function loadImage(src: unknown): Promise<ImageBytes> {
  if (typeof src !== "string" || !src) throw new BadImage("Missing image.");
  if (src.startsWith("data:")) {
    const m = /^data:(image\/(?:jpeg|jpg|png));base64,([A-Za-z0-9+/=\s]+)$/.exec(src);
    if (!m) throw new BadImage("Images must be JPEG or PNG.");
    const bytes = new Uint8Array(Buffer.from(m[2], "base64"));
    if (bytes.byteLength > MAX_BYTES) throw new BadImage("Image is over 9 MB.");
    return { bytes, type: m[1] === "image/png" ? "image/png" : "image/jpeg" };
  }
  if (src.startsWith("/demo/")) {
    const resolved = path.resolve(DEMO_ROOT, "." + src.slice("/demo".length));
    if (!resolved.startsWith(DEMO_ROOT + path.sep)) throw new BadImage("Bad demo path.");
    const bytes = new Uint8Array(await readFile(resolved).catch(() => Promise.reject(new BadImage("Demo image not found."))));
    return { bytes, type: resolved.endsWith(".png") ? "image/png" : "image/jpeg" };
  }
  throw new BadImage("Unsupported image source.");
}

export function toDataUrl(bytes: Uint8Array, type: string): string {
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}
