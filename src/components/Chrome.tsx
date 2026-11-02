"use client";
import Link from "next/link";
import type { AppData } from "@/lib/client/useAppData";
import { BoltIcon, CompareIcon, Logo, ReplayIcon } from "./icons";

export const REPO_URL = "https://github.com/chinesepowered/hack-yc-finalsale";

export function SiteHeader({ app, compact }: { app: AppData | null; compact?: boolean }) {
  const liveReady = Boolean(app?.status?.live.tryOn && app?.status?.live.reader);
  return (
    <header className="border-b border-line bg-card/80 backdrop-blur" data-testid="site-header">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Final Sale, home">
          <Logo />
          <span className="font-display text-[24px] font-semibold leading-none tracking-tight">Final Sale</span>
        </Link>
        <p className="hidden text-[14px] text-ink-2 md:block">Try secondhand on before it&apos;s final.</p>

        {app && !compact && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Data source" className="flex rounded-full border border-line-2 bg-paper p-0.5 text-[13px] font-semibold" data-testid="mode-switch">
              <button
                type="button"
                aria-pressed={app.mode === "replay"}
                onClick={() => app.setMode("replay")}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3 ${app.mode === "replay" ? "bg-denim text-white" : "text-ink-2"}`}
                data-testid="mode-replay"
              >
                <ReplayIcon size={15} /> Replay of a recorded run
              </button>
              <button
                type="button"
                aria-pressed={app.mode === "live"}
                aria-disabled={!liveReady}
                onClick={() => liveReady && app.setMode("live")}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3 ${app.mode === "live" ? "bg-denim text-white" : "text-ink-2"} ${liveReady ? "" : "cursor-not-allowed opacity-60"}`}
                title={liveReady ? "Uses the YouCam and LLM keys on this server" : "Live mode needs API keys on the server"}
                data-testid="mode-live"
              >
                <BoltIcon size={15} /> Live
              </button>
            </div>
            {app.mode === "live" && app.status && (
              <span className="chip num border border-line-2 bg-card text-ink-2" data-testid="units-meter">
                {app.status.units.spent} of {app.status.units.budget} YouCam units
              </span>
            )}
            <Link href="/compare" className="btn btn-ghost min-h-[40px] text-[14px]" data-testid="header-compare">
              <CompareIcon size={17} /> Saved ({app.saved.length})
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1440px] px-4 pb-8 pt-2 text-[13px] text-ink-3 lg:px-6">
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-4">
        <span>Try-on images by the YouCam API (AI Clothes, AI Shoes). Listing facts by an open-weights LLM; fit decisions by plain code.</span>
        <a className="underline underline-offset-2" href={REPO_URL}>
          Source code (AGPL-3.0)
        </a>
        <a className="underline underline-offset-2" href={`${REPO_URL}/blob/main/docs/CREDITS.md`}>
          Photo credits
        </a>
        <span>Sellers and listings are fictional.</span>
      </div>
    </footer>
  );
}
