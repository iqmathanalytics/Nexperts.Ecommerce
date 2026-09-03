/** Editorial campaign photography — Unsplash + Pexels full-figure clothing models. */

import { withShopGender, type ShopGender } from "@/lib/shop";

const portraitH = (w: number) => Math.round((w * 4) / 3);

export const u = (id: string, w: number, h = portraitH(w)) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;

export const px = (id: number, w: number, h = portraitH(w)) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const HERO_SLIDES = [
  { src: u("photo-1595777457583-95e059d581b8", 1000), alt: "Woman in a floor-length red gown", caption: "New season dresses" },
  { src: px(31808831, 1000), alt: "Woman in a couture evening dress", caption: "Woman" },
  { src: u("photo-1617137968427-85924c800a22", 1000), alt: "Man in a tailored navy suit", caption: "Man" },
  { src: u("photo-1572804013309-59a88b7e92f1", 1000), alt: "Woman in a red floral dress", caption: "Festive edit" },
  { src: px(3317434, 1000), alt: "Woman in a camel coat", caption: "Layers" },
];

export const CAMPAIGNS = [
  {
    href: "/women",
    label: "Woman",
    title: "New season",
    cta: "Shop woman",
    image: u("photo-1595777457583-95e059d581b8", 900),
  },
  {
    href: "/men",
    label: "Man",
    title: "Essentials",
    cta: "Shop man",
    image: u("photo-1617137968427-85924c800a22", 900),
  },
  {
    href: "/category/dresses?gender=WOMEN",
    label: "Dresses",
    title: "The dress edit",
    cta: "Shop dresses",
    image: px(31808831, 1000),
  },
];

export const DRESS_EDITS = [
  {
    href: "/category/evening-dresses?gender=WOMEN",
    label: "Evening",
    title: "After dark",
    image: u("photo-1566174053879-31528523f8ae", 900),
  },
  {
    href: "/category/maxi-dresses?gender=WOMEN",
    label: "Maxi",
    title: "Long line",
    image: u("photo-1572804013427-4d7ca7268217", 900),
  },
  {
    href: "/category/casual-dresses?gender=WOMEN",
    label: "Day",
    title: "Everyday silk",
    image: u("photo-1515372039744-b8f02a3ae446", 900),
  },
];

export const WOMEN_TILES = [
  { href: "/category/dresses?gender=WOMEN", label: "Dresses", image: u("photo-1595777457583-95e059d581b8", 800) },
  { href: "/category/tops?gender=WOMEN", label: "Tops", image: px(7679720, 800) },
  { href: "/category/bottoms?gender=WOMEN", label: "Trousers", image: u("photo-1594633312681-425c7b97ccd1", 800) },
  { href: "/category/ethnic-wear?gender=WOMEN", label: "Heritage", image: u("photo-1610030469983-98e550d6193c", 800) },
  { href: "/category/outerwear?gender=WOMEN", label: "Outerwear", image: px(7671166, 800) },
];

export const MEN_TILES = [
  { href: "/category/shirts?gender=MEN", label: "Shirts", image: px(1043474, 800) },
  { href: "/category/t-shirts?gender=MEN", label: "T-shirt", image: u("photo-1521572163474-6864f9cf17ab", 800) },
  { href: "/category/trousers?gender=MEN", label: "Trousers", image: u("photo-1488161628813-04466f872be2", 800) },
  { href: "/category/jackets?gender=MEN", label: "Jackets", image: px(842811, 800) },
];

export const MEGA_WOMEN = [
  { href: "/category/dresses?gender=WOMEN", label: "Dresses", image: u("photo-1595777457583-95e059d581b8", 600) },
  { href: "/category/ethnic-wear?gender=WOMEN", label: "Festive", image: u("photo-1583391733956-3750e0ff4e8b", 600) },
  { href: "/sale", label: "Sale", image: px(2043590, 600) },
];

export const MEGA_MEN = [
  { href: "/category/shirts?gender=MEN", label: "Shirts", image: px(1043474, 600) },
  { href: "/category/t-shirts?gender=MEN", label: "T-shirt", image: u("photo-1521572163474-6864f9cf17ab", 600) },
  { href: "/category/trousers?gender=MEN", label: "Trousers", image: u("photo-1488161628813-04466f872be2", 600) },
  { href: "/category/jackets?gender=MEN", label: "Jackets", image: px(842811, 600) },
];

export const WOMEN_HERO = px(31808831, 1000);
export const MEN_HERO = u("photo-1617137968427-85924c800a22", 1000);
export const NEW_HERO = px(1926769, 1400);
export const SALE_HERO = u("photo-1595777457583-95e059d581b8", 1400);

