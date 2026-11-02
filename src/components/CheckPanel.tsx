"use client";
import { useState } from "react";
import { fmtLength } from "@/lib/fit-check";
import type { FitCheck, Finding, Listing } from "@/lib/types";
import { CheckIcon, CopyIcon, FlagIcon, NoteIcon, RulerIcon } from "./icons";

const LEVEL = {
  flag: { Icon: FlagIcon, word: "Flag", cls: "bg-flag-bg text-flag", ring: "border-flag/30" },
  note: { Icon: NoteIcon, word: "Check", cls: "bg-note-bg text-note", ring: "border-note/25" },
  ok: { Icon: CheckIcon, word: "OK", cls: "bg-ok-bg text-ok", ring: "border-ok/20" },
} as const;

export function CheckPanel({
  listing,
  check,
  units,
  onEditProfile,
}: {
  listing: Listing;
  check: FitCheck | null;
  units: "in" | "cm";
  onEditProfile: () => void;
}) {
  if (!listing.facts || !check) {
    return (
      <section aria-labelledby="check-h" className="card p-5">
        <Header />
        <p className="mt-4 text-ink-2">This listing hasn&apos;t been read yet.</p>
      </section>
    );
  }
  const { flags, notes } = check;
  const verdict =
    flags > 0
      ? { cls: "bg-flag-bg text-flag border-flag/25", Icon: FlagIcon, text: `${flags} ${flags === 1 ? "thing" : "things"} the photo can't show you` }
      : notes > 0
        ? { cls: "bg-note-bg text-note border-note/25", Icon: NoteIcon, text: "Worth a check before you buy" }
        : { cls: "bg-ok-bg text-ok border-ok/25", Icon: CheckIcon, text: "Matches you on everything listed" };

  return (
    <section aria-labelledby="check-h" className="card overflow-hidden" data-testid="check-panel">
      <div className="tape" aria-hidden="true" />
      <div className="p-5">
        <Header />
        <div className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${verdict.cls}`} data-testid="check-verdict" role="status">
          <verdict.Icon size={22} className="mt-0.5 flex-none" />
          <div>
            <p className="font-display text-[19px] font-semibold leading-snug">{verdict.text}</p>
            <p className="mt-0.5 text-[13px] text-ink-2">
              {check.keyTotal > 0 ? (
                <>
                  Compared <span className="num">{check.compared}</span> of <span className="num">{check.keyTotal}</span> key measurements with your profile.
                </>
              ) : (
                "No size measurements apply to this item."
              )}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5" data-testid="findings">
          {check.findings
            .filter((f) => f.level !== "ok")
            .map((f) => (
              <FindingRow key={f.id} f={f} units={units} />
            ))}
        </ul>

        {check.askSeller && <AskSeller text={check.askSeller} />}

        {check.findings.some((f) => f.level === "ok" && f.kind !== "photo") && (
          <div className="mt-4" data-testid="also-checked">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">Also checked</p>
            <ul className="mt-1.5 space-y-1.5">
              {check.findings
                .filter((f) => f.level === "ok" && f.kind !== "photo")
                .map((f) => (
                  <li key={f.id} className="flex items-start gap-2 text-[14px] leading-snug" data-testid={`finding-${f.id}`}>
                    <CheckIcon size={16} className="mt-0.5 flex-none text-ok" />
                    <span>
                      {f.title}
                      {f.detail && <span className="text-ink-3">. {f.detail}</span>}
                      <span className="sr-only"> (OK)</span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {check.findings.some((f) => f.kind === "photo") && (
          <div className="mt-4" data-testid="photo-notes">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">About the listing photo</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13.5px] leading-snug text-ink-2">
              {check.findings
                .filter((f) => f.kind === "photo")
                .map((f) => (
                  <li key={f.id}>{f.title}</li>
                ))}
            </ul>
          </div>
        )}

        <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-2">
          <p>
            <strong className="text-ink">Try-on shows the look, not the fit.</strong> Measurements decide fit, so they sit next to the image.
          </p>
          <p>
            An AI listing reader pulled these facts from the seller&apos;s words, each with its exact quote; plain code checked every quote and did the
            comparing.{check.dropped > 0 ? ` ${check.dropped} extracted ${check.dropped === 1 ? "fact" : "facts"} didn't match the listing text and ${check.dropped === 1 ? "was" : "were"} ignored.` : ""}
          </p>
          <button type="button" onClick={onEditProfile} className="font-semibold text-denim underline underline-offset-2" data-testid="edit-measurements">
            Edit your usual measurements
          </button>
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="step-num" aria-hidden="true">
        3
      </span>
      <h2 id="check-h" className="font-display text-[22px] font-semibold">
        Will it work?
      </h2>
      <span className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">
        <RulerIcon size={16} /> Final sale check
      </span>
    </div>
  );
}

