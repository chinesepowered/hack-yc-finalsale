import "server-only";
import OpenAI from "openai";
import { LISTING_READER_PROMPT, listingFactsJsonSchema, listingFactsSchema } from "@/lib/listing-schema";
import type { ListingFacts } from "@/lib/types";

export class ReaderError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

let client: OpenAI | null = null;

function llm(): OpenAI {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL || !process.env.OPENAI_MODEL) {
    throw new ReaderError("Live mode needs OPENAI_BASE_URL, OPENAI_API_KEY and OPENAI_MODEL on the server.", 503);
  }
  client ??= new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 4,
    timeout: 60_000,
  });
  return client;
}

/** Strip a leading code fence or whitespace the model may add, then parse. */
function parseJson(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(t);
}

export async function readListing(text: string, photoDataUrl?: string): Promise<{ facts: ListingFacts; ms: number }> {
  const started = Date.now();
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: `Listing text:\n"""\n${text.slice(0, 6000)}\n"""${photoDataUrl ? "\nThe garment photo from the listing is attached." : "\nNo photo attached."}` },
  ];
  if (photoDataUrl) userContent.push({ type: "image_url", image_url: { url: photoDataUrl } });

  const res = await llm().chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    temperature: 0,
    max_tokens: 1800,
    messages: [
      { role: "system", content: LISTING_READER_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "listing_facts", strict: true, schema: listingFactsJsonSchema as unknown as Record<string, unknown> },
    },
    // Qwen: skip the thinking pass. Extraction is simple and this cuts latency about 4x.
    // @ts-expect-error vendor extension understood by the OpenAI-compatible server
    chat_template_kwargs: { enable_thinking: false },
  });
  const content = res.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = parseJson(content);
  } catch {
    throw new ReaderError("The listing reader returned something that wasn't JSON. Try again.");
  }
  const facts = listingFactsSchema.safeParse(parsed);
  if (!facts.success) throw new ReaderError("The listing reader's answer didn't match the expected shape. Try again.");
  return { facts: facts.data, ms: Date.now() - started };
}