const mixkit = (id: number, alt: string) => ({
  /** Save-data / very slow links only — avoid on normal mobile (soft on retina). */
  srcMobile: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`,
  /** Primary hero quality — Mixkit 720 is sharp (~3–6MB); their 1080 masters are 30–70MB and stall in prod. */
  src: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
  poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
  alt,
});

/** Mixkit Stock Video Free License — woman + man clothing lookbook films. */
export const HERO_VIDEO = mixkit(805, "Woman campaign lookbook");
export const WOMEN_HERO_VIDEO = mixkit(805, "Woman campaign lookbook");
export const MEN_HERO_VIDEO = mixkit(231, "Man campaign lookbook");
export const NEW_HERO_VIDEO = mixkit(18208, "New arrivals lookbook");
export const SALE_HERO_VIDEO = mixkit(806, "Sale campaign lookbook");

export type EditorialTile = {
  href: string;
  label: string;
  title?: string;
  cta?: string;
  image: string;
  alt?: string;
};

export type HeroSlide = { src: string; alt: string; caption: string };
export type OfferItem = { kicker: string; code: string; text: string; href: string };

export type StorefrontEditorial = {
  homeHeadline: string;
  homeSubhead: string;
  womenHeadline: string;
  womenSubhead: string;
  menHeadline: string;
  menSubhead: string;
  heroSlides: HeroSlide[];
  campaigns: EditorialTile[];
  dressEdits: EditorialTile[];
  womenHero: string;
  menHero: string;
  womenTiles: EditorialTile[];
  menTiles: EditorialTile[];
  megaWomen: EditorialTile[];
  megaMen: EditorialTile[];
  ticker: string[];
  promoCodes: string[];
  offers: OfferItem[];
  /** ISO datetime for /sale countdown. Empty = rolling 3-day fallback. */
  saleEndsAt: string;
};

export const DEFAULT_EDITORIAL: StorefrontEditorial = {
  homeHeadline: "Cut for the tropics.\nWorn worldwide.",
  homeSubhead:
    "Nexperts is a house of contemporary clothing — Woman and Man, festive edits, and pieces designed for heat, humidity, and a global wardrobe.",
  womenHeadline: "Woman",
  womenSubhead: "Dresses, tropical layers, and festive pieces — silhouettes cut for warm climates.",
  menHeadline: "Man",
  menSubhead: "Tailored essentials, breathable knits, and layers for city heat.",
  heroSlides: HERO_SLIDES,
  campaigns: CAMPAIGNS,
  dressEdits: DRESS_EDITS,
  womenHero: WOMEN_HERO,
  menHero: MEN_HERO,
  womenTiles: WOMEN_TILES,
  menTiles: MEN_TILES,
  megaWomen: MEGA_WOMEN,
  megaMen: MEGA_MEN,
  ticker: [
    "Complimentary shipping over RM 999",
    "WELCOME10 · 10% off first order",
    "FESTIVE20 · Festive celebration edit",
    "7-day returns",
    "FLAT200 · RM 200 off",
    "Ships worldwide",
  ],
  promoCodes: ["WELCOME10", "First order 10% off", "FESTIVE20", "Festive edit", "FLAT200", "RM 200 off", "Free shipping RM 999+", "Ships worldwide"],
  offers: [
    { kicker: "First order", code: "WELCOME10", text: "10% off over RM 999", href: "/register" },
    { kicker: "Festive edit", code: "FESTIVE20", text: "20% off celebration wear", href: "/collections/seasonal/festive" },
    { kicker: "Flat deal", code: "FLAT200", text: "RM 200 off over RM 1,499", href: "/sale" },
    { kicker: "Shipping", code: "FREE", text: "Free delivery over RM 999", href: "/products" },
  ],
  saleEndsAt: "",
};

function genderedTiles(tiles: EditorialTile[], gender: ShopGender): EditorialTile[] {
  return tiles.map((t) => ({ ...t, href: withShopGender(t.href, gender) }));
}

function isLegacyMenNav(tiles?: EditorialTile[]) {
  if (!tiles?.length) return true;
  return tiles.some((t) => /\/category\/(tops|bottoms|outerwear)(\?|$)/.test(t.href));
}

export function mergeEditorial(value: Partial<StorefrontEditorial> | null | undefined): StorefrontEditorial {
  if (!value) return DEFAULT_EDITORIAL;
  const campaigns = value.campaigns?.length ? value.campaigns : DEFAULT_EDITORIAL.campaigns;
  const dressEdits = value.dressEdits?.length ? value.dressEdits : DEFAULT_EDITORIAL.dressEdits;
  const womenTiles = value.womenTiles?.length ? value.womenTiles : DEFAULT_EDITORIAL.womenTiles;
  const menTiles = isLegacyMenNav(value.menTiles) ? DEFAULT_EDITORIAL.menTiles : value.menTiles!;
  const megaWomen = value.megaWomen?.length ? value.megaWomen : DEFAULT_EDITORIAL.megaWomen;
  const megaMen = isLegacyMenNav(value.megaMen) ? DEFAULT_EDITORIAL.megaMen : value.megaMen!;
  return {
    ...DEFAULT_EDITORIAL,
    ...value,
    heroSlides: value.heroSlides?.length ? value.heroSlides : DEFAULT_EDITORIAL.heroSlides,
    campaigns: genderedTiles(campaigns, "WOMEN"),
    dressEdits: genderedTiles(dressEdits, "WOMEN"),
    womenTiles: genderedTiles(womenTiles, "WOMEN"),
    menTiles: genderedTiles(menTiles, "MEN"),
    megaWomen: genderedTiles(megaWomen, "WOMEN"),
    megaMen: genderedTiles(megaMen, "MEN"),
    ticker: value.ticker?.length ? value.ticker : DEFAULT_EDITORIAL.ticker,
    promoCodes: value.promoCodes?.length ? value.promoCodes : DEFAULT_EDITORIAL.promoCodes,
    offers: value.offers?.length ? value.offers : DEFAULT_EDITORIAL.offers,
    saleEndsAt: typeof value.saleEndsAt === "string" ? value.saleEndsAt : DEFAULT_EDITORIAL.saleEndsAt,
  };
}
