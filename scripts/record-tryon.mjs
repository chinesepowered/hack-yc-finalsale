#!/usr/bin/env node
// Records ONE try-on (or one two-garment outfit) through the app's own /api/tryon route and saves it as a
// replay fixture. One invocation = one paid YouCam call (two for an outfit). Never call this in a loop.
//
//   pnpm dev   (with keys in .env.local)
//   node scripts/record-tryon.mjs --shopper maya --listing denim-jacket [--closet black-dress]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { SAMPLE_CLOSET, SAMPLE_LISTINGS, SAMPLE_SHOPPERS } from "../src/data/demo.ts";
import { tryOnRouteFor } from "../src/lib/routing.ts";

const { values } = parseArgs({
  options: {
    shopper: { type: "string" },
    listing: { type: "string" },
    closet: { type: "string" },
    server: { type: "string", default: "http://localhost:3000" },
  },
});

const shopper = SAMPLE_SHOPPERS.find((s) => s.id === values.shopper);
const listing = SAMPLE_LISTINGS.find((l) => l.id === values.listing);
const closet = values.closet ? SAMPLE_CLOSET.find((c) => c.id === values.closet) : null;
if (!shopper || !listing || (values.closet && !closet)) {
  console.error("Usage: --shopper <id> --listing <id> [--closet <id>]");
  process.exit(2);
}

const fixturesPath = "src/data/fixtures/listings.json";
const readings = JSON.parse(await readFile(fixturesPath, "utf8"));
const facts = readings[listing.id]?.facts;
if (!facts) {
  console.error(`Record the listing first: node scripts/record-listing.mjs --listing ${listing.id}`);
  process.exit(2);
}

const garments = [{ photo: listing.photo, type: facts.garment_type, label: listing.title }];
if (closet) garments.push({ photo: closet.photo, type: closet.garment_type, label: closet.label });
const steps = garments
  .map((g) => ({ ...g, route: tryOnRouteFor(g.type) }))
  .sort((a, b) => a.route.layer - b.route.layer)
  .map((g) => ({ garment: g.photo, endpoint: g.route.endpoint, garment_category: g.route.garment_category, label: g.label }));

console.log(`Recording ${shopper.id} + ${listing.id}${closet ? ` + ${closet.id}` : ""}: ${steps.map((s) => `${s.endpoint}${s.garment_category ? `/${s.garment_category}` : ""}`).join(" then ")}`);
const t0 = Date.now();
const res = await fetch(`${values.server}/api/tryon`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ person: shopper.photo, steps }),
});
const out = await res.json();
if (!res.ok) {
  console.error(`Failed (${res.status}): ${out.error} [${out.code ?? ""}]`);
  process.exit(1);
}

const m = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(out.image);
const ext = m[1] === "image/png" ? "png" : "jpg";
const name = [shopper.id, listing.id, closet?.id].filter(Boolean).join("__");
await mkdir("public/demo/results", { recursive: true });
const file = path.join("public/demo/results", `${name}.${ext}`);
await writeFile(file, Buffer.from(m[2], "base64"));

const tryonsPath = "src/data/fixtures/tryons.json";
const tryons = JSON.parse(await readFile(tryonsPath, "utf8"));
tryons[`${shopper.id}|${listing.id}|${closet?.id ?? ""}`] = {
  image: `/demo/results/${name}.${ext}`,
  trace: out.trace,
  recorded_at: out.recorded_at,
};
await writeFile(tryonsPath, JSON.stringify(tryons, null, 2) + "\n");
console.log(
  `Saved ${file} in ${((Date.now() - t0) / 1000).toFixed(1)} s. cached=${out.cached} units this call=${out.trace.reduce((n, t) => n + t.units, 0)} server total=${out.units?.spent ?? "n/a"}`,
);
