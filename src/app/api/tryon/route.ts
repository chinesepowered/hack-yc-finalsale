import { BadImage, loadImage, toDataUrl } from "@/lib/server/images";
import { addUnits, cacheGet, cacheSet, hashKey, readLedger, serialize, unitBudget } from "@/lib/server/store";
import { sniffType, tryOnChain, UNIT_COST, YouCamError, type ChainStep } from "@/lib/server/youcam";
import type { GarmentCategory, TraceStep, YouCamEndpoint } from "@/lib/types";

export const maxDuration = 300;

const ENDPOINTS: YouCamEndpoint[] = ["cloth-v4", "shoes-transfer", "bag"];
const CATEGORIES: GarmentCategory[] = ["upper_body", "lower_body", "full_body", "outer", "shoes", "auto"];

type Cached = { image: string; trace: TraceStep[]; recorded_at: string };

export async function POST(req: Request) {
  let body: { person?: unknown; steps?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (!Array.isArray(body.steps) || body.steps.length < 1 || body.steps.length > 2) {
    return Response.json({ error: "Send one garment, or two to layer an outfit." }, { status: 400 });
  }

  let person;
  const steps: ChainStep[] = [];
  try {
    person = await loadImage(body.person);
    for (const raw of body.steps as Record<string, unknown>[]) {
      const endpoint = raw.endpoint as YouCamEndpoint;
      if (!ENDPOINTS.includes(endpoint)) return Response.json({ error: "Unknown try-on type." }, { status: 400 });
      const cat = raw.garment_category as GarmentCategory | undefined;
      if (endpoint === "cloth-v4" && (!cat || !CATEGORIES.includes(cat))) {
        return Response.json({ error: "Missing garment category." }, { status: 400 });
      }
      const g = await loadImage(raw.garment);
      steps.push({
        garment: g.bytes,
        garmentType: g.type,
        endpoint,
        garment_category: endpoint === "cloth-v4" ? cat : undefined,
        label: typeof raw.label === "string" ? raw.label.slice(0, 80) : "Garment",
        gender: raw.gender === "male" ? "male" : "female",
      });
    }
  } catch (e) {
    return Response.json({ error: e instanceof BadImage ? e.message : "Could not read an image." }, { status: 400 });
  }

  // Same photos and garments: serve the earlier result and spend nothing.
  const key = hashKey(
    "tryon-v1",
    person.bytes,
    ...steps.flatMap((s) => [s.endpoint, s.garment_category ?? "", s.garment]),
  );
  const hit = await cacheGet<Cached>("tryon", key);
  if (hit) {
    return Response.json({ ...hit, trace: hit.trace.map((t) => ({ ...t, cached: true, units: 0 })), cached: true });
  }

  const cost = steps.reduce((n, s) => n + UNIT_COST[s.endpoint], 0);

  try {
    const result = await serialize(async () => {
      const ledger = await readLedger();
      const budget = unitBudget();
      if (ledger.spent + cost > budget) {
        throw new YouCamError(
          `This server's YouCam budget is used up (${ledger.spent} of ${budget} units). Replay mode still works.`,
          "budget",
          429,
        );
      }
      return tryOnChain(person.bytes, person.type, steps, async (units) => {
        await addUnits(units);
      });
    });
    const out: Cached = {
      image: toDataUrl(result.image, sniffType(result.image)),
      trace: result.trace,
      recorded_at: new Date().toISOString(),
    };
    await cacheSet("tryon", key, out);
    const ledger = await readLedger();
    return Response.json({ ...out, cached: false, units: { spent: ledger.spent, budget: unitBudget() } });
  } catch (e) {
    if (e instanceof YouCamError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
    console.error("tryon failed", e instanceof Error ? e.message : "unknown");
    return Response.json({ error: "The try-on failed. Try again." }, { status: 502 });
  }
}
