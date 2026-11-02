"use client";
import { endpointName } from "@/lib/routing";
import type { ReaderMeta, TryOnResult } from "@/lib/types";
import { Dialog } from "./Dialog";

export function TraceDialog({
  open,
  onClose,
  result,
  source,
  readerMeta,
}: {
  open: boolean;
  onClose: () => void;
  result: TryOnResult | null;
  source: "live" | "recorded" | null;
  readerMeta?: ReaderMeta;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="How this image was made" testId="trace-dialog" wide>
      {!result ? (
        <p>No try-on yet.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[15px] text-ink-2">
            {source === "recorded"
              ? `Recorded ${result.recorded_at ? new Date(result.recorded_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : ""} through this app's own /api/tryon route, then saved as a fixture.`
              : "Made live through this app's /api/tryon route."}{" "}
            Every YouCam task is asynchronous: register the file, upload the bytes, start the task, poll until it succeeds.
          </p>
          <ol className="space-y-3">
            {result.trace.map((t, i) => (
              <li key={i} className="rounded-xl border border-line bg-paper/60 p-4" data-testid={`trace-step-${i}`}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="num text-[13px] text-ink-3">Step {i + 1}</span>
                  <p className="font-display text-[18px] font-semibold">{endpointName(t.endpoint)}</p>
                  <p className="text-[14px] text-ink-2">{t.garment_label}</p>
                  <p className="num ml-auto text-[13px] text-ink-2">
                    {(t.ms / 1000).toFixed(1)} s, {t.cached ? "cached, 0" : t.units} units, task {t.task_id_hint}
                  </p>
                </div>
                <ul className="num mt-2.5 space-y-1 text-[12.5px] text-ink">
                  {t.calls.map((c, j) => (
                    <li key={j} className="rounded bg-card px-2 py-1">
                      {c}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {readerMeta && (
            <div className="rounded-xl border border-line p-4">
              <p className="font-semibold">Listing reader</p>
              <p className="mt-1 text-[14px] text-ink-2">
                An open-weights LLM read the listing {readerMeta.used_photo ? "text and photo" : "text"} in{" "}
                <span className="num">{(readerMeta.ms / 1000).toFixed(1)} s</span> and returned strict JSON (schema-constrained), each fact with its quote.
                The comparison against your measurements is plain code in <span className="num">src/lib/fit-check.ts</span>.
              </p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
