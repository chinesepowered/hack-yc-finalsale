#!/usr/bin/env node
// Records ONE listing read (text plus garment photo) through the app's own /api/read-listing route.
//   node scripts/record-listing.mjs --listing denim-jacket
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { SAMPLE_LISTINGS } from "../src/data/demo.ts";

const { values } = parseArgs({
  options: { listing: { type: "string" }, server: { type: "string", default: "http://localhost:3000" } },
});
const listing = SAMPLE_LISTINGS.find((l) => l.id === values.listing);
if (!listing) {
  console.error("Usage: --listing <id>");
  process.exit(2);
}

const res = await fetch(`${values.server}/api/read-listing`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: listing.text, photo: listing.photo }),
});
const out = await res.json();
if (!res.ok) {
  console.error(`Failed (${res.status}): ${out.error}`);
  process.exit(1);
}
const p = "src/data/fixtures/listings.json";
const all = JSON.parse(await readFile(p, "utf8"));
all[listing.id] = { facts: out.facts, meta: out.meta };
await writeFile(p, JSON.stringify(all, null, 2) + "\n");
console.log(`Saved reading for ${listing.id} in ${out.meta.ms} ms (cached=${out.cached}).`);
console.log(JSON.stringify(out.facts, null, 2));
