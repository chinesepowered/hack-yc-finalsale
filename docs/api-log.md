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

**19:10, grounding catches nothing, which is the point.** Each extracted fact carries the seller's exact words, and
`src/lib/fit-check.ts` drops any fact whose quote isn't in the listing or whose number isn't in its quote. On the four
demo listings nothing was dropped, and "Chest 43 in all the way around" was correctly read as a circumference and
halved to 21.5 in flat before comparing.

**19:15, photos.** Stock sites block automated access from our build sandbox, so we sourced every photo through the
Wikimedia Commons API, which returns license metadata with each file (CC0, CC BY, CC BY-SA), and credited them in
`docs/CREDITS.md`. Commons rate-limited us (HTTP 429) after a burst of searches, which cost us a black dress for the
closet; white sneakers took its place and turned out to be a better demo, because the outfit then chains two
different YouCam APIs.

**19:21 to 19:27, the recorded run.** Ten YouCam tasks, all through the app's own `/api/tryon` route, one script run
each: four for the main sample shopper (`outer`, `upper_body`, `full_body`, `shoes-transfer`), two for the second
shopper, and two chained outfits of two tasks each. Every task succeeded on the first try, in 12.1 to 13.5 s, after
four polls. The account went from 976 to 956 units: **20 units for the whole demo**. Results came back as 960x1280
or 1200x1600 JPEGs, the same size as the source photo.

**19:22, the jacket goes on over her own clothes.** With `garment_category: "outer"` the flat-lay denim jacket was
rendered open over the shopper's own tee and belt, and her face, jeans, shoes and room were untouched. One honest
note for the README: the model also relaxed her pose (hands on hips became hands near her pockets), another reason
the app says a try-on shows the look, not the fit.

**19:23, chaining works by re-uploading.** For an outfit we download the first result and register it as the source
of the second task. The second call (AI Shoes on top of AI Clothes) kept the jacket intact and swapped only the
shoes. Each chained outfit costs the sum of its steps (4 units).

**19:24, the reader looks at the photo too.** With the garment photo attached, the listing reader added notes such as
"the mark on the left cuff mentioned in the text is not clearly visible in this image", which is exactly the point of
the final sale check. In one run it put "US 8.5" only in `size_label` and left the shoe-size measurement out, so the
check now parses a US, EU or UK size from the size label, but only when that text is really in the listing.

**19:30, live path verified without spending.** Pressing "Run live" on a recorded combination sent the same image
bytes, so the server's hash cache answered with 0 units. Pasting a new listing (in cm, with no sleeve measurement)
returned a reading in a few seconds: 48 cm pit to pit became 19 in flat, and "Not listed: sleeve" showed up with a
drafted question for the seller.

**19:40 to 20:15, the narrated video.** `scripts/make-video.mjs` sends one AssemblyAI text-to-speech request per scene
(voice `aai-sara`) and caches each clip by a hash of its text, so re-recording the screen costs nothing and changing
one sentence re-synthesizes only that scene. The first full pass billed 1,757 characters; tightening the aha line
re-billed 160; with the 26-character test that is 1,943 characters in total. The first mix measured -24.9 LUFS, too
quiet for web video, so the mix now runs through `loudnorm` to about -16 LUFS. The headless recording has no cursor,
so the script injects one with a click ripple, and it holds every scene until its narration ends, so voice and clicks
stay in sync without manual editing.
