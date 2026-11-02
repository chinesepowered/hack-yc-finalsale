import "server-only";
import type { GarmentCategory, TraceStep, YouCamEndpoint } from "@/lib/types";

const BASE = "https://yce-api-01.makeupar.com";

/** Units per successful task, from the YouCam docs (AI Clothes, AI Shoes, AI Bag: 2 each). */
export const UNIT_COST: Record<YouCamEndpoint, number> = { "cloth-v4": 2, "shoes-transfer": 2, bag: 2 };

export class YouCamError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 502,
  ) {
    super(message);
  }
}

const FRIENDLY: Record<string, string> = {
  error_pose: "YouCam could not find a standing, front-facing pose in your photo. Use a straight-on photo from head to toe.",
  error_invalid_ref: "YouCam could not read the garment in the listing photo. Use a photo that shows the whole garment, front on.",
  error_apply_region_mismatch: "The garment and your photo don't line up (for example a full-length dress on a photo cropped at the waist).",
  error_invalid_src: "Your photo shows only part of the body. Use a full-body photo.",
  error_multi_person: "There is more than one person in a photo. Use a photo of just you.",
  error_nsfw_content_detected: "YouCam declined this image.",
  error_editing_failed: "YouCam could not change the outfit in this photo. Try a photo with plainer clothes.",
  error_below_min_image_size: "A photo is too small. Use one at least 512 pixels on the long side.",
  exceed_max_filesize: "A photo is too large for YouCam (10 MB or 4096 px max).",
  error_no_face: "YouCam needs your face visible for this try-on.",
  CreditInsufficiency: "The YouCam account is out of units.",
  InvalidParameters: "YouCam rejected the request parameters.",
};

function key(): string {
  const k = process.env.YOUCAM_API_KEY;
  if (!k) throw new YouCamError("Live mode needs YOUCAM_API_KEY on the server.", "no_key", 503);
  return k;
}

async function api<T>(method: "GET" | "POST", pathname: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const code = String(json.error_code ?? json.error ?? `http_${res.status}`);
    throw new YouCamError(FRIENDLY[code] ?? `YouCam returned ${res.status} (${code}).`, code, res.status === 429 ? 429 : 502);
  }
  return json as T;
}

type FileResponse = {
  data: { files: { file_id: string; requests: { method: string; url: string; headers: Record<string, string> }[] }[] };
};

/** Steps 1 and 2: register the file (free), then PUT the bytes to the signed URL it returns. */
export async function uploadImage(bytes: Uint8Array, contentType: "image/jpeg" | "image/png", name: string): Promise<string> {
  const ct = contentType === "image/png" ? "image/png" : "image/jpg";
  const reg = await api<FileResponse>("POST", "/s2s/v2.0/file", {
    files: [{ content_type: ct, file_name: name, file_size: bytes.byteLength }],
  });
  const file = reg.data.files[0];
  const put = file.requests[0];
  const up = await fetch(put.url, { method: "PUT", headers: put.headers, body: Buffer.from(bytes) });
  if (!up.ok) throw new YouCamError(`Upload to YouCam storage failed (${up.status}).`, "upload_failed");
  return file.file_id;
}

type TaskStatus = {
  data: { task_status: string; error?: string | null; results?: { url?: string } | null; [k: string]: unknown };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Steps 3 and 4: start the task, then poll (free) until success or error. Units are charged only on success. */
export async function runTask(
  endpoint: YouCamEndpoint,
  body: Record<string, unknown>,
  opts: { timeoutMs?: number } = {},
): Promise<{ url: string; taskId: string; polls: number; ms: number; status: TaskStatus["data"] }> {
  const started = Date.now();
  const created = await api<{ data: { task_id: string } }>("POST", `/s2s/v2.0/task/${endpoint}`, body);
  const taskId = created.data.task_id;
  const deadline = started + (opts.timeoutMs ?? 150_000);
  let polls = 0;
  await sleep(2500);
  while (Date.now() < deadline) {
    polls++;
    const st = await api<TaskStatus>("GET", `/s2s/v2.0/task/${endpoint}/${encodeURIComponent(taskId)}`);
    const s = st.data.task_status;
    if (s === "success") {
      const url = st.data.results?.url;
      if (!url) throw new YouCamError("YouCam finished but sent no image.", "no_result");
      return { url, taskId, polls, ms: Date.now() - started, status: st.data };
    }
    if (s === "error") {
      const code = String(st.data.error ?? "task_error");
      throw new YouCamError(FRIENDLY[code] ?? `YouCam could not finish this try-on (${code}).`, code, 422);
    }
    await sleep(polls < 6 ? 2500 : 5000);
  }
  throw new YouCamError("YouCam took too long. Try again in a minute.", "timeout", 504);
}

export function sniffType(bytes: Uint8Array): "image/jpeg" | "image/png" {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? "image/png" : "image/jpeg";
}

export async function download(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new YouCamError(`Could not download the YouCam result (${res.status}).`, "download_failed");
  return new Uint8Array(await res.arrayBuffer());
}

export type ChainStep = {
  garment: Uint8Array;
  garmentType: "image/jpeg" | "image/png";
  endpoint: YouCamEndpoint;
  garment_category?: GarmentCategory;
  label: string;
  gender?: "female" | "male";
};

/**
 * Apply one or more garments in order. Each result is downloaded and uploaded again as the
 * next source, so a closet dress can go on before the listing's jacket.
 */
export async function tryOnChain(
  person: Uint8Array,
  personType: "image/jpeg" | "image/png",
  steps: ChainStep[],
  onSpend: (units: number) => Promise<void>,
): Promise<{ image: Uint8Array; trace: TraceStep[] }> {
  let src = person;
  let srcType = personType;
  const trace: TraceStep[] = [];
  for (const [i, step] of steps.entries()) {
    const t0 = Date.now();
    const srcId = await uploadImage(src, srcType, `person_${i}.${srcType === "image/png" ? "png" : "jpg"}`);
    const refId = await uploadImage(step.garment, step.garmentType, `garment_${i}.${step.garmentType === "image/png" ? "png" : "jpg"}`);
    const body: Record<string, unknown> = { src_file_id: srcId, ref_file_id: refId };
    if (step.endpoint === "cloth-v4") body.garment_category = step.garment_category ?? "auto";
    if (step.endpoint === "bag") {
      body.gender = step.gender ?? "female";
      body.style = "random";
    }
    const result = await runTask(step.endpoint, body);
    const units = UNIT_COST[step.endpoint];
    await onSpend(units);
    const bytes = await download(result.url);
    trace.push({
      endpoint: step.endpoint,
      garment_category: step.endpoint === "cloth-v4" ? ((body.garment_category as GarmentCategory) ?? "auto") : undefined,
      garment_label: step.label,
      task_id_hint: `${result.taskId.slice(0, 6)}...`,
      polls: result.polls,
      ms: Date.now() - t0,
      units,
      cached: false,
      calls: [
        "POST /s2s/v2.0/file (person photo, free)",
        "PUT signed URL (person bytes)",
        "POST /s2s/v2.0/file (garment photo, free)",
        "PUT signed URL (garment bytes)",
        `POST /s2s/v2.0/task/${step.endpoint}${body.garment_category ? ` {garment_category: "${body.garment_category}"}` : ""}`,
        `GET /s2s/v2.0/task/${step.endpoint}/{task_id} x${result.polls} until success`,
        "GET results.url (download image)",
      ],
    });
    src = bytes;
    srcType = sniffType(bytes);
  }
  return { image: src, trace };
}
