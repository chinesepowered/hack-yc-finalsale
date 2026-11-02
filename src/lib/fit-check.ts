// Deterministic "final sale check". The LLM only extracts facts with quotes; this file decides.
// Nothing here calls a model, so the same listing and profile always give the same answer.

import type {
  ExtractedMeasurement,
  FitCategory,
  FitCheck,
  FitProfile,
  Finding,
  FindingLevel,
  GarmentType,
  ListingFacts,
  MeasurementName,
} from "./types";

export const CM_PER_IN = 2.54;

export function categoryFor(type: GarmentType): FitCategory {
  switch (type) {
    case "jacket":
    case "coat":
    case "vest":
      return "jacket";
    case "sweater":
    case "cardigan":
    case "top":
    case "shirt":
    case "tshirt":
    case "blouse":
      return "top";
    case "dress":
    case "jumpsuit":
      return "dress";
    case "skirt":
    case "pants":
    case "jeans":
    case "shorts":
      return "bottom";
    case "shoes":
    case "boots":
    case "sneakers":
    case "sandals":
      return "shoes";
    case "bag":
      return "bag";
    default:
      return "other";
  }
}

/** Measurements a buyer needs before committing, per category. */
export const KEY_MEASUREMENTS: Record<FitCategory, MeasurementName[]> = {
  jacket: ["pit_to_pit", "length", "sleeve"],
  top: ["pit_to_pit", "length"],
  dress: ["pit_to_pit", "waist_flat", "length"],
  bottom: ["waist_flat", "inseam", "rise"],
  shoes: ["shoe_size_us"],
  bag: [],
  other: [],
};

export const MEASUREMENT_LABEL: Record<MeasurementName, string> = {
  pit_to_pit: "Pit to pit",
  chest_around: "Chest (all round)",
  length: "Length",
  sleeve: "Sleeve",
  shoulder: "Shoulder",
  waist_flat: "Waist (flat)",
  waist_around: "Waist (all round)",
  hip_flat: "Hip (flat)",
  hip_around: "Hip (all round)",
  inseam: "Inseam",
  rise: "Rise",
  insole: "Insole",
  shoe_size_us: "Shoe size (US)",
  shoe_size_eu: "Shoe size (EU)",
  shoe_size_uk: "Shoe size (UK)",
  heel_height: "Heel height",
  shaft_height: "Shaft height",
};

/** [ok below, note below, flag at or above], in inches (or sizes for shoe sizes). */
const TOLERANCE: Partial<Record<MeasurementName, [number, number]>> = {
  pit_to_pit: [0.75, 1.5],
  length: [1, 2],
  sleeve: [1, 2],
  shoulder: [0.75, 1.5],
  waist_flat: [0.5, 1],
  hip_flat: [0.75, 1.5],
  inseam: [1, 2],
  rise: [0.75, 1.25],
  insole: [0.2, 0.4],
  shoe_size_us: [0.5, 1],
};

const SMALLER: Partial<Record<MeasurementName, string>> = {
  pit_to_pit: "narrower than yours, so it may be snug across the chest",
  length: "shorter than yours",
  sleeve: "shorter in the sleeve than yours",
  shoulder: "narrower in the shoulders than yours",
  waist_flat: "smaller in the waist than yours",
  hip_flat: "smaller in the hip than yours",
  inseam: "shorter in the leg than yours",
  rise: "lower in the rise than yours",
  insole: "shorter inside than yours",
  shoe_size_us: "smaller than your size",
};
const LARGER: Partial<Record<MeasurementName, string>> = {
  pit_to_pit: "wider than yours, so it will sit roomier",
  length: "longer than yours",
  sleeve: "longer in the sleeve than yours",
  shoulder: "wider in the shoulders than yours",
  waist_flat: "bigger in the waist than yours",
  hip_flat: "bigger in the hip than yours",
  inseam: "longer in the leg than yours",
  rise: "higher in the rise than yours",
  insole: "longer inside than yours",
  shoe_size_us: "bigger than your size",
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’“”"'`]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();

/** True when the quote really appears in the listing text (ignoring case, quotes and spacing). */
export function isGrounded(quote: string, text: string): boolean {
  const q = norm(quote);
  if (!q) return false;
  return norm(text).includes(q);
}

function numberAppears(value: number, quote: string): boolean {
  const nums = (quote.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g) ?? []).map((n) => {
    if (n.includes("/")) {
      const [a, b] = n.split("/").map((x) => parseFloat(x.trim()));
      return b ? a / b : a;
    }
    return parseFloat(n.replace(",", "."));
  });
  const halves = quote.match(/(\d+)\s*(?:1\/2|½)/);
  if (halves) nums.push(parseInt(halves[1], 10) + 0.5);
  return nums.some((n) => Math.abs(n - value) < 0.051);
}

