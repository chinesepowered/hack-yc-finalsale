import { z } from "zod";
import { GARMENT_TYPES, MEASUREMENT_NAMES, type ListingFacts } from "./types";

const quote = z.string().max(400);

export const listingFactsSchema = z.object({
  title: z.string().max(160),
  garment_type: z.enum(GARMENT_TYPES),
  size_label: z.string().max(40).nullable(),
  era: z.string().max(40).nullable(),
  fabric: z.string().max(120).nullable(),
  has_stretch: z.boolean().nullable(),
  price: z.number().nullable(),
  currency: z.string().max(8).nullable(),
  final_sale: z.boolean().nullable(),
  measurements: z
    .array(
      z.object({
        name: z.enum(MEASUREMENT_NAMES),
        value: z.number(),
        unit: z.enum(["in", "cm", "size"]),
        quote,
      }),
    )
    .max(20),
  flaws: z
    .array(z.object({ text: z.string().max(200), severity: z.enum(["minor", "moderate", "major"]), quote }))
    .max(12),
  fit_notes: z.array(z.object({ text: z.string().max(200), quote })).max(8),
  photo_notes: z.array(z.string().max(200)).max(6),
  photo_garment_type: z.enum(GARMENT_TYPES).nullable(),
}) satisfies z.ZodType<ListingFacts>;

const nullable = (t: string) => ({ type: [t, "null"] });

/** JSON schema sent to the OpenAI-compatible endpoint for strict decoding. */
export const listingFactsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "garment_type",
    "size_label",
    "era",
    "fabric",
    "has_stretch",
    "price",
    "currency",
    "final_sale",
    "measurements",
    "flaws",
    "fit_notes",
    "photo_notes",
    "photo_garment_type",
  ],
  properties: {
    title: { type: "string" },
    garment_type: { type: "string", enum: [...GARMENT_TYPES] },
    size_label: nullable("string"),
    era: nullable("string"),
    fabric: nullable("string"),
    has_stretch: nullable("boolean"),
    price: nullable("number"),
    currency: nullable("string"),
    final_sale: nullable("boolean"),
    measurements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value", "unit", "quote"],
        properties: {
          name: { type: "string", enum: [...MEASUREMENT_NAMES] },
          value: { type: "number" },
          unit: { type: "string", enum: ["in", "cm", "size"] },
          quote: { type: "string" },
        },
      },
    },
    flaws: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "severity", "quote"],
        properties: {
          text: { type: "string" },
          severity: { type: "string", enum: ["minor", "moderate", "major"] },
          quote: { type: "string" },
        },
      },
    },
    fit_notes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "quote"],
        properties: { text: { type: "string" }, quote: { type: "string" } },
      },
    },
    photo_notes: { type: "array", items: { type: "string" } },
    photo_garment_type: { type: ["string", "null"], enum: [...GARMENT_TYPES, null] },
  },
} as const;

export const LISTING_READER_PROMPT = `You read secondhand clothing listings for a shopper who cannot return the item.
Extract only what the listing text states. Never guess or invent numbers.
- title: the short item name without size, condition or seller notes, e.g. "90s washed denim jacket".

Rules:
- measurements: one entry per measurement the seller gives. Use the unit the seller used ("in" or "cm"; "size" for shoe sizes).
  Names: pit_to_pit (armpit to armpit, measured flat), chest_around (full chest circumference), length (top of shoulder or collar to hem),
  sleeve, shoulder (seam to seam), waist_flat, waist_around, hip_flat, hip_around, inseam, rise, insole, shoe_size_us, shoe_size_eu,
  shoe_size_uk, heel_height, shaft_height. If the seller says "chest 42" with no "pit to pit" or "flat", it is chest_around.
  A bare clothing size label like "M" is size_label, not a measurement. Shoe sizes go in both places: size_label and a
  shoe_size_us, shoe_size_eu or shoe_size_uk measurement with unit "size".
- quote: copy the exact words from the listing, character for character, that contain the fact (for measurements include the number).
- flaws: every defect, wear, stain, hole, repair, odor, pilling, fading or missing part the seller mentions. severity: minor (small or
  cosmetic), moderate (visible when worn), major (damage that needs repair).
- fit_notes: what the seller says about fit, e.g. "runs small", "fits like a modern S", "oversized".
- final_sale: true if the listing says final sale, no returns or all sales final; false if it offers returns; null if it says nothing.
- era: the decade if stated (e.g. "1990s"), else null. fabric: as stated, else null. has_stretch: true only if the fabric includes
  elastane, spandex, lycra or the seller says it stretches.
- price as a number without the symbol; currency as a code like USD.
- photo_notes: only if a photo is attached. Up to 3 short notes about what the photo shows or hides for a buyer (for example
  "photographed on a hanger, so drape and length are hard to judge"). No measurements. Empty array if no photo.
- photo_garment_type: the garment type the photo shows, or null if no photo.
Reply with JSON only.`;
