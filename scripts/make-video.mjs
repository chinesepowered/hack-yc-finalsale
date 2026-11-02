#!/usr/bin/env node
// Makes demo/video.mp4 and demo/thumb.jpg from the Replay flow. No YouCam or LLM calls.
//  1. Narration: one AssemblyAI text-to-speech request per scene (voice aai-sara), cached in demo/narration by text hash.
//  2. Recording: headless Chromium at 1440x900 clicks through the app, holding each scene as long as its narration.
//  3. Composition: ffmpeg lays each narration clip at its scene's start time and encodes H.264 + AAC.
//
//   pnpm build && pnpm start
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local scripts/make-video.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { values } = parseArgs({
  options: { server: { type: "string", default: "http://localhost:3000" }, "dry-run": { type: "boolean", default: false } },
});
const BASE = values.server;
const VOICE = "aai-sara";
const OUT = "demo";
const NARR = path.join(OUT, "narration");
const TMP = path.join(OUT, ".tmp");

// ---------- the script: narration plus what happens on screen ----------
const scenes = [
  {
    id: "s01-problem",
    text: "Secondhand clothes are usually final sale. One of a kind, no returns, no size chart, and photographed on a hanger. That's exactly where trying before you buy matters most, and where nobody offers it.",
    run: async (a) => {
      await a.goto(`${BASE}/video/intro`);
    },
  },
  {
    id: "s02-photo",
    text: "Final Sale fixes that. You add a full-body photo once, and it stays in your browser. Then you note the measurements of clothes that already fit you.",
    run: async (a) => {
      await a.goto(BASE);
      await a.page.getByTestId("check-panel").waitFor();
      await a.click("view-original");
      await a.pause(1800);
      await a.click("open-profile");
      await a.page.getByTestId("profile-dialog").waitFor();
      await a.pause(4200);
      await a.click("profile-dialog-close");
    },
  },
  {
    id: "s03-aha",
    text: "Here's a vintage denim jacket from a resale listing, crumpled on a hanger. One tap, and the YouCam AI Clothes API puts it on you, using the outerwear category of its cloth v4 engine.",
    run: async (a) => {
      await a.hover("listing-denim-jacket");
      await a.pause(2600);
      await a.click("listing-denim-jacket");
      await a.pause(3500);
      await a.hover("api-badge");
    },
  },
  {
    id: "s04-check",
    text: "Next to the image is the final sale check. A language model reads the listing into facts, each with the seller's exact words. Then plain code compares them with your measurements. This jacket is two inches shorter than yours, and the seller mentions a mark near the cuff. The photo could never show you that.",
    run: async (a) => {
      await a.hover("check-verdict");
      await a.pause(5200);
      await a.hover("finding-m-length");
      await a.pause(6500);
      await a.scrollTo("finding-flaw-0");
      await a.hover("finding-flaw-0");
    },
  },
  {
    id: "s05-api",
    text: "Every image shows which YouCam API made it, and how: upload both photos, start the task, poll until it succeeds.",
    run: async (a) => {
      await a.scrollTop();
      await a.click("show-trace");
      await a.page.getByTestId("trace-dialog").waitFor();
      await a.pause(5600);
      await a.click("trace-dialog-close");
    },
  },
  {
    id: "s06-closet",
    text: "Style it with what you own. Pick your black dress, and Final Sale chains two YouCam try-ons in dressing order: the dress first, then the jacket on top.",
    run: async (a) => {
      await a.scrollTo("closet-card");
      await a.click("closet-black-dress");
      await a.pause(1200);
      await a.scrollTop();
      await a.pause(4200);
      await a.click("save-look");
    },
  },
  {
    id: "s07-ask",
    text: "When a seller leaves out a measurement, Final Sale says so, and drafts the question to ask before you buy.",
    run: async (a) => {
      await a.click("listing-knit-sweater");
      await a.pause(2600);
      await a.scrollTo("ask-seller");
      await a.hover("ask-seller");
      await a.pause(1500);
      await a.click("copy-ask-seller");
    },
  },
  {
    id: "s08-shoes",
    text: "Boots go through YouCam AI Shoes. Half a size up, with a scuffed heel. Good to know before it's final.",
    run: async (a) => {
      await a.scrollTop();
      await a.click("listing-ankle-boots");
      await a.pause(3000);
      await a.hover("check-verdict");
      await a.pause(1500);
      await a.click("save-look");
    },
  },
  {
    id: "s09-compare",
    text: "Save looks, then compare them side by side.",
    run: async (a) => {
      await a.click("header-compare");
      await a.page.getByTestId("compare-grid").waitFor();
    },
  },
  {
    id: "s10-honest",
    text: "One honest limit: a try-on shows the look, not the fit. That's why the measurements sit right next to it. Final Sale is for secondhand shoppers, and for the small resellers who lose sales when buyers can't picture an item.",
    run: async (a) => {
      await a.pause(2500);
      await a.goto(`${BASE}/video/outro`);
    },
  },
];