function FindingRow({ f, units }: { f: Finding; units: "in" | "cm" }) {
  const L = LEVEL[f.level];
  return (
    <li className={`rise rounded-xl border bg-card px-3.5 py-3 ${L.ring}`} data-testid={`finding-${f.id}`} data-level={f.level}>
      <div className="flex items-start gap-2.5">
        <span className={`chip mt-0.5 flex-none ${L.cls}`}>
          <L.Icon size={14} />
          {L.word}
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-ink">{f.title}</p>
          {f.detail && <p className="mt-0.5 text-[14px] leading-snug text-ink-2">{f.detail}</p>}
          {f.compare && f.level !== "ok" && <Ruler c={f.compare} units={units} level={f.level} />}
          {f.quote && (
            <p className="mt-1.5 text-[12.5px] text-ink-3">
              <span className="sr-only">From the listing: </span>
              <span aria-hidden="true">Listing says </span>
              <q className="num rounded bg-paper px-1 py-0.5 text-ink-2">{f.quote}</q>
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/** A small tape measure: where the listing lands against your usual. Text above says the same thing. */
function Ruler({ c, units, level }: { c: NonNullable<Finding["compare"]>; units: "in" | "cm"; level: Finding["level"] }) {
  const lo = Math.min(c.listed, c.usual);
  const hi = Math.max(c.listed, c.usual);
  const pad = c.isSize ? 1 : Math.max(1.5, (hi - lo) * 0.6);
  const min = lo - pad;
  const max = hi + pad;
  const x = (v: number) => 8 + ((v - min) / (max - min)) * 284;
  const ticks: number[] = [];
  const step = c.isSize ? 0.5 : units === "cm" ? 1 / 2.54 : 0.5;
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  const color = level === "flag" ? "#a3231b" : "#7a4f00";
  const fmt = (v: number) => (c.isSize ? `US ${v}` : fmtLength(v, units));
  return (
    <svg viewBox="0 0 300 54" className="mt-2 h-[54px] w-full max-w-[320px]" aria-hidden="true">
      <rect x="4" y="18" width="292" height="16" rx="3" fill="#efe2b8" stroke="rgb(29 27 24 / 0.25)" />
      {ticks.map((t, i) => (
        <line key={i} x1={x(t)} x2={x(t)} y1="18" y2={Number.isInteger(t) ? 28 : 23} stroke="rgb(29 27 24 / 0.55)" strokeWidth="1" />
      ))}
      <rect x={x(lo)} y="18" width={Math.max(2, x(hi) - x(lo))} height="16" fill={color} opacity="0.22" />
      <line x1={x(c.usual)} x2={x(c.usual)} y1="12" y2="40" stroke="#1d1b18" strokeWidth="2" strokeDasharray="3 2" />
      <line x1={x(c.listed)} x2={x(c.listed)} y1="12" y2="40" stroke={color} strokeWidth="3" />
      <text x={x(c.usual)} y="9" fontSize="10" textAnchor="middle" fill="#1d1b18" fontFamily="IBM Plex Mono, monospace">
        yours {fmt(c.usual)}
      </text>
      <text x={x(c.listed)} y="51" fontSize="10" textAnchor="middle" fill={color} fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        listing {fmt(c.listed)}
      </text>
    </svg>
  );
}

function AskSeller({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line-2 bg-paper/60 p-3.5" data-testid="ask-seller">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">Ask the seller first</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{text}</p>
      <button
        type="button"
        className="btn btn-ghost mt-2.5 min-h-[40px] px-3.5 text-[14px]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        data-testid="copy-ask-seller"
      >
        <CopyIcon size={16} /> {copied ? "Copied" : "Copy message"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Message copied" : ""}
      </span>
    </div>
  );
}
