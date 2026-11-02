"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CM_PER_IN } from "@/lib/fit-check";
import type { FitProfile, Shopper } from "@/lib/types";
import { fileToJpegDataUrl } from "@/lib/client/storage";
import { Dialog } from "./Dialog";
import { LockIcon, TrashIcon, UploadIcon } from "./icons";

type Cat = "jacket" | "top" | "dress" | "bottom" | "shoes";
const FIELDS: Record<Cat, { key: string; label: string; hint: string; size?: boolean }[]> = {
  jacket: [
    { key: "pit_to_pit", label: "Pit to pit", hint: "Straight across, armpit to armpit" },
    { key: "length", label: "Length", hint: "Collar seam to hem, at the back" },
    { key: "sleeve", label: "Sleeve", hint: "Shoulder seam to cuff" },
  ],
  top: [
    { key: "pit_to_pit", label: "Pit to pit", hint: "Straight across, armpit to armpit" },
    { key: "length", label: "Length", hint: "Top of shoulder to hem" },
    { key: "sleeve", label: "Sleeve", hint: "Shoulder seam to cuff" },
  ],
  dress: [
    { key: "pit_to_pit", label: "Pit to pit", hint: "Straight across, armpit to armpit" },
    { key: "waist_flat", label: "Waist, flat", hint: "Straight across the narrowest point" },
    { key: "length", label: "Length", hint: "Top of shoulder to hem" },
  ],
  bottom: [
    { key: "waist_flat", label: "Waist, flat", hint: "Straight across the waistband" },
    { key: "inseam", label: "Inseam", hint: "Crotch seam to hem" },
    { key: "rise", label: "Rise", hint: "Crotch seam to top of the waistband" },
  ],
  shoes: [
    { key: "shoe_size_us", label: "US size", hint: "Your usual size", size: true },
    { key: "insole", label: "Insole", hint: "Heel to toe inside the shoe" },
  ],
};
const CAT_LABEL: Record<Cat, string> = { jacket: "Jackets", top: "Tops", dress: "Dresses", bottom: "Bottoms", shoes: "Shoes" };
const PIECE: Record<Cat, string> = {
  jacket: "a jacket that fits you well",
  top: "a sweater or top that fits you well",
  dress: "a dress that fits you well",
  bottom: "trousers that fit you well",
  shoes: "shoes that fit you well",
};

type Props = {
  open: boolean;
  onClose: () => void;
  shopper: Shopper;
  profile: FitProfile;
  canUsePhoto: boolean;
  onSaveProfile: (p: FitProfile) => void;
  onReset: () => void;
  onUsePhoto: (dataUrl: string, name: string) => Promise<void>;
  onForget: () => void;
};

export function ProfileDialog(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} title={`${props.shopper.name}'s usual measurements`} testId="profile-dialog" wide>
      {/* Mounted only while open, so the draft starts from the saved profile each time. */}
      <ProfileEditor {...props} />
    </Dialog>
  );
}

