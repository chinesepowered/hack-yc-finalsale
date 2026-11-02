// "Replay of a recorded run": real YouCam and listing-reader results, recorded once with
// scripts/record-*.mjs through this app's own API routes, so judges can click through without keys.
import type { ListingFacts, ReaderMeta, TryOnResult } from "@/lib/types";
import { SAMPLE_CLOSET, SAMPLE_LISTINGS, SAMPLE_SHOPPERS } from "./demo";
import listingFixtures from "./fixtures/listings.json";
import tryOnFixtures from "./fixtures/tryons.json";

const readings = listingFixtures as unknown as Record<string, { facts: ListingFacts; meta: ReaderMeta }>;
export const RECORDED_TRYONS = tryOnFixtures as unknown as Record<string, TryOnResult>;

export const REPLAY_LISTINGS = SAMPLE_LISTINGS.map((l) => ({
  ...l,
  facts: readings[l.id]?.facts,
  readerMeta: readings[l.id]?.meta,
}));
export const REPLAY_SHOPPERS = SAMPLE_SHOPPERS;
export const REPLAY_CLOSET = SAMPLE_CLOSET;

export function lookKey(shopperId: string, listingId: string, closetId: string | null | undefined) {
  return `${shopperId}|${listingId}|${closetId ?? ""}`;
}
