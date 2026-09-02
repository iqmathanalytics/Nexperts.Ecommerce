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
};

const portraitH = (w: number) => Math.round((w * 4) / 3);

const u = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${portraitH(w)}&q=80`;

const px = (id: number, w: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${portraitH(w)}`;

export const DEFAULT_EDITORIAL: StorefrontEditorial = {
  homeHeadline: "Cut for the tropics.\nWorn worldwide.",
  homeSubhead:
    "Nexperts is a house of contemporary clothing — Woman and Man, festive edits, and pieces designed for heat, humidity, and a global wardrobe.",
  womenHeadline: "Woman",
  womenSubhead: "Dresses, tropical layers, and festive pieces — silhouettes cut for warm climates.",
  menHeadline: "Man",
  menSubhead: "Tailored essentials, breathable knits, and layers for city heat.",
  heroSlides: [
    { src: u("photo-1595777457583-95e059d581b8", 1000), alt: "Woman in a floor-length red gown", caption: "New season dresses" },
    { src: px(31808831, 1000), alt: "Woman in a couture evening dress", caption: "Woman" },
    { src: u("photo-1617137968427-85924c800a22", 1000), alt: "Man in a tailored navy suit", caption: "Man" },
    { src: u("photo-1572804013309-59a88b7e92f1", 1000), alt: "Woman in a red floral dress", caption: "Festive edit" },
    { src: px(3317434, 1000), alt: "Woman in a camel coat", caption: "Layers" },
  ],
  campaigns: [
    { href: "/women", label: "Woman", title: "New season", cta: "Shop woman", image: u("photo-1595777457583-95e059d581b8", 900) },
    { href: "/men", label: "Man", title: "Essentials", cta: "Shop man", image: u("photo-1617137968427-85924c800a22", 900) },
    {
      href: "/category/dresses?gender=WOMEN",
      label: "Dresses",
      title: "The dress edit",
      cta: "Shop dresses",
      image: px(31808831, 1000),
    },
  ],
  dressEdits: [
    { href: "/category/evening-dresses?gender=WOMEN", label: "Evening", title: "After dark", image: u("photo-1566174053879-31528523f8ae", 900) },
    { href: "/category/maxi-dresses?gender=WOMEN", label: "Maxi", title: "Long line", image: u("photo-1572804013427-4d7ca7268217", 900) },
    { href: "/category/casual-dresses?gender=WOMEN", label: "Day", title: "Everyday silk", image: u("photo-1515372039744-b8f02a3ae446", 900) },
  ],
  womenHero: px(31808831, 1000),
  menHero: u("photo-1617137968427-85924c800a22", 1000),
  womenTiles: [
    { href: "/category/dresses?gender=WOMEN", label: "Dresses", image: u("photo-1595777457583-95e059d581b8", 800) },
    { href: "/category/tops?gender=WOMEN", label: "Tops", image: px(7679720, 800) },
    { href: "/category/bottoms?gender=WOMEN", label: "Trousers", image: u("photo-1594633312681-425c7b97ccd1", 800) },
    { href: "/category/ethnic-wear?gender=WOMEN", label: "Heritage", image: u("photo-1610030469983-98e550d6193c", 800) },
    { href: "/category/outerwear?gender=WOMEN", label: "Outerwear", image: px(7671166, 800) },
  ],
  menTiles: [
    { href: "/category/tops?gender=MEN", label: "Shirts", image: px(1043474, 800) },
    { href: "/category/bottoms?gender=MEN", label: "Trousers", image: u("photo-1488161628813-04466f872be2", 800) },
    { href: "/category/outerwear?gender=MEN", label: "Jackets", image: px(842811, 800) },
    { href: "/products?gender=MEN&sort=newest", label: "New in", image: u("photo-1617137968427-85924c800a22", 800) },
  ],
  megaWomen: [
    { href: "/category/dresses?gender=WOMEN", label: "Dresses", image: u("photo-1595777457583-95e059d581b8", 600) },
    { href: "/category/ethnic-wear?gender=WOMEN", label: "Festive", image: u("photo-1583391733956-3750e0ff4e8b", 600) },
    { href: "/sale", label: "Sale", image: px(2043590, 600) },
  ],
  megaMen: [
    { href: "/category/tops?gender=MEN", label: "Shirts", image: px(1043474, 600) },
    { href: "/category/outerwear?gender=MEN", label: "Jackets", image: px(842811, 600) },
    { href: "/products?gender=MEN&sort=newest", label: "New in", image: u("photo-1617137968427-85924c800a22", 600) },
  ],
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
};

export function mergeEditorial(value: unknown): StorefrontEditorial {
  if (!value || typeof value !== "object") return DEFAULT_EDITORIAL;
  const v = value as Partial<StorefrontEditorial>;
  return {
    ...DEFAULT_EDITORIAL,
    ...v,
    heroSlides: Array.isArray(v.heroSlides) && v.heroSlides.length ? v.heroSlides : DEFAULT_EDITORIAL.heroSlides,
    campaigns: Array.isArray(v.campaigns) && v.campaigns.length ? v.campaigns : DEFAULT_EDITORIAL.campaigns,
    dressEdits: Array.isArray(v.dressEdits) && v.dressEdits.length ? v.dressEdits : DEFAULT_EDITORIAL.dressEdits,
    womenTiles: Array.isArray(v.womenTiles) && v.womenTiles.length ? v.womenTiles : DEFAULT_EDITORIAL.womenTiles,
    menTiles: Array.isArray(v.menTiles) && v.menTiles.length ? v.menTiles : DEFAULT_EDITORIAL.menTiles,
    megaWomen: Array.isArray(v.megaWomen) && v.megaWomen.length ? v.megaWomen : DEFAULT_EDITORIAL.megaWomen,
    megaMen: Array.isArray(v.megaMen) && v.megaMen.length ? v.megaMen : DEFAULT_EDITORIAL.megaMen,
    ticker: Array.isArray(v.ticker) && v.ticker.length ? v.ticker : DEFAULT_EDITORIAL.ticker,
    promoCodes: Array.isArray(v.promoCodes) && v.promoCodes.length ? v.promoCodes : DEFAULT_EDITORIAL.promoCodes,
    offers: Array.isArray(v.offers) && v.offers.length ? v.offers : DEFAULT_EDITORIAL.offers,
  };
}
