# Demo script

The finished video is `demo/video.mp4` (thumbnail `demo/thumb.jpg`). It was made by `scripts/make-video.mjs`, which
follows this script exactly: headless Chromium at 1440x900 in Replay mode (no keys, no API calls), narration by
AssemblyAI text-to-speech (voice `aai-sara`), composed with ffmpeg. Use this page to re-record it by hand or to narrate
it live. Every click below is a stable `data-testid`.

Setup: `pnpm build && pnpm start`, open http://localhost:3000 in a fresh browser profile (Replay mode is the default),
window 1440x900.

| # | Screen and clicks | Narration |
| --- | --- | --- |
| 1 | Open `/video/intro` (title card). | Secondhand clothes are usually final sale. One of a kind, no returns, no size chart, and photographed on a hanger or a tabletop. That's exactly where trying before you buy matters most, and where nobody offers it. |
| 2 | Open `/`. Click `view-original` (Your photo), then `open-profile` (Edit measurements); close with `profile-dialog-close`. | Final Sale fixes that. You add a full-body photo once, and it stays in your browser. Then you note the measurements of clothes that already fit you. |
| 3 | Hover, then click `listing-denim-jacket`. The try-on reveals; point at `api-badge`. | Here's a vintage denim jacket from a resale listing. One tap, and the YouCam AI Clothes API puts it on you, using the outerwear category of its cloth v4 engine. |
| 4 | Point at `check-verdict`, then `finding-m-length` (the ruler), then scroll to `finding-flaw-0`. | Next to the image is the final sale check. A language model reads the listing into facts, each with the seller's exact words. Then plain code compares them with your measurements. This jacket is two inches shorter than yours, and the seller mentions a mark near the cuff. The photo could never show you that. |
| 5 | Scroll to top. Click `show-trace` (API calls), then `trace-dialog-close`. | Every image shows which YouCam API made it, and how: upload both photos, start the task, poll until it succeeds. |
| 6 | Click `shopper-noor`, point at `check-verdict`, then click `shopper-maya`. | Switch shoppers, and the same jacket gets a different verdict, because the check runs on each person's own measurements. |
| 7 | Scroll to `closet-card`, click `closet-white-sneakers`, scroll to top, click `save-look`. | Style it with what you own. Pick your white sneakers, and Final Sale chains two YouCam APIs in dressing order: AI Clothes for the jacket, then AI Shoes for your sneakers. |
| 8 | Click `listing-knit-cardigan`, scroll to `ask-seller`, click `copy-ask-seller`. | When a seller leaves out a measurement, like this cardigan's length, Final Sale says so, and drafts the question to ask before you buy. |
| 9 | Scroll to top, click `listing-combat-boots`, point at `check-verdict`, click `save-look`. | Boots go through YouCam AI Shoes. Half a size up, and well worn. Good to know before it's final. |
| 10 | Click `header-compare` (Saved). | Save looks, then compare them side by side. |
| 11 | Open `/video/outro` (end card with credits). | One honest limit: a try-on shows the look, not the fit. That's why the measurements sit right next to it. Final Sale is for secondhand shoppers, and for the small resellers who lose sales when buyers can't picture an item. |

Narration total: 1,727 characters, about 104 seconds of speech; the video runs a little over two minutes. Scene start
times for the rendered file are in `demo/scenes.json`.

No music, no browser chrome, no third-party trademarks on screen: sellers and listings are fictional, and the people
in the photos are licensed (credits on the end card and in `docs/CREDITS.md`).
