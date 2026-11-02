import { readListing, ReaderError } from "@/lib/server/llm";
import { BadImage, loadImage, toDataUrl } from "@/lib/server/images";
import { cacheGet, cacheSet, hashKey } from "@/lib/server/store";
import type { ListingFacts, ReaderMeta } from "@/lib/types";

export const maxDuration = 120;

type Cached = { facts: ListingFacts; meta: ReaderMeta };

export async function POST(req: Request) {
  let body: { text?: unknown; photo?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 20) return Response.json({ error: "Paste the full listing text (title and description)." }, { status: 400 });
  if (text.length > 6000) return Response.json({ error: "That listing is too long. Paste just the title and description." }, { status: 400 });

  let photo: string | undefined;
  try {
    if (body.photo) {
      const img = await loadImage(body.photo);
      photo = toDataUrl(img.bytes, img.type);
    }
  } catch (e) {
    return Response.json({ error: e instanceof BadImage ? e.message : "Could not read that photo." }, { status: 400 });
  }

  const key = hashKey("reader-v1", process.env.OPENAI_MODEL ?? "", text, photo ?? "");
  const hit = await cacheGet<Cached>("reader", key);
  if (hit) return Response.json({ ...hit, cached: true });

  try {
    const { facts, ms } = await readListing(text, photo);
    const out: Cached = {
      facts,
      meta: { model_label: "Open-weights LLM listing reader", ms, used_photo: Boolean(photo), recorded_at: new Date().toISOString() },
    };
    await cacheSet("reader", key, out);
    return Response.json({ ...out, cached: false });
  } catch (e) {
    if (e instanceof ReaderError) return Response.json({ error: e.message }, { status: e.status });
    console.error("read-listing failed", e instanceof Error ? e.message : "unknown");
    return Response.json({ error: "The listing reader is unavailable right now. Try again." }, { status: 502 });
  }
}