type Normalized = { name: MeasurementName; inches: number; note?: string; source: ExtractedMeasurement };

/** Convert to inches and to flat measurements, so they compare with the profile. */
export function normalizeMeasurement(m: ExtractedMeasurement): Normalized | null {
  if (m.unit === "size") {
    if (m.name === "shoe_size_us") return { name: m.name, inches: m.value, source: m };
    if (m.name === "shoe_size_eu") {
      // Approximate EU to US women's conversion, only used when no US size is listed.
      return { name: "shoe_size_us", inches: Math.round((m.value - 31) * 2) / 2, note: `EU ${m.value} read as about US ${Math.round((m.value - 31) * 2) / 2}`, source: m };
    }
    if (m.name === "shoe_size_uk") {
      return { name: "shoe_size_us", inches: m.value + 2, note: `UK ${m.value} read as about US ${m.value + 2}`, source: m };
    }
    return null;
  }
  const inches = m.unit === "cm" ? m.value / CM_PER_IN : m.value;
  if (m.name === "chest_around") return { name: "pit_to_pit", inches: inches / 2, note: `Listed as ${fmtRaw(m)} all round, halved to compare flat`, source: m };
  if (m.name === "waist_around") return { name: "waist_flat", inches: inches / 2, note: `Listed as ${fmtRaw(m)} all round, halved to compare flat`, source: m };
  if (m.name === "hip_around") return { name: "hip_flat", inches: inches / 2, note: `Listed as ${fmtRaw(m)} all round, halved to compare flat`, source: m };
  return { name: m.name, inches, source: m };
}

function fmtRaw(m: ExtractedMeasurement) {
  return m.unit === "size" ? `${m.value}` : `${m.value} ${m.unit}`;
}

export function fmtLength(inches: number, units: "in" | "cm"): string {
  if (units === "cm") return `${Math.round(inches * CM_PER_IN)} cm`;
  const r = Math.round(inches * 4) / 4;
  return `${Number.isInteger(r) ? r : r.toFixed(2).replace(/0$/, "")} in`;
}

function fmtValue(name: MeasurementName, inches: number, units: "in" | "cm") {
  return name === "shoe_size_us" ? `US ${inches}` : fmtLength(inches, units);
}

function fmtDiff(name: MeasurementName, diff: number, units: "in" | "cm") {
  const d = Math.abs(diff);
  if (name === "shoe_size_us") return `${d} size${d === 1 ? "" : "s"}`;
  return fmtLength(d, units);
}

function profileValue(profile: FitProfile, category: FitCategory, name: MeasurementName): number | undefined {
  const bucket = (profile as unknown as Record<string, Record<string, number | undefined>>)[category];
  return bucket ? bucket[name] : undefined;
}

const PROFILE_PIECE: Record<FitCategory, string> = {
  jacket: "a jacket that fits you",
  top: "a top that fits you",
  dress: "a dress that fits you",
  bottom: "trousers that fit you",
  shoes: "your usual shoes",
  bag: "",
  other: "",
};

