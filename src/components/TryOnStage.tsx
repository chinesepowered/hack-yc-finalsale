"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { endpointName } from "@/lib/routing";
import type { ClosetItem, Listing, Shopper, TraceStep, TryOnResult, TryOnRoute } from "@/lib/types";
import { BookmarkIcon, CodeIcon, ReplayIcon, SparkIcon } from "./icons";

type View = "result" | "listing" | "original";

export function traceLabel(trace: TraceStep[]) {
  return trace
    .map((t) => `${endpointName(t.endpoint)}${t.garment_category ? ` (${t.endpoint}, ${t.garment_category})` : ` (${t.endpoint})`}`)
    .join(" then ");
}

export function TryOnStage(props: {
  shopper: Shopper;
  listing: Listing;
  closetItem: ClosetItem | null;
  routes: TryOnRoute[];
  result: TryOnResult | null;
  source: "live" | "recorded" | null;
  canRunLive: boolean;
  mode: "replay" | "live";
  busy: { startedAt: number; label: string } | null;
  error: string | null;
  saved: boolean;
  onTryOn: () => void;
  onToggleSave: () => void;
  onShowTrace: () => void;
  /** Changes on every listing click, so the reveal plays again. */
  revealKey: number;
}) {
  const { shopper, listing, closetItem, result, busy } = props;
  // The view resets to the try-on whenever the look changes or a listing is clicked again.
  const resetKey = `${props.revealKey}|${listing.id}|${closetItem?.id ?? ""}|${shopper.id}`;
  const [viewState, setViewState] = useState<{ key: string; view: View }>({ key: resetKey, view: "result" });
  const view: View = viewState.key === resetKey ? viewState.view : "result";
  const setView = (v: View) => setViewState({ key: resetKey, view: v });
  const [elapsed, setElapsed] = useState(0);
  const cost = props.routes.length * 2;

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - busy.startedAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [busy]);

  const main =
    view === "listing" ? listing.photo : view === "original" ? shopper.photo : result ? result.image : shopper.photo;
  const showingResult = view === "result" && result;

  return (
    <section aria-labelledby="stage-h" className="card flex flex-col p-4 sm:p-5" data-testid="tryon-stage">
      <div className="flex flex-wrap items-center gap-2.5">
        <SparkIcon size={22} className="text-denim" />
        <h2 id="stage-h" className="font-display text-[22px] font-semibold">
          On you
        </h2>
        <div role="group" aria-label="Which photo to show" className="ml-auto flex rounded-full border border-line-2 bg-paper p-0.5 text-[13px] font-semibold">
          {(
            [
              ["result", closetItem ? "Outfit" : "On you"],
              ["listing", "Listing photo"],
              ["original", "Your photo"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-[36px] rounded-full px-3 ${view === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
              data-testid={`view-${v}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative mx-auto mt-3.5 overflow-hidden rounded-2xl border border-line bg-[#ece5d8]"
        style={{ aspectRatio: "3 / 4", width: "min(100%, calc(68dvh * 0.75), 560px)" }}
      >
        <img
          key={main}
          src={main}
          alt={
            view === "listing"
              ? `Listing photo: ${listing.title}`
              : view === "original"
                ? `${shopper.name}'s own photo, before the try-on`
                : result
                  ? `${shopper.name} wearing the ${listing.title}${closetItem ? ` with ${closetItem.label.toLowerCase()}` : ""}, made by YouCam`
                  : `${shopper.name}'s photo`
          }
          className={`absolute inset-0 h-full w-full ${view === "listing" ? "object-contain bg-white" : "object-cover"} ${showingResult ? "reveal" : ""}`}
          data-testid="stage-image"
        />

        {view === "result" && (
          <figure className="absolute left-3 top-3 w-[26%] min-w-[84px] rotate-[-3deg] rounded-md bg-white p-1.5 pb-1 shadow-lg" aria-hidden="true">
            <img src={listing.photo} alt="" className="aspect-square w-full rounded-sm object-cover" />
            <figcaption className="num mt-1 truncate text-center text-[10px] text-ink-2">the listing</figcaption>
          </figure>
        )}

        {showingResult && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2" data-testid="api-badge">
            <span className="chip bg-ink/85 text-paper backdrop-blur">
              <SparkIcon size={14} /> {traceLabel(result.trace)}
            </span>
            {props.source === "recorded" && (
              <span className="chip bg-paper/90 text-ink">
                <ReplayIcon size={14} /> Recorded run
              </span>
            )}
          </div>
        )}

        {view === "result" && !result && !busy && (
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-card/95 p-4 shadow-lg backdrop-blur">
            {props.canRunLive ? (
              <>
                <p className="font-semibold">
                  Ready to try the {listing.title.toLowerCase()} on {shopper.name}
                  {closetItem ? ` with ${closetItem.label.toLowerCase()}` : ""}.
                </p>
                <p className="mt-1 text-[14px] text-ink-2">
                  Sends both photos to {props.routes.map((r) => endpointName(r.endpoint)).join(" and ")}. Uses {cost} YouCam units.
                </p>
                <button type="button" className="btn btn-primary mt-3 w-full" onClick={props.onTryOn} data-testid="run-tryon">
                  <SparkIcon /> Try it on
                </button>
              </>
            ) : (
              <p className="text-[14px] text-ink-2" data-testid="not-recorded">
                {props.mode === "replay"
                  ? "This combination wasn't part of the recorded run. Switch to Live mode on a server with keys to try it."
                  : "Live try-on needs a YouCam key on the server."}
              </p>
            )}
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]" role="status" aria-live="polite">
            <div className="shimmer w-[80%] max-w-[320px] rounded-2xl border border-line bg-card p-5 text-center shadow-lg">
              <SparkIcon size={26} className="mx-auto text-denim" />
              <p className="mt-2 font-semibold">{busy.label}</p>
              <p className="num mt-1 text-[13px] text-ink-2">{elapsed} s, usually 15 to 40 s</p>
            </div>
          </div>
        )}
      </div>

      {props.error && (
        <p className="mt-3 rounded-xl border border-flag/30 bg-flag-bg px-3.5 py-2.5 text-[14px] text-flag" role="alert">
          {props.error}
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={props.onToggleSave}
          disabled={!result}
          aria-pressed={props.saved}
          data-testid="save-look"
        >
          <BookmarkIcon size={17} className={props.saved ? "fill-current" : ""} />
          {props.saved ? "Saved" : "Save look"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={props.onShowTrace} disabled={!result} data-testid="show-trace">
          <CodeIcon size={17} /> API calls
        </button>
        {result && props.mode === "live" && props.source === "recorded" && props.canRunLive && (
          <button type="button" className="btn btn-ghost" onClick={props.onTryOn} data-testid="rerun-live">
            <SparkIcon size={17} /> Run live ({cost} units)
          </button>
        )}
        {result?.trace?.length ? (
          <p className="num ml-auto text-[12.5px] text-ink-3">
            {(result.trace.reduce((n, t) => n + t.ms, 0) / 1000).toFixed(1)} s, {result.trace.reduce((n, t) => n + (t.cached ? 0 : t.units), 0)} units
          </p>
        ) : null}
      </div>
    </section>
  );
}
