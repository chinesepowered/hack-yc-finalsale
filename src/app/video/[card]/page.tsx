/* eslint-disable @next/next/no-img-element */
// Title, end and thumbnail cards for the demo video (scripts/make-video.mjs). Not linked from the app.
import { notFound } from "next/navigation";
import { Logo } from "@/components/icons";

export function generateStaticParams() {
  return [{ card: "intro" }, { card: "outro" }, { card: "thumb" }];
}

export default async function Card({ params }: PageProps<"/video/[card]">) {
  const { card } = await params;
  if (card === "intro") return <Intro />;
  if (card === "outro") return <Outro />;
  if (card === "thumb") return <Thumb />;
  notFound();
}

function Brand({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <span className="font-display font-semibold tracking-tight" style={{ fontSize: size * 0.95 }}>
        Final Sale
      </span>
    </div>
  );
}

function Intro() {
  return (
    <main className="grid h-dvh place-items-center px-16" data-testid="video-intro">
      <div className="max-w-[1100px] text-center">
        <div className="flex justify-center">
          <Brand size={56} />
        </div>
        <h1 className="font-display mt-8 text-[64px] font-semibold leading-[1.05]">
          Secondhand is usually <span className="text-stamp">final sale</span>.
        </h1>
        <p className="mt-6 text-[26px] text-ink-2">One of a kind. No returns. No size chart. Photographed on a hanger.</p>
        <div className="mt-10 flex justify-center gap-3">
          <span className="stamp text-[18px]" style={{ fontSize: 18, padding: "4px 12px" }}>
            Final sale
          </span>
          <span className="stamp text-[18px]" style={{ fontSize: 18, padding: "4px 12px", transform: "rotate(3deg)" }}>
            No returns
          </span>
        </div>
      </div>
    </main>
  );
}

function Outro() {
  return (
    <main className="grid h-dvh place-items-center px-16" data-testid="video-outro">
      <div className="max-w-[1100px] text-center">
        <div className="flex justify-center">
          <Brand size={56} />
        </div>
        <p className="font-display mt-8 text-[54px] font-semibold leading-[1.08]">Try secondhand on before it&apos;s final.</p>
        <ul className="mx-auto mt-8 grid max-w-[900px] gap-3 text-left text-[22px] text-ink-2">
          <li>
            <strong className="text-ink">YouCam AI Clothes</strong> (cloth-v4: outerwear, upper body, full body) and <strong className="text-ink">YouCam AI Shoes</strong> (shoes-transfer)
          </li>
          <li>An LLM reads the listing into quoted facts; plain code checks them against your measurements</li>
          <li>Try-on shows the look, not the fit. Measurements decide fit.</li>
        </ul>
        <p className="num mt-10 text-[17px] text-ink-3">Open source, AGPL-3.0. Sellers and listings are fictional.</p>
        <p className="mx-auto mt-2 max-w-[1000px] text-[14px] leading-relaxed text-ink-3">
          Photos via Wikimedia Commons: Brianna (CC BY 2.0), Mustafa ezz (CC0), NikosLikomitros (CC0), Lisa Dusseault (CC BY 2.0), Rhododendrites (CC BY-SA
          4.0), Auckland War Memorial Museum Tamaki Paenga Hira (CC BY 4.0), JustinLiang522 (CC BY-SA 4.0). Try-on images made with the YouCam API. Full credits
          in docs/CREDITS.md.
        </p>
      </div>
    </main>
  );
}

function Thumb() {
  return (
    <main className="relative h-dvh overflow-hidden" data-testid="video-thumb">
      <div className="absolute inset-0 grid grid-cols-[1.05fr_1fr] items-center gap-6 px-14">
        <div>
          <Brand size={48} />
          <h1 className="font-display mt-6 text-[60px] font-semibold leading-[1.02]">
            Try the thrift listing <span className="text-denim">on you</span> before it&apos;s <span className="text-stamp">final</span>.
          </h1>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-flag/30 bg-flag-bg px-5 py-3 text-[24px] font-semibold text-flag">
            Length 21 in, your usual is 23 in
          </div>
        </div>
        <div className="relative h-[620px]">
          <img src="/demo/results/maya__denim-jacket.jpg" alt="" className="absolute right-0 top-0 z-0 h-[620px] w-[465px] rounded-3xl border border-line object-cover shadow-2xl" />
          <div className="absolute left-0 top-[70px] z-10 w-[250px] rotate-[-6deg] rounded-md bg-white p-2.5 pb-2 shadow-2xl">
            <img src="/demo/listings/denim-jacket.jpg" alt="" className="aspect-square w-full rounded-sm object-cover" />
            <p className="num mt-1.5 text-center text-[15px] text-ink-2">the listing, $48</p>
          </div>
          <span className="absolute left-[205px] top-[330px] z-20 grid h-16 w-16 place-items-center rounded-full bg-denim text-[34px] text-white shadow-xl">
            &rarr;
          </span>
        </div>
      </div>
    </main>
  );
}
