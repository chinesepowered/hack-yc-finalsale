// Shared types for the browser and the server.

export const GARMENT_TYPES = [
  "jacket",
  "coat",
  "vest",
  "sweater",
  "cardigan",
  "top",
  "shirt",
  "tshirt",
  "blouse",
  "dress",
  "jumpsuit",
  "skirt",
  "pants",
  "jeans",
  "shorts",
  "shoes",
  "boots",
  "sneakers",
  "sandals",
  "bag",
  "other",
] as const;
export type GarmentType = (typeof GARMENT_TYPES)[number];

export const MEASUREMENT_NAMES = [
  "pit_to_pit",
  "chest_around",
  "length",
  "sleeve",
  "shoulder",
  "waist_flat",
  "waist_around",
  "hip_flat",
  "hip_around",
  "inseam",
  "rise",
  "insole",
  "shoe_size_us",
  "shoe_size_eu",
  "shoe_size_uk",
  "heel_height",
  "shaft_height",
] as const;
export type MeasurementName = (typeof MEASUREMENT_NAMES)[number];

export type MeasurementUnit = "in" | "cm" | "size";

export type ExtractedMeasurement = {
  name: MeasurementName;
  value: number;
  unit: MeasurementUnit;
  /** Exact words from the listing that state this measurement. */
  quote: string;
};

export type ExtractedFlaw = {
  text: string;
  severity: "minor" | "moderate" | "major";
  quote: string;
};

export type ExtractedNote = { text: string; quote: string };

/** What the listing reader (an LLM) extracts. Every fact carries a quote so code can verify it. */
export type ListingFacts = {
  title: string;
  garment_type: GarmentType;
  size_label: string | null;
  era: string | null;
  fabric: string | null;
  has_stretch: boolean | null;
  price: number | null;
  currency: string | null;
  final_sale: boolean | null;
  measurements: ExtractedMeasurement[];
  flaws: ExtractedFlaw[];
  fit_notes: ExtractedNote[];
  /** Observations from the garment photo only (no measurements). */
  photo_notes: string[];
  /** The garment type the photo shows, if a photo was sent. */
  photo_garment_type: GarmentType | null;
};

export type ReaderMeta = {
  model_label: string;
  ms: number;
  used_photo: boolean;
  recorded_at?: string;
};

/** The shopper's usual measurements, taken flat from clothes that already fit them. Stored in inches. */
export type FitProfile = {
  displayUnits: "in" | "cm";
  jacket: { pit_to_pit?: number; length?: number; sleeve?: number; shoulder?: number };
  top: { pit_to_pit?: number; length?: number; sleeve?: number; shoulder?: number };
  dress: { pit_to_pit?: number; waist_flat?: number; length?: number };
  bottom: { waist_flat?: number; inseam?: number; rise?: number; hip_flat?: number };
  shoes: { shoe_size_us?: number; insole?: number };
};

export type FitCategory = "jacket" | "top" | "dress" | "bottom" | "shoes" | "bag" | "other";

export type FindingLevel = "ok" | "note" | "flag";

export type Finding = {
  id: string;
  kind: "measure" | "missing" | "flaw" | "policy" | "label" | "seller" | "fabric" | "photo";
  level: FindingLevel;
  title: string;
  detail?: string;
  quote?: string;
  /** For measurement findings that compare with the profile: values in inches, or US sizes. */
  compare?: { listed: number; usual: number; isSize: boolean; label: string };
};

export type FitCheck = {
  category: FitCategory;
  findings: Finding[];
  flags: number;
  notes: number;
  compared: number;
  keyTotal: number;
  missing: string[];
  dropped: number;
  askSeller: string | null;
};

export type YouCamEndpoint = "cloth-v4" | "shoes-transfer" | "bag";
export type GarmentCategory = "upper_body" | "lower_body" | "full_body" | "outer" | "shoes" | "auto";

export type TryOnRoute = {
  endpoint: YouCamEndpoint;
  garment_category?: GarmentCategory;
  /** Lower number goes on first when two garments are layered. */
  layer: number;
  label: string;
};

/** One YouCam call as the app shows it in the API trace. */
export type TraceStep = {
  endpoint: YouCamEndpoint;
  garment_category?: GarmentCategory;
  garment_label: string;
  task_id_hint: string;
  polls: number;
  ms: number;
  units: number;
  cached: boolean;
  calls: string[];
};

export type TryOnResult = {
  image: string;
  trace: TraceStep[];
  recorded_at?: string;
};

export type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  seller: string;
  location: string;
  photo: string;
  text: string;
  facts?: ListingFacts;
  readerMeta?: ReaderMeta;
  sample?: boolean;
};

export type ClosetItem = {
  id: string;
  label: string;
  photo: string;
  garment_type: GarmentType;
  sample?: boolean;
};

export type Shopper = {
  id: string;
  name: string;
  photo: string;
  profile: FitProfile;
  sample?: boolean;
  credit?: string;
};