// ---------- 1. narration ----------
async function tts(text) {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not set (use --env-file=.env.local).");
  const res = await fetch("https://tts.us.assemblyai.com/v1/speech", {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: VOICE, container: "wav", sample_rate: 44100 }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), billed: Number(res.headers.get("x-tts-billed-characters") ?? text.length) };
}

const seconds = (file) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));

await mkdir(NARR, { recursive: true });
const manifestPath = path.join(NARR, "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : {};
const totalChars = scenes.reduce((n, s) => n + s.text.length, 0);
console.log(`Narration: ${scenes.length} scenes, ${totalChars} characters.`);
if (totalChars > 2500) throw new Error("Narration is over 2,500 characters; trim it first.");
let billed = 0;
for (const s of scenes) {
  const hash = createHash("sha256").update(`${VOICE}\n${s.text}`).digest("hex").slice(0, 16);
  const mp3 = path.join(NARR, `${s.id}.mp3`);
  if (manifest[s.id]?.hash === hash && existsSync(mp3)) {
    s.audio = mp3;
    s.dur = manifest[s.id].seconds;
    continue;
  }
  if (values["dry-run"]) {
    s.dur = s.text.length / 15;
    continue;
  }
  const { bytes, billed: b } = await tts(s.text);
  billed += b;
  await mkdir(TMP, { recursive: true });
  const wav = path.join(TMP, `${s.id}.wav`);
  await writeFile(wav, bytes);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "160k", mp3]);
  s.audio = mp3;
  s.dur = seconds(mp3);
  manifest[s.id] = { hash, seconds: s.dur, chars: s.text.length };
  console.log(`  ${s.id}: ${s.dur.toFixed(1)} s`);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`TTS characters billed this run: ${billed}. Narration length: ${scenes.reduce((n, s) => n + s.dur, 0).toFixed(1)} s.`);

