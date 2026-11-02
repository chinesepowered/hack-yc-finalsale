"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RECORDED_TRYONS, REPLAY_CLOSET, REPLAY_LISTINGS, REPLAY_SHOPPERS, lookKey } from "@/data/replay";
import type { ClosetItem, FitProfile, Listing, Shopper, TryOnResult } from "@/lib/types";
import { idbClear, idbGet, idbSet, lsClear, lsGet, lsSet } from "./storage";

export type Mode = "replay" | "live";
export type SavedLook = { key: string; shopperId: string; listingId: string; closetId: string | null; savedAt: string };
export type ServerStatus = { live: { tryOn: boolean; reader: boolean }; units: { spent: number; budget: number } };

export function useAppData() {
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<Mode>("replay");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [me, setMeState] = useState<Shopper | null>(null);
  const [profiles, setProfiles] = useState<Record<string, FitProfile>>({});
  const [customListings, setCustomListings] = useState<Listing[]>([]);
  const [customCloset, setCustomCloset] = useState<ClosetItem[]>([]);
  const [liveResults, setLiveResults] = useState<Record<string, TryOnResult>>({});
  const [saved, setSavedState] = useState<SavedLook[]>([]);
  const [shopperId, setShopperIdState] = useState("maya");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [m, cl, cc, lr] = await Promise.all([
        idbGet<Shopper>("me"),
        idbGet<Listing[]>("listings"),
        idbGet<ClosetItem[]>("closet"),
        idbGet<Record<string, TryOnResult>>("results"),
      ]);
      if (!alive) return;
      setMeState(m ?? null);
      setCustomListings(cl ?? []);
      setCustomCloset(cc ?? []);
      setLiveResults(lr ?? {});
      setProfiles(lsGet("profiles", {}));
      setSavedState(lsGet("saved", []));
      const wanted = lsGet<Mode>("mode", "replay");
      setShopperIdState(new URLSearchParams(window.location.search).get("shopper") || lsGet("shopper", "maya"));
      try {
        const s = (await (await fetch("/api/status", { cache: "no-store" })).json()) as ServerStatus;
        if (!alive) return;
        setStatus(s);
        setModeState(wanted === "live" && s.live.tryOn && s.live.reader ? "live" : "replay");
      } catch {
        setModeState("replay");
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    lsSet("mode", m);
  }, []);

  const shoppers = useMemo(() => (me ? [...REPLAY_SHOPPERS, me] : REPLAY_SHOPPERS), [me]);
  const listings = useMemo(() => [...REPLAY_LISTINGS, ...customListings], [customListings]);
  const closet = useMemo(() => [...REPLAY_CLOSET, ...customCloset], [customCloset]);

  const setShopperId = useCallback((id: string) => {
    setShopperIdState(id);
    lsSet("shopper", id);
  }, []);

  const profileFor = useCallback(
    (s: Shopper | undefined) => (s ? (profiles[s.id] ?? s.profile) : undefined),
    [profiles],
  );

  const saveProfile = useCallback((id: string, p: FitProfile) => {
    setProfiles((prev) => {
      const next = { ...prev, [id]: p };
      lsSet("profiles", next);
      return next;
    });
  }, []);

  const resetProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[id];
      lsSet("profiles", next);
      return next;
    });
  }, []);

  const setMe = useCallback(async (s: Shopper) => {
    setMeState(s);
    await idbSet("me", s);
  }, []);

  const addListing = useCallback(async (l: Listing) => {
    setCustomListings((prev) => {
      const next = [...prev.filter((x) => x.id !== l.id), l];
      void idbSet("listings", next);
      return next;
    });
  }, []);

  const addClosetItem = useCallback(async (c: ClosetItem) => {
    setCustomCloset((prev) => {
      const next = [...prev, c];
      void idbSet("closet", next);
      return next;
    });
  }, []);

  const putResult = useCallback(async (key: string, r: TryOnResult) => {
    setLiveResults((prev) => {
      const next = { ...prev, [key]: r };
      void idbSet("results", next);
      return next;
    });
  }, []);

  /** Live results first, then the recorded run. */
  const resultFor = useCallback(
    (shopper: string, listing: string, closetItem: string | null) => {
      const key = lookKey(shopper, listing, closetItem);
      const live = liveResults[key];
      if (live) return { result: live, source: "live" as const, key };
      const rec = RECORDED_TRYONS[key];
      if (rec) return { result: rec, source: "recorded" as const, key };
      return { result: null, source: null, key };
    },
    [liveResults],
  );

  const toggleSaved = useCallback((look: Omit<SavedLook, "savedAt">) => {
    setSavedState((prev) => {
      const exists = prev.some((s) => s.key === look.key);
      const next = exists ? prev.filter((s) => s.key !== look.key) : [...prev, { ...look, savedAt: new Date().toISOString() }];
      lsSet("saved", next);
      return next;
    });
  }, []);

  const forgetEverything = useCallback(async () => {
    await idbClear();
    lsClear();
    setMeState(null);
    setProfiles({});
    setCustomListings([]);
    setCustomCloset([]);
    setLiveResults({});
    setSavedState([]);
    setShopperIdState("maya");
    setModeState("replay");
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus((await (await fetch("/api/status", { cache: "no-store" })).json()) as ServerStatus);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    ready,
    mode,
    setMode,
    status,
    refreshStatus,
    shoppers,
    shopperId,
    setShopperId,
    profileFor,
    saveProfile,
    resetProfile,
    me,
    setMe,
    listings,
    addListing,
    closet,
    addClosetItem,
    resultFor,
    putResult,
    saved,
    toggleSaved,
    forgetEverything,
  };
}

export type AppData = ReturnType<typeof useAppData>;
