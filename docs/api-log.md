# API log: surprises and walls

A dated log kept while building Final Sale for the YouCam API hackathon. Times are Pacific.

## Sun Nov 1, 2026

**18:45, YouCam units.** `GET /s2s/v1.0/client/credit` showed 1,000 units, shared with a second build. We set a
budget of 350 for this project and built a hard cap into the server (`YOUCAM_UNIT_BUDGET`, default 40) so a live
deploy can't drain the account. Every recording is one deliberate script run; nothing calls the API in a loop.

**18:50, garment categories live in the OpenAPI bundle, not the guide.** The AI Clothes overview only shows
`full_body`. The `cloth-v4` schema in `https://docs.perfectcorp.com/_bundle/reference/ai_clothes.yaml` lists
`upper_body`, `lower_body`, `full_body`, `shoes`, `auto` and, new in v4, `outer` for jackets and vests. That one
value is what makes a denim jacket try-on work over the shopper's own top, so the app routes jackets, coats and
vests to `outer`.

**18:52, lower-body try-ons need worn photos.** The spec says "For the lower body, only actual worn outfits are
supported, not standalone product images." Resale listings of trousers and skirts are almost always flat-lays, so
the app routes them to `lower_body` but says so in the closet picker ("worn photo"), and the demo listings are a
jacket, a sweater, a dress and boots.

**18:55, two kinds of shoe and bag try-on.** `/task/shoes` (v2) and `/task/bag` take a `gender` and a `style` and
generate a new styled scene. `/task/shoes-transfer` (v3) takes only `src` and `ref` and keeps the shopper's own
photo, which is what a buyer needs, so boots go to `shoes-transfer`.

**19:00, ElevenLabs quota wall.** The narration key returned `quota_exceeded` ("0 credits remaining") on a
3-character test, and its subscription endpoint showed 10,000 of 10,000 characters used and no way to extend. We
switched the video narration to AssemblyAI's text-to-speech HTTP API (`POST https://tts.us.assemblyai.com/v1/speech`,
voice `aai-sara`), which bills per character and reports it in an `X-TTS-Billed-Characters` header. A 26-character
test cost 26 characters and returned clean 44.1 kHz WAV.

**19:05, the LLM's thinking pass.** The listing reader (an open-weights model behind an OpenAI-compatible endpoint)
spends about 500 reasoning characters before answering. Passing `chat_template_kwargs: {enable_thinking: false}` cut a
small extraction from 3.8 s to 1.0 s with the same JSON. Strict `response_format: json_schema` decoding worked on the
first try, so the server validates with zod but rarely needs to.

**19:20, grounding catches nothing, which is the point.** Each extracted fact carries the seller's exact words, and
`src/lib/fit-check.ts` drops any fact whose quote isn't in the listing or whose number isn't in its quote. On the four
demo listings nothing was dropped, and "Chest 43 in all the way around" was correctly read as a circumference and
halved to 21.5 in flat before comparing.
