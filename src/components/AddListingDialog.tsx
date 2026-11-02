"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { Listing, ListingFacts, ReaderMeta } from "@/lib/types";
import { fileToJpegDataUrl } from "@/lib/client/storage";
import { Dialog } from "./Dialog";
import { SparkIcon, UploadIcon } from "./icons";

export function AddListingDialog({
  open,
  onClose,
  live,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  live: boolean;
  onAdded: (l: Listing) => void;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!photo) return setError("Add the listing's garment photo.");
    if (text.trim().length < 20) return setError("Paste the listing's title and description.");
    setBusy(true);
    try {
      const res = await fetch("/api/read-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, photo }),
      });
      const out = (await res.json()) as { facts?: ListingFacts; meta?: ReaderMeta; error?: string };
      if (!res.ok || !out.facts) throw new Error(out.error ?? "Could not read that listing.");
      const listing: Listing = {
        id: `l-${Date.now().toString(36)}`,
        title: out.facts.title || "Pasted listing",
        price: out.facts.price ?? 0,
        currency: out.facts.currency ?? "USD",
        seller: "Pasted by you",
        location: "",
        photo,
        text,
        facts: out.facts,
        readerMeta: out.meta,
      };
      onAdded(listing);
      setText("");
      setPhoto(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Paste a listing" testId="add-listing">
      {!live ? (
        <div className="space-y-3 text-[15px] text-ink-2">
          <p>
            You&apos;re in <strong className="text-ink">Replay of a recorded run</strong>, which shows four sample listings recorded through the real APIs.
          </p>
          <p>Live mode reads any listing you paste and tries it on your own photo. It needs YouCam and LLM keys on the server (see the README).</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back to the samples
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="listing-text" className="block font-semibold">
              Listing title and description
            </label>
            <textarea
              id="listing-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder={"Vintage wool coat, size S\nPit to pit 19 in, length 38 in...\nSmall moth hole on the back. Final sale."}
              className="mt-1.5 w-full rounded-xl border border-line-2 bg-card p-3 text-[15px]"
              data-testid="listing-text"
            />
          </div>
          <div>
            <p className="font-semibold">Garment photo from the listing</p>
            <div className="mt-1.5 flex items-center gap-3">
              {photo && <img src={photo} alt="Garment photo you added" className="h-20 w-20 rounded-lg border border-line object-cover" />}
              <label className="btn btn-ghost cursor-pointer">
                <UploadIcon size={17} /> {photo ? "Change photo" : "Choose photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhoto(await fileToJpegDataUrl(f));
                  }}
                  data-testid="listing-photo"
                />
              </label>
            </div>
            <p className="mt-1.5 text-[12.5px] text-ink-3">One garment, front on. A hanger or flat-lay photo is fine.</p>
          </div>
          {error && (
            <p className="rounded-lg bg-flag-bg px-3 py-2 text-[14px] text-flag" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={busy} data-testid="read-listing">
            <SparkIcon /> {busy ? "Reading the listing..." : "Read listing"}
          </button>
          <p className="text-[12.5px] text-ink-3">The text and photo go to the AI listing reader on this app&apos;s server. Nothing is posted anywhere.</p>
        </form>
      )}
    </Dialog>
  );
}