// ---------- 2. recording ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: TMP, size: { width: 1440, height: 900 } },
});
await ctx.addInitScript(() => {
  // A visible cursor and click ripple, since headless recordings have none.
  const add = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-6.6 1.6 3.7 7.1-2.6 1.3-3.6-7.1L5 19.4Z" fill="#1d1b18" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", transform: "translate(-200px,-200px)", transition: "transform 40ms linear" });
    document.documentElement.appendChild(c);
    const pos = JSON.parse(sessionStorage.getItem("__cursor") || "[720,450]");
    c.style.transform = `translate(${pos[0] - 4}px, ${pos[1] - 2}px)`;
    window.addEventListener("mousemove", (e) => {
      c.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`;
      sessionStorage.setItem("__cursor", JSON.stringify([e.clientX, e.clientY]));
    }, true);
    window.addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      Object.assign(r.style, { position: "fixed", left: `${e.clientX - 18}px`, top: `${e.clientY - 18}px`, width: "36px", height: "36px", borderRadius: "999px", border: "3px solid #24365c", zIndex: "2147483646", pointerEvents: "none", transition: "transform 450ms ease, opacity 450ms ease" });
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = "scale(1.8)"; r.style.opacity = "0"; });
      setTimeout(() => r.remove(), 500);
    }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add);
  else add();
});
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
const page = await ctx.newPage();
const t0 = Date.now();
let mouse = { x: 720, y: 450 };
const a = {
  page,
  pause: (ms) => page.waitForTimeout(ms),
  goto: async (url) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
  },
  async moveTo(id) {
    const el = page.getByTestId(id).first();
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    const x = b.x + Math.min(b.width / 2, 60);
    const y = b.y + Math.min(b.height / 2, 28);
    const steps = Math.max(12, Math.round(Math.hypot(x - mouse.x, y - mouse.y) / 18));
    await page.mouse.move(x, y, { steps });
    mouse = { x, y };
  },
  async hover(id) {
    await this.moveTo(id);
    await page.waitForTimeout(250);
  },
  async click(id) {
    await this.moveTo(id);
    await page.waitForTimeout(220);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(350);
  },
  async scrollTo(id) {
    await page.getByTestId(id).first().evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    await page.waitForTimeout(900);
  },
  async scrollTop() {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(700);
  },
};

const LEAD = 0.5; // seconds of picture before each narration clip starts
const TAIL = 0.7; // breathing room after each clip
for (const s of scenes) {
  const start = (Date.now() - t0) / 1000;
  s.start = start;
  await s.run(a);
  const target = start + LEAD + s.dur + TAIL;
  const now = (Date.now() - t0) / 1000;
  if (now < target) await page.waitForTimeout((target - now) * 1000);
  else console.log(`  note: ${s.id} actions ran ${(now - target).toFixed(1)} s past its narration`);
}
await page.waitForTimeout(1200);
const videoPath = await page.video().path();
await ctx.close();
await browser.close();

// ---------- 3. composition ----------
const cut = Math.max(0, scenes[0].start - 0.2);
const inputs = ["-ss", cut.toFixed(3), "-i", videoPath];
const filters = [];
const labels = [];
scenes.forEach((s, i) => {
  if (!s.audio) return;
  inputs.push("-i", s.audio);
  const ms = Math.round((s.start - cut + LEAD) * 1000);
  filters.push(`[${labels.length + 1}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[a${i}]`);
  labels.push(`[a${i}]`);
});
const total = (Date.now() - t0) / 1000 - cut;
filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,apad[mix]`);
filters.push(`[0:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.6,fade=t=out:st=${(total - 1.6).toFixed(2)}:d=1.2[v]`);
const out = path.join(OUT, "video.mp4");
if (!values["dry-run"]) {
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filters.join(";"), "-map", "[v]", "-map", "[mix]", "-t", total.toFixed(2),
      "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", out],
    { stdio: "inherit" },
  );
  console.log(`Wrote ${out}: ${seconds(out).toFixed(1)} s`);
}

// ---------- thumbnail ----------
const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: { width: 1280, height: 720 } });
await p2.goto(`${BASE}/video/thumb`, { waitUntil: "networkidle" });
await p2.waitForTimeout(800);
await p2.screenshot({ path: path.join(TMP, "thumb.png") });
await b2.close();
execFileSync("convert", [path.join(TMP, "thumb.png"), "-quality", "90", path.join(OUT, "thumb.jpg")]);
console.log(`Wrote ${OUT}/thumb.jpg`);

for (const f of await readdir(TMP)) if (f.endsWith(".webm") || f.endsWith(".wav") || f.endsWith(".png")) await rm(path.join(TMP, f));
await writeFile(
  path.join(OUT, "scenes.json"),
  JSON.stringify(scenes.map((s) => ({ id: s.id, start: +(s.start - cut).toFixed(2), seconds: +s.dur.toFixed(2), text: s.text })), null, 2) + "\n",
);
