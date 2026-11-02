#!/usr/bin/env node
// Captures docs/screenshots/*.png at 1440x900 from the Replay flow (no keys, no API calls).
//   pnpm build && pnpm start   (or pnpm dev)
//   node scripts/screenshots.mjs [--server http://localhost:3000]
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { values } = parseArgs({ options: { server: { type: "string", default: "http://localhost:3000" } } });
const base = values.server;
const out = "docs/screenshots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
const tid = (id) => page.getByTestId(id);
const settle = (ms = 700) => page.waitForTimeout(ms);

await page.goto(base, { waitUntil: "networkidle" });
await tid("check-panel").waitFor();
await settle(1200);
await page.screenshot({ path: `${out}/01-try-on-and-final-sale-check.png` });

await tid("closet-white-sneakers").click();
await settle(1200);
await tid("closet-card").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo(0, 0));
await settle(300);
await page.screenshot({ path: `${out}/02-style-with-your-closet.png` });

await tid("save-look").click();
await tid("show-trace").click();
await tid("trace-dialog").waitFor();
await settle(500);
await page.screenshot({ path: `${out}/03-youcam-api-calls.png` });
await tid("trace-dialog-close").click();

await tid("closet-none").click();
await tid("listing-knit-cardigan").click();
await settle(1200);
await page.screenshot({ path: `${out}/04-missing-measurement-ask-the-seller.png` });

await tid("listing-combat-boots").click();
await settle(1000);
await tid("save-look").click();
await tid("open-profile").click();
await tid("profile-dialog").waitFor();
await settle(500);
await page.screenshot({ path: `${out}/05-your-usual-measurements.png` });
await tid("profile-dialog-close").click();

await tid("header-compare").click();
await tid("compare-grid").waitFor();
await settle(1000);
await page.screenshot({ path: `${out}/06-compare-side-by-side.png` });

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: true, hasTouch: true });
const p2 = await phone.newPage();
await p2.goto(base, { waitUntil: "networkidle" });
await p2.getByTestId("tryon-stage").scrollIntoViewIfNeeded();
await p2.waitForTimeout(1200);
await p2.screenshot({ path: `${out}/07-mobile.png` });

await browser.close();
console.log("Saved screenshots to", out);
