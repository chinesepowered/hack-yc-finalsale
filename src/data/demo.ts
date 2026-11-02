// Demo data. Every seller and listing is fictional. Photo credits: docs/CREDITS.md.
import type { ClosetItem, FitProfile, Listing, Shopper } from "@/lib/types";

export const RECORDED_ON = "Nov 1, 2026";

const mayaProfile: FitProfile = {
  displayUnits: "in",
  jacket: { pit_to_pit: 21, length: 23, sleeve: 24 },
  top: { pit_to_pit: 20.5, length: 24, sleeve: 23 },
  dress: { pit_to_pit: 18, waist_flat: 14, length: 40 },
  bottom: { waist_flat: 14.5, inseam: 29, rise: 10.5 },
  shoes: { shoe_size_us: 8, insole: 9.5 },
};

const theoProfile: FitProfile = {
  displayUnits: "in",
  jacket: { pit_to_pit: 23, length: 27, sleeve: 25.5 },
  top: { pit_to_pit: 22, length: 28, sleeve: 25 },
  dress: {},
  bottom: { waist_flat: 16, inseam: 32, rise: 11 },
  shoes: { shoe_size_us: 10.5, insole: 10.75 },
};

export const SAMPLE_SHOPPERS: Shopper[] = [
  { id: "maya", name: "Maya", photo: "/demo/shoppers/maya.jpg", profile: mayaProfile, sample: true },
  { id: "theo", name: "Theo", photo: "/demo/shoppers/theo.jpg", profile: theoProfile, sample: true },
];

export const SAMPLE_LISTINGS: Listing[] = [
  {
    id: "denim-jacket",
    title: "90s washed denim jacket",
    price: 48,
    currency: "USD",
    seller: "Juniper Lane Vintage",
    location: "Oakland, CA",
    photo: "/demo/listings/denim-jacket.jpg",
    sample: true,
    text: `90s washed denim jacket, size M (vintage)
Classic trucker style, button front, two chest pockets. Lovely faded mid-blue wash.
Measurements taken flat: pit to pit 20.5 in, length 21 in (collar seam to hem), sleeve 23 in.
100% cotton denim, no stretch.
Small faint mark near the left cuff, see last photo. Light fading at the collar, normal for age.
Final sale, no returns. Ships in 2 days.`,
  },
  {
    id: "knit-sweater",
    title: "Hand-knit wool sweater",
    price: 36,
    currency: "USD",
    seller: "Moth and Thread",
    location: "Portland, OR",
    photo: "/demo/listings/knit-sweater.jpg",
    sample: true,
    text: `Hand-knit wool sweater, no size tag
Cozy cable knit, crew neck. Fits like a modern M, a little oversized on me.
Chest 43 in all the way around. Happy to measure anything else.
Wool blend (feels like mostly wool, no fiber tag).
A few small pills under the arms and one pulled stitch at the back hem, easy to fix.
Smoke-free home.`,
  },
  {
    id: "floral-dress",
    title: "70s floral midi dress",
    price: 42,
    currency: "USD",
    seller: "Old Pine Closet",
    location: "Austin, TX",
    photo: "/demo/listings/floral-dress.jpg",
    sample: true,
    text: `1970s floral midi dress, tagged size 12
Vintage sizing, fits more like a modern 6. Back zip works smoothly.
Flat measurements: pit to pit 17 in, waist 13.5 in, length 44 in.
100% polyester, no stretch.
Tiny hole at the left side seam under the arm (pictured), easily mended.
All sales final.`,
  },
  {
    id: "ankle-boots",
    title: "Leather lace-up ankle boots",
    price: 55,
    currency: "USD",
    seller: "Dovetail Resale",
    location: "Chicago, IL",
    photo: "/demo/listings/ankle-boots.jpg",
    sample: true,
    text: `Leather lace-up ankle boots, women's US 8.5
Brown leather, stacked 1.5 in heel. Insole 9.75 in.
Resoled once by a cobbler. Light creasing across the toes and a scuff on the right heel.
No returns, please ask questions before buying.`,
  },
];

export const SAMPLE_CLOSET: ClosetItem[] = [
  { id: "black-dress", label: "My black dress", photo: "/demo/closet/black-dress.jpg", garment_type: "dress", sample: true },
  { id: "white-sneakers", label: "My white sneakers", photo: "/demo/closet/white-sneakers.jpg", garment_type: "sneakers", sample: true },
];
