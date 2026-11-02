# Final Sale (working name)

**YouCam API Skin AI & eCommerce VTO Hackathon, topic: eCommerce VTO.** Built in Claude Code web from this repo. Read
`YOUCAM_NOTES.md` (verified API facts) before the first call.

## The idea

Secondhand fashion is usually **final sale**: no returns, one of a kind, no size chart, photographed on a hanger or a
bedroom floor. That is exactly where trying before buying matters most and where nobody offers it. Final Sale lets a
shopper try a resale listing on their own photo before they commit:

1. **Your photo, once.** A full-body photo of the shopper (stored only in their browser).
2. **Paste or upload a listing.** The listing's garment photo plus its text. YouCam **AI Clothes** (`cloth-v4`) puts the
   garment on the shopper; add **AI Shoes** or **AI Bag** when the listing is shoes or a bag.
3. **Will it work?** Next to the try-on, a "final sale check": an LLM reads the listing text into structured facts
   (measurements such as pit to pit and length, fabric, flaws mentioned, size label and era), and deterministic code
   compares them with the shopper's saved measurements. It flags what the photo can't show: "length 26 in, your usual
   is 28", "seller mentions a small stain at the hem".
4. **Style it with what you own.** Try the listing with one item from the shopper's own closet (a saved photo) to see
   the full outfit, then save or compare two listings side by side.

The aha within 30 seconds of the video: a crumpled thrift-listing photo becomes the shopper wearing it, with a warning
that the listing's measurements are two inches short.

**Who it's for:** secondhand and vintage shoppers (budget-conscious, sustainability-minded), and the resale platforms and
small resellers who lose sales because buyers can't picture items. Retail angle: fewer abandoned carts and disputes.

**Honesty:** try-on shows look, not fit; measurements decide fit, which is why the check sits next to the image. Say so.

## Demo data

- Shopper photos: licensed stock full-body portraits (for example Pexels); credit them in `docs/CREDITS.md`.
- Listings: 3 or 4 **fictional** listings (a vintage denim jacket, a knit sweater, a dress, boots) using licensed product
  photos or your own simple flat-lay images; fictional seller names; **no real marketplace names, logos or brands**
  anywhere (the rules forbid third-party trademarks in the video).
- Cache every YouCam and LLM result as JSON fixtures in the repo, and build the UI against the cache so development and
  the video don't burn units.

---

## Shared rules (both YouCam builds)

### Deadline and split
- Submissions close **Mon Nov 2 2026, 11:45 AM ET = 8:45 AM PT**. Push everything by **3:00 AM PT Nov 2**.
- You build the app, README, screenshots, Devpost answer drafts and, if you can, the video (see below). The main session
  (local) uploads the video to YouTube, makes the repo public and submits on Devpost in the morning.

### Requirements from the rules
- Integrate at least one YouCam API **functionally** (not a mockup) in a web or mobile prototype with clear consumer or
  retail value; "fresh, unexpected solutions, not surface-level wrappers"; a first-time user must get it instantly.
- Repo with all source, assets and run instructions. License: **AGPL-3.0** `LICENSE` at the root plus `TRADEMARKS.md`
  reserving the name.
- Screenshots: at least 4 PNGs in `docs/screenshots/` (1440x900).
- A 1 to 3 minute video (aim 2:00 to 2:30) that explains the YouCam API used, shows the app working end to end, and
  contains **no third-party trademarks and no copyrighted music**.
- Judging (equal weight): Technological Implementation (how thoroughly YouCam is integrated, real value, non-trivial
  code), Design (complete product, not a proof of concept), Potential Impact (credible real problem, real audience,
  shown working), Quality of the Idea (creative, non-obvious YouCam use, understanding of the problem space).

### Keys (environment variables, never in the repo)
- `YOUCAM_API_KEY`: server-side only (Next.js API routes). YouCam units are free (no card), but **1,000 units are shared
  by two builds**: stay under ~350 units. Try-on costs about 2 units per call; skin analysis 9 to 22.
- LLM (free W&B inference, OpenAI-compatible): `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`
  (`Qwen/Qwen3.8-27B` for everything, including images: verified to read an image sent as an OpenAI `image_url` part,
  about 5 s per image; trim leading whitespace from replies). Server-side only. Use
  `maxRetries: 4` and a 60 s timeout (the endpoint fails about 1 call in 20 without retries).
- `.env*` git-ignored; scan history before the last push:
  `git grep -nE "sk-[A-Za-z0-9_-]{30,}|wandb_v1_|sk_[a-f0-9]{40}" $(git rev-list --all)` must print nothing.

### Stack and writing
- Next.js (App Router) + TypeScript, **pnpm**; mobile-first, accessible (WCAG 2.2 AA; say so in the README).
- `.env.example` with variable names only. `pnpm build` must pass.
- **No em dashes** anywhere (UI, README, docs, commits). **No Co-Authored-By or AI attribution lines** in commits.
  Statistics only with a fetched, cited source. All people, sellers and products fictional or licensed.
- Show which YouCam API produced each result in the UI (judges want to see the API at work), and keep a visible
  "Replay of a recorded run" mode that loads the cached fixtures so a judge without a key can click through.

### Deliverables
1. The working app; README for judges (what, who, the aha, how it works, which YouCam APIs and endpoints, how to run,
   limitations, credits).
2. `docs/screenshots/*.png` (4 or more).
3. `docs/devpost-answers.md`: name, tagline, a description of features, functionality and consumer or retail value, the
   built-with list, and draft answers to the form's three questions: "a moment the API surprised you, good or
   frustrating"; "industries or use cases the API could serve that nobody is talking about"; "where you hit a wall
   technically and how you worked around it". Keep a dated log of API surprises and walls in `docs/api-log.md` as you go.
4. **The video, if you can** (preferred, saves the morning): record the Replay flow with Playwright (headless, 1440x900),
   narrate with ElevenLabs (`ELEVENLABS_API_KEY`, voice `nPczCjzI2devNBz1zQrb`) if that key is in the environment,
   compose with ffmpeg, and commit `demo/video.mp4` (under 50 MB) plus `demo/thumb.jpg`. Narration: the problem and who
   it's for, the aha, the YouCam API by name and what it produced, one honest limitation. If you can't produce the video,
   write `docs/demo-script.md` instead: scenes, exact clicks, narration per scene, with stable `data-testid` attributes on
   everything the script touches.
5. A final summary as your last message: what works, what doesn't, units used, where the video or script is.
