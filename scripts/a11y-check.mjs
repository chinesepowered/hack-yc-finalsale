#!/usr/bin/env node
// Runs axe-core (WCAG 2.0, 2.1 and 2.2 A and AA rules) on the main views in Replay mode.
//   pnpm build && pnpm start
//   node scripts/a11y-check.mjs [--server http://localhost:3000]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSrc = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const { values } = parseArgs({ options: { server: { type: "string", default: "http://localhost:3000" } } });
const base = values.server;

const views = [
  ["home, desktop", "/", null, 1440],
  ["home, phone", "/", null, 390],
  ["measurements dialog", "/", (p) => p.getByTestId("open-profile").click(), 1440],
  ["API calls dialog", "/", (p) => p.getByTestId("show-trace").click(), 1440],
  ["listing with a missing measurement", "/?listing=knit-cardigan", null, 1440],
  ["compare", "/compare", null, 1440],
];

const browser = await chromium.launch();
let total = 0;
for (const [label, path, setup, width] of views) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  if (setup) {
    await setup(page);
    await page.waitForTimeout(400);
  }
  await page.addScriptTag({ content: axeSrc });
  const r = await page.evaluate(() =>
    window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }),
  );
  total += r.violations.length;
  console.log(`${label}: ${r.violations.length} violations`);
  for (const v of r.violations) console.log(`  - ${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0].target.join(" ")}`);
  await page.close();
}
// Keyboard-only pass: Tab order reaches the main controls with a visible focus ring, Enter selects,
// Escape closes a dialog and returns focus to its opener.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const reached = new Set();
let ringMissing = 0;
for (let i = 0; i < 80; i++) {
  await page.keyboard.press("Tab");
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return { id: el.getAttribute("data-testid") || el.textContent.trim().slice(0, 30), ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
  });
  if (!info) continue;
  reached.add(info.id);
  if (!info.ring) ringMissing++;
}
const must = ["mode-replay", "open-profile", "shopper-noor", "listing-denim-jacket", "listing-combat-boots", "paste-listing", "view-listing", "save-look", "show-trace", "closet-white-sneakers", "copy-ask-seller", "edit-measurements"];
const missed = must.filter((m) => !reached.has(m));
console.log(`keyboard: reached ${reached.size} controls; missing from tab order: ${missed.length ? missed.join(", ") : "none"}; without a focus ring: ${ringMissing}`);
await page.getByTestId("listing-knit-cardigan").focus();
await page.keyboard.press("Enter");
const pressed = await page.getByTestId("listing-knit-cardigan").getAttribute("aria-pressed");
await page.getByTestId("show-trace").focus();
await page.keyboard.press("Enter");
await page.getByTestId("trace-dialog").waitFor();
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const back = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
console.log(`keyboard: Enter selects a listing: ${pressed === "true"}; Escape closes the dialog and focus returns to: ${back}`);
if (missed.length || ringMissing || pressed !== "true" || back !== "show-trace") total++;

await browser.close();
process.exit(total ? 1 : 0);