function ProfileEditor({ onClose, shopper, profile, canUsePhoto, onSaveProfile, onReset, onUsePhoto, onForget }: Props) {
  const [draft, setDraft] = useState<FitProfile>(profile);
  const [cat, setCat] = useState<Cat>("jacket");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [name, setName] = useState("You");

  const u = draft.displayUnits;
  const show = (inches: number | undefined, size?: boolean) =>
    inches === undefined ? "" : size ? String(inches) : u === "cm" ? String(Math.round(inches * CM_PER_IN * 10) / 10) : String(inches);
  const parse = (s: string, size?: boolean) => {
    const n = parseFloat(s);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return size || u === "in" ? n : Math.round((n / CM_PER_IN) * 100) / 100;
  };

  return (
    <>
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div>
          <img src={shopper.photo} alt={`${shopper.name}'s photo`} className="aspect-[3/4] w-full rounded-xl border border-line object-cover" />
          <p className="mt-2 flex items-start gap-1.5 text-[13px] text-ink-2">
            <LockIcon size={15} className="mt-0.5 flex-none" /> Your photo and measurements stay in this browser. A photo leaves it only when you press Try it on in Live mode.
          </p>
          {canUsePhoto ? (
            <div className="mt-3 rounded-xl border border-line bg-paper p-3">
              <label className="block text-[13px] font-semibold" htmlFor="me-name">
                Use your own photo
              </label>
              <input id="me-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line-2 bg-card px-2.5" aria-label="Your name" />
              <label className="btn btn-ghost mt-2 w-full cursor-pointer">
                <UploadIcon size={17} /> Choose a full-body photo
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setPhotoError(null);
                      await onUsePhoto(await fileToJpegDataUrl(f), name.trim() || "You");
                    } catch (err) {
                      setPhotoError(err instanceof Error ? err.message : "Could not use that photo.");
                    }
                  }}
                  data-testid="upload-me"
                />
              </label>
              <p className="mt-1.5 text-[12px] text-ink-3">Standing, facing the camera, head to toe, plain background.</p>
              {photoError && (
                <p className="mt-1.5 text-[13px] text-flag" role="alert">
                  {photoError}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-ink-3">Live mode lets you use your own photo.</p>
          )}
        </div>

        <div>
          <p className="text-[15px] text-ink-2">
            Lay a piece you own that fits you well <strong className="text-ink">flat</strong> and measure it. Final Sale compares every listing against these.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Clothing type" className="flex flex-wrap gap-1.5">
              {(Object.keys(FIELDS) as Cat[]).map((c) => (
                <button
                  key={c}
                  role="tab"
                  type="button"
                  aria-selected={cat === c}
                  aria-controls="profile-fields"
                  onClick={() => setCat(c)}
                  className={`min-h-[36px] rounded-full border px-3 text-[13px] font-semibold ${cat === c ? "border-ink bg-ink text-paper" : "border-line-2 text-ink-2"}`}
                >
                  {CAT_LABEL[c]}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Units" className="ml-auto flex rounded-full border border-line-2 p-0.5 text-[13px] font-semibold">
              {(["in", "cm"] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={u === x}
                  onClick={() => setDraft({ ...draft, displayUnits: x })}
                  className={`min-h-[32px] rounded-full px-3 ${u === x ? "bg-denim text-white" : "text-ink-2"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <fieldset id="profile-fields" role="tabpanel" className="mt-4">
            <legend className="text-[14px] font-semibold">From {PIECE[cat]}</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {FIELDS[cat].map((f) => {
                const bucket = draft[cat] as Record<string, number | undefined>;
                const id = `f-${cat}-${f.key}`;
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className="block text-[14px] font-semibold">
                      {f.label} <span className="font-normal text-ink-3">{f.size ? "" : `(${u})`}</span>
                    </label>
                    <input
                      id={id}
                      inputMode="decimal"
                      value={show(bucket[f.key], f.size)}
                      onChange={(e) => setDraft({ ...draft, [cat]: { ...bucket, [f.key]: parse(e.target.value, f.size) } })}
                      className="num mt-1 h-11 w-full rounded-lg border border-line-2 bg-card px-3 text-[16px]"
                      aria-describedby={`${id}-hint`}
                      data-testid={`field-${cat}-${f.key}`}
                    />
                    <p id={`${id}-hint`} className="mt-1 text-[12.5px] text-ink-3">
                      {f.hint}
                    </p>
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onSaveProfile(draft);
                onClose();
              }}
              data-testid="save-profile"
            >
              Save measurements
            </button>
            {shopper.sample && (
              <button type="button" className="btn btn-ghost" onClick={() => { onReset(); onClose(); }}>
                Reset sample
              </button>
            )}
            <button type="button" className="btn btn-ghost ml-auto text-flag" onClick={onForget} data-testid="forget">
              <TrashIcon size={17} /> Delete everything I added
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
