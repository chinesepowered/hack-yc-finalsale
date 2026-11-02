#!/usr/bin/env node
// Pre-push check. Prints nothing and exits 0 when clean.
// 1. The key-pattern scan from idea.md over all history (ignoring the line in idea.md that documents the scan itself).
// 2. Every literal value in .env.local, searched across all history (only file names are printed, never values).
// 3. Em dashes in tracked files (house style: none anywhere).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const git = (args, input) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", input, maxBuffer: 256 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"] });
  } catch (e) {
    return e.stdout ?? ""; // git grep exits 1 when nothing matches
  }
};

const revs = git(["rev-list", "--all"]).split("\n").filter(Boolean);
let problems = 0;

// Built from pieces so this file never matches the pattern itself.
const pattern = ["sk-[A-Za-z0-9_-]{30,}", "wandb" + "_v1_", "sk_[a-f0-9]{40}"].join("|");
const hits = [...git(["grep", "-nE", pattern, ...revs]).split("\n"), ...git(["grep", "--cached", "-nE", pattern]).split("\n")]
  .filter(Boolean)
  .filter(Boolean)
  .filter((l) => !/(^|:)idea\.md:\d+:\s*`git grep -nE/.test(l));
for (const h of hits) {
  problems++;
  console.log(`key pattern: ${h.split(":").slice(0, 3).join(":")}`);
}

if (existsSync(".env.local")) {
  const values = readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => l.replace(/^[A-Z0-9_]+=/, "").trim())
    .filter((v) => v.length >= 16 && !v.startsWith("http") && !v.includes("/"));
  for (const v of values) {
    const found = [...git(["grep", "-lF", v, ...revs]).split("\n"), ...git(["grep", "--cached", "-lF", v]).split("\n")].filter(Boolean);
    for (const f of found) {
      problems++;
      console.log(`literal secret value in ${f}`);
    }
  }
}

const EM_DASH = String.fromCharCode(0x2014);
const tracked = git(["ls-files"]).split("\n").filter(Boolean);
for (const f of tracked) {
  if (/\.(png|jpe?g|webp|mp4|mp3|wav|ico|woff2?)$/i.test(f) || !existsSync(f)) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes(EM_DASH)) {
      problems++;
      console.log(`em dash: ${f}:${i + 1}`);
    }
  });
}

process.exit(problems ? 1 : 0);
