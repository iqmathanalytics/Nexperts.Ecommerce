/** Editorial campaign photography — Unsplash, Zara/H&M/Uniqlo crop language. */

export const u = (id: string, w: number, h: number, crop = "top") =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=${crop}&w=${w}&h=${h}&q=70`;

export const HERO_SLIDES = [
  { src: u("photo-1515886657613-9f3515b0c78f", 1400, 980), alt: "Woman in a statement dress", caption: "New season dresses" },
  { src: u("photo-1490481651871-ab68de25d43d", 1400, 980, "entropy"), alt: "Editorial fashion campaign", caption: "Woman" },
  { src: u("photo-1488161628813-04466f872be2", 1400, 980), alt: "Menswear essentials", caption: "Man" },
  { src: u("photo-1610030469983-98e550d6193c", 1400, 980), alt: "Festive ethnic wear", caption: "Festive edit" },
  { src: u("photo-1539109136881-3be8266af6c2", 1400, 980), alt: "Outerwear on the street", caption: "Layers" },
];

export const CAMPAIGNS = [
  {
    href: "/women",
    label: "Woman",
    title: "New season",
    cta: "Shop woman",
    image: u("photo-1515886657613-9f3515b0c78f", 900, 1200),
  },
  {
    href: "/men",
    label: "Man",
    title: "Essentials",
    cta: "Shop man",
    image: u("photo-1552374196-1ab2a1c593e8", 900, 1200),
  },
  {
    href: "/category/dresses",
    label: "Dresses",
    title: "The dress edit",
    cta: "Shop dresses",
    image: u("photo-1496747611176-843222e1e57c", 1400, 840, "entropy"),
  },
];

export const DRESS_EDITS = [
  {
    href: "/category/evening-dresses",
    label: "Evening",
    title: "After dark",
    image: u("photo-1566174053879-31528523f8ae", 900, 1200),
  },
  {
    href: "/category/maxi-dresses",
    label: "Maxi",
    title: "Long line",
    image: u("photo-1469334031218-e382a71b716b", 900, 1200),
  },
  {
    href: "/category/casual-dresses",
    label: "Day",
    title: "Everyday silk",
    image: u("photo-1515372039744-b8f02a3ae446", 900, 1200),
  },
];

export const WOMEN_TILES = [
  { href: "/category/dresses", label: "Dresses", image: u("photo-1595777457583-95e059d581b8", 800, 1100) },
  { href: "/category/tops", label: "Tops", image: u("photo-1564257631407-4deb1f99d992", 800, 1100) },
  { href: "/category/bottoms", label: "Trousers", image: u("photo-1594633312681-425c7b97ccd1", 800, 1100) },
  { href: "/category/ethnic-wear", label: "Ethnic", image: u("photo-1581044777550-4cfa60707c03", 800, 1100) },
  { href: "/category/outerwear", label: "Outerwear", image: u("photo-1539533018447-63fcce2678e3", 800, 1100) },
];

export const MEN_TILES = [
  { href: "/category/tops", label: "Shirts", image: u("photo-1602810318383-e386cc2a3ccf", 800, 1100) },
  { href: "/category/bottoms", label: "Trousers", image: u("photo-1473966968600-fa801b869a1a", 800, 1100) },
  { href: "/category/outerwear", label: "Jackets", image: u("photo-1617137968427-85924c800a22", 800, 1100) },
  { href: "/products?gender=MEN&sort=newest", label: "New in", image: u("photo-1488161628813-04466f872be2", 800, 1100) },
];

export const MEGA_WOMEN = [
  { href: "/category/dresses", label: "Dresses", image: u("photo-1515886657613-9f3515b0c78f", 600, 800) },
  { href: "/category/ethnic-wear", label: "Festive", image: u("photo-1610030469983-98e550d6193c", 600, 800) },
  { href: "/sale", label: "Sale", image: u("photo-1483985988355-763728e1935b", 600, 800) },
];

export const MEGA_MEN = [
  { href: "/category/tops", label: "Shirts", image: u("photo-1593030761757-71fae45fa0e7", 600, 800) },
  { href: "/category/outerwear", label: "Jackets", image: u("photo-1617127365659-c47fa864d8bc", 600, 800) },
  { href: "/products?gender=MEN&sort=newest", label: "New in", image: u("photo-1552374196-1ab2a1c593e8", 600, 800) },
];

export const WOMEN_HERO = u("photo-1529139574466-a303027c1d8b", 1400, 980);
export const MEN_HERO = u("photo-1507003211169-0a1dd7228f2d", 1400, 980, "entropy");
