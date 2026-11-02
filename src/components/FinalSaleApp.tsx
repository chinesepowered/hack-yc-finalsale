"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { RECORDED_ON } from "@/data/demo";
import { runFitCheck, fmtLength } from "@/lib/fit-check";
import { endpointName, layerOrder, tryOnRouteFor } from "@/lib/routing";
import type { ClosetItem, FitProfile, GarmentType, Listing, Shopper, TryOnResult } from "@/lib/types";
import { fileToJpegDataUrl } from "@/lib/client/storage";
import { useAppData, type AppData } from "@/lib/client/useAppData";
import { AddListingDialog } from "./AddListingDialog";
import { CheckPanel } from "./CheckPanel";
import { ProfileDialog } from "./ProfileDialog";
import { TraceDialog } from "./TraceDialog";
import { TryOnStage } from "./TryOnStage";
import { SiteFooter, SiteHeader } from "./Chrome";
import { CompareIcon, HangerIcon, LockIcon, PlusIcon, UploadIcon } from "./icons";

export function FinalSaleApp() {
  const app = useAppData();
  // Deep links from the compare page: /?shopper=maya&listing=denim-jacket&closet=black-dress
  const [listingId, setListingId] = useState(() => urlParam("listing") ?? "denim-jacket");
  const [closetId, setClosetId] = useState<string | null>(() => urlParam("closet"));
  const [busy, setBusy] = useState<{ startedAt: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "profile" | "listing" | "trace">(null);
  const [revealKey, setRevealKey] = useState(0);


  const shopper = app.shoppers.find((s) => s.id === app.shopperId) ?? app.shoppers[0];
  const profile = app.profileFor(shopper)!;
  const listing = app.listings.find((l) => l.id === listingId) ?? app.listings[0];
  const closetItem = closetId ? (app.closet.find((c) => c.id === closetId) ?? null) : null;
  const { result, source, key } = app.resultFor(shopper.id, listing.id, closetItem?.id ?? null);

  const check = useMemo(() => (listing.facts ? runFitCheck(listing.facts, listing.text, profile) : null), [listing, profile]);

  const garments = useMemo(() => {
    const g: { photo: string; type: GarmentType; label: string; route: ReturnType<typeof tryOnRouteFor> }[] = [];
    const type = listing.facts?.garment_type ?? "other";
    g.push({ photo: listing.photo, type, label: listing.title, route: tryOnRouteFor(type) });
    if (closetItem) g.push({ photo: closetItem.photo, type: closetItem.garment_type, label: closetItem.label, route: tryOnRouteFor(closetItem.garment_type) });
    return layerOrder(g);
  }, [listing, closetItem]);

  const canRunLive = app.mode === "live" && Boolean(app.status?.live.tryOn);

  const runTryOn = useCallback(async () => {
    setError(null);
    setBusy({ startedAt: Date.now(), label: `${garments.map((g) => endpointName(g.route.endpoint)).join(" + ")} is dressing ${shopper.name}` });
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: shopper.photo,
          steps: garments.map((g) => ({ garment: g.photo, endpoint: g.route.endpoint, garment_category: g.route.garment_category, label: g.label })),
        }),
      });
      const out = (await res.json()) as TryOnResult & { error?: string };
      if (!res.ok) throw new Error(out.error ?? "The try-on failed.");
      await app.putResult(key, { image: out.image, trace: out.trace, recorded_at: out.recorded_at });
      void app.refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The try-on failed.");
    } finally {
      setBusy(null);
    }
  }, [app, garments, key, shopper]);

  const isSaved = app.saved.some((s) => s.key === key);

  if (!app.ready) {
    return (
      <>
        <SiteHeader app={null} />
        <main id="main" className="mx-auto max-w-[1440px] px-4 py-10 lg:px-6">
          <div className="shimmer h-[70vh] rounded-3xl" aria-busy="true" aria-label="Loading" />
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader app={app} />
      {app.mode === "replay" && (
        <div className="border-b border-line bg-denim-soft" data-testid="replay-banner">
          <p className="mx-auto max-w-[1440px] px-4 py-2 text-[13.5px] text-denim lg:px-6">
            <strong>Replay of a recorded run.</strong> Every try-on and listing read here came from real YouCam and LLM calls, recorded {RECORDED_ON}{" "}
            through this app&apos;s own API routes. No key needed. Edit the measurements and the check updates live.
          </p>
        </div>
      )}
      <main id="main" className="mx-auto grid max-w-[1440px] gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6 xl:grid-cols-[300px_minmax(0,1fr)_minmax(400px,470px)]">
        <div className="space-y-4">
          <ShopperCard app={app} shopper={shopper} profile={profile} onEdit={() => setDialog("profile")} />
          <ListingsCard
            listings={app.listings}
            selected={listing.id}
            onSelect={(id) => {
              setListingId(id);
              setClosetId(null);
              setError(null);
              setRevealKey((k) => k + 1);
            }}
            onPaste={() => setDialog("listing")}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <TryOnStage
            shopper={shopper}
            listing={listing}
            closetItem={closetItem}
            routes={garments.map((g) => g.route)}
            result={result}
            source={source}
            canRunLive={canRunLive}
            mode={app.mode}
            busy={busy}
            error={error}
            saved={isSaved}
            onTryOn={runTryOn}
            onToggleSave={() => app.toggleSaved({ key, shopperId: shopper.id, listingId: listing.id, closetId: closetItem?.id ?? null })}
            onShowTrace={() => setDialog("trace")}
            revealKey={revealKey}
          />
          <ClosetCard
            app={app}
            listing={listing}
            shopper={shopper}
            selected={closetId}
            onSelect={setClosetId}
            canAdd={app.mode === "live"}
          />
        </div>

        <div className="min-w-0 lg:col-span-2 xl:col-span-1">
          <CheckPanel listing={listing} check={check} units={profile.displayUnits} onEditProfile={() => setDialog("profile")} />
        </div>
      </main>
      <SiteFooter />

      <ProfileDialog
        open={dialog === "profile"}
        onClose={() => setDialog(null)}
        shopper={shopper}
        profile={profile}
        canUsePhoto={app.mode === "live"}
        onSaveProfile={(p) => app.saveProfile(shopper.id, p)}
        onReset={() => app.resetProfile(shopper.id)}
        onUsePhoto={async (photo, name) => {
          const me: Shopper = { id: "me", name, photo, profile: app.me?.profile ?? profile };
          await app.setMe(me);
          app.setShopperId("me");
        }}
        onForget={async () => {
          await app.forgetEverything();
          setDialog(null);
          setListingId("denim-jacket");
          setClosetId(null);
        }}
      />
      <AddListingDialog
        open={dialog === "listing"}
        onClose={() => setDialog(null)}
        live={app.mode === "live" && Boolean(app.status?.live.reader)}
        onAdded={(l) => {
          void app.addListing(l);
          setListingId(l.id);
          setClosetId(null);
        }}
      />
      <TraceDialog open={dialog === "trace"} onClose={() => setDialog(null)} result={result} source={source} readerMeta={listing.readerMeta} />
    </>
  );
}

function urlParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name) || null;
}

function summarize(p: FitProfile) {
  const u = p.displayUnits;
  const parts: string[] = [];
  if (p.jacket.pit_to_pit) parts.push(`jacket ${fmtLength(p.jacket.pit_to_pit, u)} pit to pit`);
  if (p.jacket.length) parts.push(`${fmtLength(p.jacket.length, u)} long`);
  if (p.shoes.shoe_size_us) parts.push(`shoes US ${p.shoes.shoe_size_us}`);
  return parts.join(", ");
}

function ShopperCard({ app, shopper, profile, onEdit }: { app: AppData; shopper: Shopper; profile: FitProfile; onEdit: () => void }) {
  return (
    <section aria-labelledby="you-h" className="card p-4" data-testid="shopper-card">
      <div className="flex items-center gap-2.5">
        <span className="step-num" aria-hidden="true">
          1
        </span>
        <h2 id="you-h" className="font-display text-[20px] font-semibold">
          Your photo, once
        </h2>
      </div>
      <div className="mt-3 flex gap-3">
        <img src={shopper.photo} alt={`${shopper.name}, full-body photo`} className="h-[112px] w-[84px] flex-none rounded-xl border border-line object-cover" data-testid="shopper-photo" />
        <div className="min-w-0">
          <p className="font-semibold">
            {shopper.name}
            {shopper.sample && <span className="ml-1.5 text-[12px] font-normal text-ink-3">(sample shopper)</span>}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-2">Usual: {summarize(profile) || "no measurements yet"}</p>
          <button type="button" className="mt-1.5 text-[13.5px] font-semibold text-denim underline underline-offset-2" onClick={onEdit} data-testid="open-profile">
            Edit measurements{app.mode === "live" ? " or photo" : ""}
          </button>
        </div>
      </div>
      <div role="group" aria-label="Choose shopper" className="mt-3 flex flex-wrap gap-1.5">
        {app.shoppers.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === shopper.id}
            onClick={() => app.setShopperId(s.id)}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-3 text-[13px] font-semibold ${s.id === shopper.id ? "border-ink bg-ink text-paper" : "border-line-2 text-ink-2 hover:text-ink"}`}
            data-testid={`shopper-${s.id}`}
          >
            <img src={s.photo} alt="" className="h-7 w-7 rounded-full object-cover object-top" />
            {s.name}
          </button>
        ))}
      </div>
      <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] text-ink-3">
        <LockIcon size={14} className="mt-0.5 flex-none" /> Stored only in this browser.
      </p>
    </section>
  );
}

function ListingsCard({ listings, selected, onSelect, onPaste }: { listings: Listing[]; selected: string; onSelect: (id: string) => void; onPaste: () => void }) {
  return (
    <section aria-labelledby="listings-h" className="card p-4" data-testid="listings-card">
      <div className="flex items-center gap-2.5">
        <span className="step-num" aria-hidden="true">
          2
        </span>
        <h2 id="listings-h" className="font-display text-[20px] font-semibold">
          Pick a listing
        </h2>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">One of a kind, photographed on a hanger, no returns.</p>
      <ul className="-mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible" aria-label="Listings">
        {listings.map((l) => (
          <li key={l.id} className="w-[230px] flex-none snap-start lg:w-auto">
            <button
              type="button"
              className="tag flex w-full items-center gap-3 p-2.5 pr-7 text-left"
              aria-pressed={l.id === selected}
              onClick={() => onSelect(l.id)}
              data-testid={`listing-${l.id}`}
            >
              <span className="tag-hole" aria-hidden="true" />
              <img src={l.photo} alt="" className="h-[60px] w-[60px] flex-none rounded-lg border border-line bg-white object-cover" />
              <span className="min-w-0">
                <span className="line-clamp-2 block font-semibold leading-tight">{l.title}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{l.seller}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="num text-[14px] font-medium">{l.price ? `$${l.price}` : ""}</span>
                  {l.facts?.final_sale === true && <span className="stamp">Final sale</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-ghost mt-3 w-full" onClick={onPaste} data-testid="paste-listing">
        <PlusIcon size={17} /> Paste a listing
      </button>
    </section>
  );
}

const CLOSET_TYPES: { value: GarmentType; label: string }[] = [
  { value: "dress", label: "Dress" },
  { value: "sweater", label: "Top or sweater" },
  { value: "jacket", label: "Jacket" },
  { value: "skirt", label: "Skirt or trousers (worn photo)" },
  { value: "sneakers", label: "Shoes" },
];

function ClosetCard({
  app,
  listing,
  shopper,
  selected,
  onSelect,
  canAdd,
}: {
  app: AppData;
  listing: Listing;
  shopper: Shopper;
  selected: string | null;
  onSelect: (id: string | null) => void;
  canAdd: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<GarmentType>("dress");
  const listingRoute = tryOnRouteFor(listing.facts?.garment_type ?? "other");
  const compatible = (c: ClosetItem) => {
    const r = tryOnRouteFor(c.garment_type);
    return r.layer !== listingRoute.layer;
  };
  const recorded = (c: ClosetItem) => Boolean(app.resultFor(shopper.id, listing.id, c.id).result);
  return (
    <section aria-labelledby="closet-h" className="card p-4" data-testid="closet-card">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="step-num" aria-hidden="true">
          4
        </span>
        <h2 id="closet-h" className="font-display text-[20px] font-semibold">
          Style it with what you own
        </h2>
        {app.saved.length > 0 && (
          <Link href="/compare" className="btn btn-ghost ml-auto min-h-[40px] text-[14px]" data-testid="go-compare">
            <CompareIcon size={17} /> Compare saved ({app.saved.length})
          </Link>
        )}
      </div>
      <p className="mt-1 text-[13px] text-ink-2">
        Pick a piece from your closet to see the whole outfit. YouCam dresses you in order: dress or bottoms first, then tops, jackets and shoes.
      </p>
      <div role="group" aria-label="Closet items" className="mt-3 flex flex-wrap gap-2.5">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={`flex min-h-[64px] items-center gap-2 rounded-xl border px-3 text-[14px] font-semibold ${selected === null ? "border-denim bg-denim-soft text-denim" : "border-line-2 text-ink-2"}`}
          data-testid="closet-none"
        >
          <HangerIcon size={20} /> Listing only
        </button>
        {app.closet.map((c) => {
          const ok = compatible(c);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected === c.id}
              disabled={!ok}
              onClick={() => onSelect(c.id)}
              className={`flex min-h-[64px] items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 text-left text-[14px] font-semibold disabled:opacity-45 ${selected === c.id ? "border-denim bg-denim-soft text-denim" : "border-line-2 text-ink"}`}
              data-testid={`closet-${c.id}`}
              title={ok ? undefined : "Same layer as the listing"}
            >
              <img src={c.photo} alt="" className="h-[52px] w-[52px] rounded-lg border border-line bg-white object-cover" />
              <span>
                {c.label}
                <span className="block text-[12px] font-normal text-ink-3">
                  {!ok ? "same layer as the listing" : recorded(c) ? (app.mode === "replay" ? "recorded outfit" : "ready") : app.mode === "replay" ? "not recorded" : "4 units"}
                </span>
              </span>
            </button>
          );
        })}
        {canAdd && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="flex min-h-[64px] items-center gap-2 rounded-xl border border-dashed border-line-2 px-3 text-[14px] font-semibold text-ink-2" data-testid="closet-add">
            <PlusIcon size={18} /> Add from your closet
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-3 grid gap-2 rounded-xl border border-line bg-paper p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="closet-label" className="block text-[13px] font-semibold">
              Name it
            </label>
            <input id="closet-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My green skirt" className="mt-1 h-11 w-full rounded-lg border border-line-2 bg-card px-2.5" />
          </div>
          <div>
            <label htmlFor="closet-type" className="block text-[13px] font-semibold">
              Type
            </label>
            <select id="closet-type" value={type} onChange={(e) => setType(e.target.value as GarmentType)} className="mt-1 h-11 w-full rounded-lg border border-line-2 bg-card px-2.5">
              {CLOSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <label className="btn btn-primary cursor-pointer">
            <UploadIcon size={17} /> Photo
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const photo = await fileToJpegDataUrl(f);
                const item: ClosetItem = { id: `c-${Date.now().toString(36)}`, label: label.trim() || "My piece", photo, garment_type: type };
                await app.addClosetItem(item);
                setAdding(false);
                setLabel("");
                onSelect(item.id);
              }}
            />
          </label>
        </div>
      )}
      {selected && (
        <p className="mt-2.5 text-[12.5px] text-ink-3" data-testid="outfit-order">
          Order: {layerOrder([{ route: listingRoute, n: listing.title }, ...app.closet.filter((c) => c.id === selected).map((c) => ({ route: tryOnRouteFor(c.garment_type), n: c.label }))])
            .map((x) => `${x.n} (${x.route.garment_category ?? x.route.endpoint})`)
            .join(", then ")}
        </p>
      )}
    </section>
  );
}

