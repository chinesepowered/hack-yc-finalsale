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

const noorProfile: FitProfile = {
  displayUnits: "in",
  jacket: { pit_to_pit: 22, length: 25, sleeve: 23.5 },
  top: { pit_to_pit: 21.5, length: 27, sleeve: 23.5 },
  dress: { pit_to_pit: 19, waist_flat: 15, length: 52 },
  bottom: { waist_flat: 15.5, inseam: 30, rise: 11 },
  shoes: { shoe_size_us: 7.5, insole: 9.25 },
};

export const SAMPLE_SHOPPERS: Shopper[] = [
  { id: "maya", name: "Maya", photo: "/demo/shoppers/maya.jpg", profile: mayaProfile, sample: true },
  { id: "noor", name: "Noor", photo: "/demo/shoppers/noor.jpg", profile: noorProfile, sample: true },
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
    id: "knit-cardigan",
    title: "Hand-knit cable cardigan",
    price: 36,
    currency: "USD",
    seller: "Moth and Thread",
    location: "Portland, OR",
    photo: "/demo/listings/knit-cardigan.jpg",
    sample: true,
    text: `Hand-knit cable cardigan, no size tag
Cream wool, V-neck, six buttons, lovely cable and lace panels. Fits like a modern M, a little oversized on me.
Chest 43 in all the way around. Happy to measure anything else.
Feels like pure wool (no fiber tag). Hand wash only.
Some loose yarn at the bottom of the left side seam and a few small pills under the arms. Easy to fix.
Smoke-free home.`,
  },
  {
    id: "gingham-dress",
    title: "50s gingham day dress",
    price: 42,
    currency: "USD",
    seller: "Old Pine Closet",
    location: "Austin, TX",
    photo: "/demo/listings/gingham-dress.jpg",
    sample: true,
    text: `1950s gingham day dress, tagged size 12
Brown and cream check, crossover bodice, cap sleeves, full pleated skirt. Side zip works smoothly.
Vintage sizing, fits more like a modern 6.
Flat measurements: pit to pit 17 in, waist 13.5 in, length 44 in.
Cotton, no stretch.
Tiny hole at the left side seam under the arm (pictured), easily mended.
All sales final.`,
  },
  {
    id: "combat-boots",
    title: "Black leather combat boots",
    price: 55,
    currency: "USD",
    seller: "Dovetail Resale",
    location: "Chicago, IL",
    photo: "/demo/listings/combat-boots.jpg",
    sample: true,
    text: `Black leather lace-up combat boots, women's US 8.5
Ten eyelets, chunky lug sole. Insole 9.75 in.
Well worn: resoled once by a cobbler, deep creasing across the toes and scuffs on both toes.
No returns, please ask questions before buying.`,
  },
];

export const SAMPLE_CLOSET: ClosetItem[] = [
  { id: "white-sneakers", label: "My white sneakers", photo: "/demo/closet/white-sneakers.jpg", garment_type: "sneakers", sample: true },
];
