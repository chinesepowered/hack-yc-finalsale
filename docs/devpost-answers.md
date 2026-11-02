# Devpost answers (draft)

## Name

Final Sale

## Tagline

Try secondhand on before it's final: YouCam try-on plus a measurement check for one-of-a-kind, no-returns listings.

## Description

**The problem.** Secondhand and vintage clothes are usually final sale. Every item is one of a kind, there's no size
chart, returns are rare, and the photo is a jacket on a hanger or a sweater on a bedroom floor. That is exactly where
trying before buying matters most, and where nobody offers it.

**What Final Sale does.**

1. **Your photo, once.** Add a full-body photo and a few measurements from clothes you already own that fit, laid
   flat. Both stay in your browser.
2. **Pick or paste a listing.** Final Sale reads the listing and sends the garment photo and your photo to the right
   YouCam API: **AI Clothes** (`cloth-v4`) with `outer` for jackets, `upper_body` for sweaters and tops, `full_body`
   for dresses, and **AI Shoes** (`shoes-transfer`) for boots and shoes. In about 13 seconds the flat-lay jacket is on
   you.
3. **Will it work?** Next to the image sits the final sale check. An LLM reads the listing text into facts
   (measurements, fabric, flaws, size label, era, return policy), each with the seller's exact words. Plain code
   verifies every quote, converts cm and all-round measurements to flat inches, and compares them with your
   measurements: "Length 21 in, your usual is 23 in", "Seller mentions: small faint mark near the left cuff", "Not
   listed: length", plus a ready-to-send question for the seller.
4. **Style it with what you own.** Pick a piece from your closet and Final Sale chains two YouCam calls in dressing
   order, for example AI Clothes for the jacket, then AI Shoes for your white sneakers. Save looks and compare two
   listings side by side.

**The aha:** a flat-lay thrift photo becomes you wearing it, with a warning that the listing is two inches shorter
than what you usually wear. Switch to a second shopper and the same jacket gets a different verdict, because the check
runs on each person's own measurements.

**Honest about limits.** A try-on shows the look, not the fit. Measurements decide fit, so they sit right next to the
image.

**Consumer and retail value.** Shoppers buy one-of-a-kind items with confidence and know what to ask before paying.
Resale platforms and small resellers get fewer abandoned carts, fewer "not as described" disputes, and fewer repeat
"what are the measurements?" messages, because the app tells buyers exactly what's missing.

**Built to be judged.** The app opens in **Replay of a recorded run**: every try-on and listing reading in it was
recorded through the app's own API routes, so anyone can click through without keys. Every image names the YouCam API
that made it, and an "API calls" panel shows the file registration, upload, task, polling and download for each step.
Live mode turns on when the server has keys, with a disk cache keyed by image hashes and a hard unit budget.

## Built with

- YouCam API: File API (`/s2s/v2.0/file`), AI Clothes (`/s2s/v2.0/task/cloth-v4` with `outer`, `upper_body`,
  `full_body`), AI Shoes (`/s2s/v2.0/task/shoes-transfer`), unit balance (`/s2s/v1.0/client/credit`)
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, pnpm
- Qwen3.8 27B on W&B Inference (OpenAI-compatible), OpenAI Node SDK, zod, strict JSON-schema decoding
- Playwright and ffmpeg (screenshots and the demo video), AssemblyAI text-to-speech (video narration)
- Photos from Wikimedia Commons (CC0, CC BY, CC BY-SA), fonts via Fontsource

## A moment the API surprised you, good or frustrating

The good surprise was the `outer` garment category in `cloth-v4`. Our first assumption was that a jacket would
replace the shopper's whole top. With `outer`, the denim jacket went on over her own blue tee and rainbow belt, open
at the front, and her face, jeans, shoes and room stayed untouched. That's what makes it feel like your outfit
rather than a model's. It was also steady: all ten recorded tasks succeeded on the first try in 12 to 14 seconds each
(four polls), including chained outfits.

The frustrating part was finding it. The AI Clothes guide only shows `full_body`; the full list (`upper_body`,
`lower_body`, `full_body`, `shoes`, `auto`, `outer`) is only in the OpenAPI bundle. We also learned from the spec,
not from an error, that lower-body try-ons need a worn photo, not a flat-lay, which matters a lot for resale, where
trousers are almost always photographed flat.

## Industries or use cases the API could serve that nobody is talking about

- **Resale and consignment intake.** The same call that shows a buyer an item on themselves can show a seller's
  one-off item on a body, so small resellers get "worn" photos without a model or a studio.
- **Rental and one-time formalwear.** Gowns, suits and costumes rented for a single event, where the deadline leaves
  no time for an exchange.
- **Theater, film and school costume departments.** Preview a stock costume on a cast member's photo before pulling
  it from storage or booking an alteration.
- **Uniform and workwear programs.** Schools and employers that issue garments by size could cut exchanges by
  pairing a try-on with the measurement check.
- **Charity shops and donation centers.** A kiosk or QR code on the rack, so shoppers can see an item on themselves
  without a fitting room.
- **Accessibility.** Shoppers for whom a fitting room is hard to use, because of mobility, sensory or caregiving
  constraints, get a way to try on from wherever they are.

## Where you hit a wall technically and how you worked around it

1. **A shared, limited unit budget.** We had 1,000 YouCam units shared with another project, so we set a budget of
   350 and built around it. The app ships a "Replay of a recorded run" mode. Every recording goes through the app's
   own `/api/tryon` route, one deliberate call per script run, and nothing calls the API in a loop. The server caches
   results by a hash of the input images (the same photos never cost twice), keeps a unit ledger with a hard cap, and
   allows one live job at a time. The whole demo, ten tasks including two chained outfits, cost **20 units**.
2. **Outfits are two calls, not one.** There's no multi-garment request, so we chain: download the first result,
   register it as the next source image, and apply the second garment. A deterministic dressing order (dress or
   bottoms, then tops, outerwear, shoes) decides which call goes first.
3. **Trusting an LLM with numbers.** A fit check is only useful if the numbers are real. The reader must return each
   fact with its exact quote; code drops any fact whose quote isn't in the listing or whose number isn't in its quote,
   then does all comparisons itself. When the model once put "US 8.5" only in the size label, a grounded regex
   fallback recovered the shoe size instead of a prompt hack.
4. **Tooling walls outside the API.** Our narration key had zero credits left, so we switched to another TTS API in
   minutes because the video script caches audio per scene. The usual stock photo sites block automated access, so we
   used the Wikimedia Commons API, which returns license metadata, and credited every photo.

See `docs/api-log.md` for the dated log.
