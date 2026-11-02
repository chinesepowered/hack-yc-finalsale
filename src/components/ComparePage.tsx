"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import { runFitCheck } from "@/lib/fit-check";
import { useAppData } from "@/lib/client/useAppData";
import { traceLabel } from "./TryOnStage";
import { SiteFooter, SiteHeader } from "./Chrome";
import { CheckIcon, FlagIcon, NoteIcon, CompareIcon } from "./icons";

export function ComparePage() {
  const app = useAppData();
  const looks = useMemo(
    () =>
      app.saved
        .map((s) => {
          const shopper = app.shoppers.find((x) => x.id === s.shopperId);
          const listing = app.listings.find((x) => x.id === s.listingId);
          const closet = s.closetId ? app.closet.find((x) => x.id === s.closetId) : null;
          if (!shopper || !listing) return null;
          const { result } = app.resultFor(shopper.id, listing.id, closet?.id ?? null);
          const profile = app.profileFor(shopper)!;
          const check = listing.facts ? runFitCheck(listing.facts, listing.text, profile) : null;
          return { s, shopper, listing, closet, result, check };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [app],
  );
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = (picked.length ? picked : looks.slice(-2).map((l) => l.s.key)).slice(0, 2);
  const shown = looks.filter((l) => chosen.includes(l.s.key));

  return (
    <>
      <SiteHeader app={app} />
      <main id="main" className="mx-auto max-w-[1440px] px-4 py-5 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <CompareIcon size={24} className="text-denim" />
          <h1 className="font-display text-[30px] font-semibold">Compare side by side</h1>
          <Link href="/" className="btn btn-ghost ml-auto" data-testid="back-to-app">
            Back to try-on
          </Link>
        </div>
        {!app.ready ? null : looks.length === 0 ? (
          <div className="card mt-5 p-6">
            <p className="text-ink-2">Nothing saved yet. Press Save look under a try-on, then come back here.</p>
          </div>
        ) : (
          <>
            {looks.length > 2 && (
              <div className="mt-4">
                <p className="text-[14px] font-semibold">Choose two</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Saved looks">
                  {looks.map((l) => (
                    <button
                      key={l.s.key}
                      type="button"
                      aria-pressed={chosen.includes(l.s.key)}
                      onClick={() => setPicked((p) => (p.includes(l.s.key) ? p.filter((k) => k !== l.s.key) : [...p.slice(-1), l.s.key]))}
                      className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${chosen.includes(l.s.key) ? "border-ink bg-ink text-paper" : "border-line-2"}`}
                    >
                      {l.listing.title}
                      {l.closet ? ` + ${l.closet.label.toLowerCase()}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={`mt-5 grid gap-4 ${shown.length > 1 ? "md:grid-cols-2" : ""}`} data-testid="compare-grid">
              {shown.map((l) => {
                const c = l.check;
                return (
                  <article key={l.s.key} className="card overflow-hidden" data-testid={`compare-${l.listing.id}`}>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-0">
                      <div className="relative bg-[#ece5d8]" style={{ aspectRatio: "3 / 4" }}>
                        {l.result ? (
                          <img src={l.result.image} alt={`${l.shopper.name} wearing the ${l.listing.title}`} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <img src={l.shopper.photo} alt={`${l.shopper.name}`} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                        )}
                        <img src={l.listing.photo} alt="" className="absolute left-2 top-2 w-[30%] rotate-[-3deg] rounded border-4 border-white bg-white shadow" />
                      </div>
                      <div className="flex flex-col p-4">
                        <p className="text-[12.5px] text-ink-3">{l.listing.seller}</p>
                        <h2 className="font-display text-[21px] font-semibold leading-tight">{l.listing.title}</h2>
                        {l.closet && <p className="text-[13.5px] text-ink-2">with {l.closet.label.toLowerCase()}</p>}
                        <p className="num mt-1 text-[20px]">{l.listing.price ? `$${l.listing.price}` : ""}</p>
                        {c && (
                          <div className={`mt-3 rounded-lg px-3 py-2 text-[14px] font-semibold ${c.flags ? "bg-flag-bg text-flag" : c.notes ? "bg-note-bg text-note" : "bg-ok-bg text-ok"}`}>
                            {c.flags ? `${c.flags} ${c.flags === 1 ? "flag" : "flags"}` : c.notes ? "No flags, some checks" : "No flags"}
                            {c.keyTotal ? `, ${c.compared} of ${c.keyTotal} key measurements compared` : ""}
                          </div>
                        )}
                        <ul className="mt-3 space-y-2 text-[13.5px]">
                          {c?.findings
                            .filter((f) => f.level !== "ok")
                            .slice(0, 4)
                            .map((f) => (
                              <li key={f.id} className="flex items-start gap-2">
                                {f.level === "flag" ? (
                                  <FlagIcon size={16} className="mt-0.5 flex-none text-flag" aria-label="Flag" />
                                ) : f.level === "note" ? (
                                  <NoteIcon size={16} className="mt-0.5 flex-none text-note" aria-label="Check" />
                                ) : (
                                  <CheckIcon size={16} className="mt-0.5 flex-none text-ok" />
                                )}
                                <span className="leading-snug">{f.title}</span>
                              </li>
                            ))}
                        </ul>
                        {l.result && <p className="mt-auto pt-3 text-[12px] text-ink-3">{traceLabel(l.result.trace)}</p>}
                        <Link
                          href={`/?shopper=${l.shopper.id}&listing=${l.listing.id}${l.closet ? `&closet=${l.closet.id}` : ""}`}
                          className="mt-2 text-[13.5px] font-semibold text-denim underline underline-offset-2"
                        >
                          Open this look
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