export function runFitCheck(facts: ListingFacts, listingText: string, profile: FitProfile): FitCheck {
  const units = profile.displayUnits;
  const category = categoryFor(facts.garment_type);
  const findings: Finding[] = [];
  let dropped = 0;

  // 1. Keep only measurements whose quote is in the listing and contains the number.
  const grounded: Normalized[] = [];
  for (const m of facts.measurements) {
    if (!isGrounded(m.quote, listingText) || !numberAppears(m.value, m.quote)) {
      dropped++;
      continue;
    }
    const n = normalizeMeasurement(m);
    if (n) grounded.push(n);
  }
  // Prefer a direct measurement over one derived from a circumference.
  const byName = new Map<MeasurementName, Normalized>();
  for (const n of grounded) {
    const prev = byName.get(n.name);
    if (!prev || (prev.note && !n.note)) byName.set(n.name, n);
  }

  // 2. Compare with the shopper's usual measurements.
  let compared = 0;
  const stretch = facts.has_stretch === true;
  for (const [name, n] of byName) {
    const usual = profileValue(profile, category, name);
    const tol = TOLERANCE[name];
    const listed = fmtValue(name, n.inches, units);
    if (usual === undefined || !tol) {
      findings.push({
        id: `m-${name}`,
        kind: "measure",
        level: "ok",
        title: `${MEASUREMENT_LABEL[name]}: ${listed}`,
        detail: n.note ?? (usual === undefined && tol ? "Add this to your profile to compare it." : undefined),
        quote: n.source.quote,
      });
      continue;
    }
    compared++;
    const diff = n.inches - usual;
    let [okBelow, flagAt] = tol;
    if (stretch && diff < 0 && (name === "pit_to_pit" || name === "waist_flat" || name === "hip_flat")) {
      okBelow += 0.5;
      flagAt += 0.5;
    }
    const ad = Math.abs(diff);
    const level: FindingLevel = ad < okBelow ? "ok" : ad < flagAt ? "note" : "flag";
    const yours = fmtValue(name, usual, units);
    let title: string;
    if (level === "ok") title = `${MEASUREMENT_LABEL[name]} ${listed}, your usual is ${yours}: a match`;
    else title = `${MEASUREMENT_LABEL[name]} ${listed}, your usual is ${yours}`;
    const detailParts: string[] = [];
    if (level !== "ok") detailParts.push(`${fmtDiff(name, diff, units)} ${diff < 0 ? SMALLER[name] : LARGER[name]}.`);
    if (n.note) detailParts.push(`${n.note}.`);
    if (stretch && diff < 0 && level !== "flag" && (name === "pit_to_pit" || name === "waist_flat" || name === "hip_flat")) {
      detailParts.push("The fabric has stretch, which helps.");
    }
    findings.push({
      id: `m-${name}`,
      kind: "measure",
      level,
      title,
      detail: detailParts.join(" ") || undefined,
      quote: n.source.quote,
    });
  }

  // 3. Key measurements the seller did not give.
  const key = KEY_MEASUREMENTS[category];
  const missing = key.filter((k) => !byName.has(k));
  for (const k of missing) {
    findings.push({
      id: `missing-${k}`,
      kind: "missing",
      level: "note",
      title: `Not listed: ${MEASUREMENT_LABEL[k].toLowerCase()}`,
      detail: "The photo can't tell you this. Ask the seller before you buy.",
    });
  }

  // 4. Flaws the seller mentions.
  for (const [i, f] of facts.flaws.entries()) {
    if (!isGrounded(f.quote, listingText)) {
      dropped++;
      continue;
    }
    findings.push({
      id: `flaw-${i}`,
      kind: "flaw",
      level: f.severity === "minor" ? "note" : "flag",
      title: `Seller mentions: ${lowerFirst(f.text)}`,
      detail:
        f.severity === "major"
          ? "Needs repair. Price it in before you commit."
          : f.severity === "moderate"
            ? "Likely visible when worn. The try-on can't show it."
            : "Small, but the try-on can't show it.",
      quote: f.quote,
    });
  }

  // 5. What the seller says about fit.
  for (const [i, note] of facts.fit_notes.entries()) {
    if (!isGrounded(note.quote, listingText)) {
      dropped++;
      continue;
    }
    findings.push({ id: `seller-${i}`, kind: "seller", level: "note", title: `Seller says: ${lowerFirst(note.text)}`, quote: note.quote });
  }

  // 6. Vintage size labels.
  const decade = facts.era ? parseInt(facts.era.replace(/[^0-9]/g, "").slice(0, 4), 10) : NaN;
  if (facts.size_label && !Number.isNaN(decade) && decade > 1900 && decade < 2005) {
    findings.push({
      id: "label",
      kind: "label",
      level: "note",
      title: `Size label "${facts.size_label}" from the ${facts.era}`,
      detail: "Size labels have changed over the decades. Go by the measurements, not the tag.",
    });
  }

  // 7. Return policy.
  if (facts.final_sale === true) {
    findings.push({
      id: "policy",
      kind: "policy",
      level: "note",
      title: "Final sale: no returns",
      detail: "Decide on the measurements, not the photo.",
    });
  } else if (facts.final_sale === null) {
    findings.push({
      id: "policy",
      kind: "policy",
      level: "note",
      title: "Return policy not stated",
      detail: "Assume it is final sale and ask the seller.",
    });
  }

  // 8. Fabric, for context.
  if (facts.fabric) {
    findings.push({ id: "fabric", kind: "fabric", level: "ok", title: `Fabric: ${facts.fabric}`, detail: stretch ? "Has some stretch." : undefined });
  }

  for (const [i, p] of facts.photo_notes.entries()) {
    findings.push({ id: `photo-${i}`, kind: "photo", level: "ok", title: p });
  }

  const order: Record<FindingLevel, number> = { flag: 0, note: 1, ok: 2 };
  const kindOrder: Record<Finding["kind"], number> = { measure: 0, flaw: 1, missing: 2, seller: 3, label: 4, policy: 5, fabric: 6, photo: 7 };
  findings.sort((a, b) => order[a.level] - order[b.level] || kindOrder[a.kind] - kindOrder[b.kind]);

  const flags = findings.filter((f) => f.level === "flag").length;
  const notes = findings.filter((f) => f.level === "note").length;

  return {
    category,
    findings,
    flags,
    notes,
    compared,
    keyTotal: key.length,
    missing: missing.map((m) => MEASUREMENT_LABEL[m].toLowerCase()),
    dropped,
    askSeller: buildSellerMessage(facts, missing, category, profile),
  };
}

function lowerFirst(s: string) {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

function buildSellerMessage(facts: ListingFacts, missing: MeasurementName[], category: FitCategory, profile: FitProfile): string | null {
  const asks: string[] = [];
  const units = profile.displayUnits === "cm" ? "cm" : "inches";
  if (missing.length) {
    const names = missing.map((m) => MEASUREMENT_LABEL[m].toLowerCase().replace(" (us)", ""));
    asks.push(`could you measure the ${joinList(names)} with it laid flat, in ${units}?`);
  }
  if (facts.flaws.length) asks.push("could you add a close-up photo of the flaw you mention?");
  if (facts.final_sale === null) asks.push("do you accept returns if it doesn't fit?");
  if (!asks.length) return null;
  const first = asks[0];
  const rest = asks.slice(1).map((a) => a[0].toUpperCase() + a.slice(1));
  return [`Hi! I'm interested in your ${facts.title.toLowerCase()}. Before I buy, ${first}`, ...rest, "Thank you!"].join(" ");
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function profilePieceLabel(category: FitCategory) {
  return PROFILE_PIECE[category];
}
