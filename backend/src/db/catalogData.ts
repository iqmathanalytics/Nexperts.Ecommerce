export type Gender = "MEN" | "WOMEN" | "UNISEX";

export const SIZES = ["S", "M", "L", "XL"] as const;

export const CATEGORY_TREE = [
  { name: "Dresses", children: ["Casual Dresses", "Evening Dresses", "Party Dresses", "Maxi Dresses", "Midi Dresses", "Mini Dresses"] },
  { name: "Tops", children: [] as string[] },
  { name: "Bottoms", children: [] as string[] },
  { name: "Ethnic Wear", children: ["Ethnic Dresses"] },
  { name: "Outerwear", children: [] as string[] },
];

export const CLOTHING_BRANDS = [
  "SilkRoad",
  "Petal",
  "Lumina",
  "NovaGlow",
  "CloudSoft",
  "UrbanThread",
];

const portraitH = (w: number) => Math.round((w * 4) / 3);
const heroH = (w: number) => Math.round((w * 9) / 16);

/** Full-figure Unsplash model shots — 3:4 crop from the figure, not the face. */
export const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${portraitH(w)}&q=85`;

/** Full-figure Pexels model shots. */
export const px = (id: number, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${portraitH(w)}`;

/** Cinematic 16:9 heroes for category / campaign banners. */
export const heroU = (id: string, w = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${heroH(w)}&q=85`;

export const heroPx = (id: number, w = 1800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${heroH(w)}`;

/** Topic-matched category heroes — landscape so full silhouettes fit the banner. */
export const CATEGORY_IMAGES: Record<string, string> = {
  Dresses: heroU("photo-1595777457583-95e059d581b8"),
  "Casual Dresses": heroU("photo-1515372039744-b8f02a3ae446"),
  "Evening Dresses": heroU("photo-1566174053879-31528523f8ae"),
  "Party Dresses": heroU("photo-1515886657613-9f3515b0c78f"),
  "Maxi Dresses": heroU("photo-1572804013427-4d7ca7268217"),
  "Midi Dresses": heroU("photo-1496747611176-843222e1e57c"),
  "Mini Dresses": heroU("photo-1509631179647-0177331693ae"),
  Tops: heroPx(7679720),
  Bottoms: heroU("photo-1594633312681-425c7b97ccd1"),
  "Ethnic Wear": heroU("photo-1610030469983-98e550d6193c"),
  "Ethnic Dresses": heroU("photo-1583391733956-3750e0ff4e8b"),
  Outerwear: heroPx(7671166),
};

export const CATALOG: Array<{
  name: string;
  category: string;
  extraCategory?: string;
  brand: string;
  gender: Gender;
  price: number;
  mrp: number;
  image: string;
  image2: string;
  image3?: string;
  sku: string;
  description: string;
  fabric: string;
  fit: string;
  care?: string;
  origin?: string;
  styling?: string;
  model?: string;
}> = [
  {
    name: "Petal Linen Day Dress",
    category: "Dresses",
    extraCategory: "Casual Dresses",
    brand: "Petal",
    gender: "WOMEN",
    price: 2499,
    mrp: 3499,
    sku: "NX-DR-001",
    fabric: "European linen blend",
    fit: "Relaxed",
    description:
      "A refined day dress in soft linen with clean seams and a fluid silhouette. Designed for warm days, work lunches, and weekend ease — elevated everyday wear.",
    image: u("photo-1572804013309-59a88b7e92f1"),
    image2: u("photo-1496747611176-843222e1e57c"),
    image3: px(1852382),
    care: "Cold gentle wash. Line dry. Steam, do not wring. Iron on linen setting.",
    origin: "Designed in-house · Fabric sourced in Europe",
    styling: "Wear with leather sandals by day, or a structured blazer after hours.",
    model: "Model is 175 cm and wears size S",
  },
  {
    name: "UrbanThread Poplin Shirt Dress",
    category: "Dresses",
    extraCategory: "Casual Dresses",
    brand: "UrbanThread",
    gender: "WOMEN",
    price: 2199,
    mrp: 2999,
    sku: "NX-DR-002",
    fabric: "Crisp cotton poplin",
    fit: "Tailored",
    description:
      "A structured shirt dress with a clean collar line and soft waist definition. Polished enough for the office, easy enough for travel days.",
    image: px(1926769),
    image2: px(1036623),
  },
  {
    name: "Lumina Silk Column Gown",
    category: "Dresses",
    extraCategory: "Evening Dresses",
    brand: "Lumina",
    gender: "WOMEN",
    price: 8999,
    mrp: 11999,
    sku: "NX-DR-003",
    fabric: "Satin silk finish",
    fit: "Column",
    description:
      "An evening column gown with a luminous satin finish and architectural drape. Made for black-tie dinners, gallery nights, and formal celebrations.",
    image: px(31132239),
    image2: px(31808831),
    image3: u("photo-1595777457583-95e059d581b8"),
    care: "Dry clean only. Store hanging. Avoid direct sunlight.",
    origin: "Studio-finished",
    styling: "Pair with strappy heels and a slim clutch. Skip heavy jewellery — the drape is the statement.",
    model: "Model is 178 cm and wears size S",
  },
  {
    name: "SilkRoad Midnight Evening Gown",
    category: "Dresses",
    extraCategory: "Evening Dresses",
    brand: "SilkRoad",
    gender: "WOMEN",
    price: 10999,
    mrp: 14999,
    sku: "NX-DR-004",
    fabric: "Crepe satin",
    fit: "Sculpted",
    description:
      "A deep evening gown with a refined neckline and floor-length fall. Quiet luxury for formal nights — precise, elegant, and timeless.",
    image: u("photo-1595777457583-95e059d581b8"),
    image2: px(31132239),
  },
  {
    name: "NovaGlow Sequin Cocktail Dress",
    category: "Dresses",
    extraCategory: "Party Dresses",
    brand: "NovaGlow",
    gender: "WOMEN",
    price: 5999,
    mrp: 7999,
    sku: "NX-DR-005",
    fabric: "Hand-set sequin mesh",
    fit: "Body-skimming",
    description:
      "A statement cocktail dress with fine sequin detailing and a modern cut. Made to catch the light — for parties, receptions, and nights out.",
    image: u("photo-1765229282269-25312995d4bb"),
    image2: u("photo-1765229280816-f8e55ac050e8"),
  },
  {
    name: "Lumina Flared Party Dress",
    category: "Dresses",
    extraCategory: "Party Dresses",
    brand: "Lumina",
    gender: "WOMEN",
    price: 4499,
    mrp: 6299,
    sku: "NX-DR-006",
    fabric: "Soft stretch crepe",
    fit: "Flared",
    description:
      "A flared party dress with a graceful skirt and clean bodice. Movement-friendly and camera-ready without looking overdone.",
    image: px(985635),
    image2: u("photo-1572804013309-59a88b7e92f1"),
  },
  {
    name: "CloudSoft Resort Maxi",
    category: "Dresses",
    extraCategory: "Maxi Dresses",
    brand: "CloudSoft",
    gender: "WOMEN",
    price: 3799,
    mrp: 5199,
    sku: "NX-DR-007",
    fabric: "Breathable viscose",
    fit: "Flowing",
    description:
      "A resort maxi with easy movement and a soft hand-feel. Ideal for vacations, brunches, and warm-weather evenings.",
    image: u("photo-1539008835657-9e8e9680c956"),
    image2: u("photo-1496747611176-843222e1e57c"),
    image3: px(20410887),
    care: "Hand wash cold. Do not tumble dry. Steam to release travel creases.",
    origin: "Woven viscose · Made for tropical humidity",
    styling: "Belt the waist for structure, or wear loose with flat sandals.",
    model: "Model is 174 cm and wears size S",
  },
  {
    name: "SilkRoad Linen Maxi Dress",
    category: "Dresses",
    extraCategory: "Maxi Dresses",
    brand: "SilkRoad",
    gender: "WOMEN",
    price: 4299,
    mrp: 5899,
    sku: "NX-DR-008",
    fabric: "Washed linen",
    fit: "Easy",
    description:
      "A washed linen maxi with a long, airy line and understated polish. Premium resort dressing for heat and humidity.",
    image: u("photo-1496747611176-843222e1e57c"),
    image2: u("photo-1539008835657-9e8e9680c956"),
  },
  {
    name: "Petal Soft Cotton Midi",
    category: "Dresses",
    extraCategory: "Midi Dresses",
    brand: "Petal",
    gender: "WOMEN",
    price: 2899,
    mrp: 3999,
    sku: "NX-DR-009",
    fabric: "Combed cotton",
    fit: "Soft A-line",
    description:
      "A mid-length cotton dress with a soft A-line and quiet detailing. Day-to-dinner versatility with a premium finish.",
    image: u("photo-1572804013309-59a88b7e92f1"),
    image2: px(20410887),
  },
  {
    name: "SilkRoad Tailored Midi Dress",
    category: "Dresses",
    extraCategory: "Midi Dresses",
    brand: "SilkRoad",
    gender: "WOMEN",
    price: 3499,
    mrp: 4799,
    sku: "NX-DR-010",
    fabric: "Structured crepe",
    fit: "Tailored",
    description:
      "A tailored midi with a precise hem and refined waist. Designed for meetings, dinners, and polished city days.",
    image: px(31808831),
    image2: px(31132239),
  },
  {
    name: "UrbanThread Wrap Mini",
    category: "Dresses",
    extraCategory: "Mini Dresses",
    brand: "UrbanThread",
    gender: "WOMEN",
    price: 2599,
    mrp: 3499,
    sku: "NX-DR-011",
    fabric: "Stretch jersey",
    fit: "Wrap",
    description:
      "A modern wrap mini with a clean neckline and flattering tie waist. Sharp, confident, and ready for evening plans.",
    image: px(2043590),
    image2: px(794062),
  },
  {
    name: "NovaGlow Skater Mini Dress",
    category: "Dresses",
    extraCategory: "Mini Dresses",
    brand: "NovaGlow",
    gender: "WOMEN",
    price: 2799,
    mrp: 3799,
    sku: "NX-DR-012",
    fabric: "Soft scuba crepe",
    fit: "Skater",
    description:
      "A skater mini with a defined waist and flared skirt. Light structure, smooth finish, and strong occasion presence.",
    image: px(794062),
    image2: px(2043590),
  },
  {
    name: "Petal Embroidered Anarkali",
    category: "Ethnic Wear",
    extraCategory: "Ethnic Dresses",
    brand: "Petal",
    gender: "WOMEN",
    price: 4999,
    mrp: 6999,
    sku: "NX-DR-013",
    fabric: "Georgette with embroidery",
    fit: "Flared anarkali",
    description:
      "A festive anarkali with delicate embroidery and a graceful flare. Designed for celebrations, family gatherings, and formal ethnic occasions.",
    image: u("photo-1610030469983-98e550d6193c"),
    image2: u("photo-1583391733956-3750e0ff4e8b"),
  },
  {
    name: "SilkRoad Festive Kurta Set",
    category: "Ethnic Wear",
    extraCategory: "Ethnic Dresses",
    brand: "SilkRoad",
    gender: "WOMEN",
    price: 3899,
    mrp: 5499,
    sku: "NX-DR-014",
    fabric: "Art silk blend",
    fit: "Straight",
    description:
      "A refined kurta silhouette in an art-silk blend with festive depth. Wear it for celebrations where elegance matters more than excess.",
    image: u("photo-1594737625785-a6cbdabd333c"),
    image2: u("photo-1610030469983-98e550d6193c"),
  },
  {
    name: "UrbanThread Silk Soft Shirt",
    category: "Tops",
    brand: "UrbanThread",
    gender: "WOMEN",
    price: 1999,
    mrp: 2799,
    sku: "NX-CL-015",
    fabric: "Silk-touch cotton",
    fit: "Relaxed",
    description:
      "A soft shirt with a clean collar and relaxed drape. Premium basics elevated — layer it under jackets or wear alone.",
    image: px(1926769),
    image2: px(1852382),
  },
  {
    name: "Petal Fluid Silk Blouse",
    category: "Tops",
    brand: "Petal",
    gender: "WOMEN",
    price: 2699,
    mrp: 3699,
    sku: "NX-CL-016",
    fabric: "Fluid silk blend",
    fit: "Soft tailored",
    description:
      "A fluid silk-blend blouse with soft sheen and precise finishing. Pair with tailored trousers for an instantly elevated look.",
    image: px(1036623),
    image2: px(1926769),
  },
  {
    name: "CloudSoft Wide-Leg Trousers",
    category: "Bottoms",
    brand: "CloudSoft",
    gender: "WOMEN",
    price: 2899,
    mrp: 3999,
    sku: "NX-CL-017",
    fabric: "Fluid crepe",
    fit: "Wide-leg",
    description:
      "Wide-leg trousers with a fluid fall and clean waist finish. Comfortable structure for travel days and city dressing.",
    image: px(6764007),
    image2: px(6311392),
  },
  {
    name: "UrbanThread Tailored Trousers",
    category: "Bottoms",
    brand: "UrbanThread",
    gender: "WOMEN",
    price: 3299,
    mrp: 4499,
    sku: "NX-CL-018",
    fabric: "Italian-feel wool blend",
    fit: "Straight tailored",
    description:
      "Straight tailored trousers with a sharp crease and polished waistband. Built for boardrooms, dinners, and capsule wardrobes.",
    image: px(6311392),
    image2: px(6764007),
  },
  {
    name: "Lumina Cashmere-Feel Coat",
    category: "Outerwear",
    brand: "Lumina",
    gender: "WOMEN",
    price: 9999,
    mrp: 13999,
    sku: "NX-CL-019",
    fabric: "Cashmere-feel wool blend",
    fit: "Longline",
    description:
      "A longline coat with a soft hand-feel and architectural collar. Premium outerwear for cooler evenings and travel layers.",
    image: px(3317434),
    image2: px(2043590),
  },
  {
    name: "NovaGlow Structured Crop Jacket",
    category: "Outerwear",
    brand: "NovaGlow",
    gender: "WOMEN",
    price: 5499,
    mrp: 7499,
    sku: "NX-CL-020",
    fabric: "Structured twill",
    fit: "Cropped",
    description:
      "A cropped jacket with clean shoulders and modern structure. Layer over dresses or trousers for a sharp, contemporary finish.",
    image: px(291762),
    image2: px(2043590),
  },
  {
    name: "UrbanThread Oxford Shirt",
    category: "Tops",
    brand: "UrbanThread",
    gender: "MEN",
    price: 2299,
    mrp: 3199,
    sku: "NX-MN-021",
    fabric: "Egyptian cotton oxford",
    fit: "Regular",
    description:
      "A crisp oxford with a clean collar and garment-washed ease. Built as a wardrobe constant — office, travel, or weekend.",
    image: px(1043474),
    image2: u("photo-1488161628813-04466f872be2"),
    image3: u("photo-1617137968427-85924c800a22"),
    care: "Machine wash cold. Hang dry. Iron while slightly damp.",
    origin: "Woven cotton · Studio finished",
    styling: "Wear open over a tee, or tucked into tailored trousers.",
    model: "Model is 185 cm and wears size M",
  },
  {
    name: "CloudSoft Merino Crew",
    category: "Tops",
    brand: "CloudSoft",
    gender: "MEN",
    price: 2799,
    mrp: 3899,
    sku: "NX-MN-022",
    fabric: "Fine merino knit",
    fit: "Slim",
    description:
      "A fine-gauge merino crew with a quiet drape and year-round weight. Layer under a coat or wear alone.",
    image: px(1183266),
    image2: px(842811),
    care: "Hand wash or dry clean. Lay flat to dry.",
    origin: "Merino yarn · Studio knit",
    styling: "Pair with wide trousers and leather loafers.",
    model: "Model is 183 cm and wears size M",
  },
  {
    name: "Lumina Wool Overcoat",
    category: "Outerwear",
    brand: "Lumina",
    gender: "MEN",
    price: 11999,
    mrp: 15999,
    sku: "NX-MN-023",
    fabric: "Wool-cashmere blend",
    fit: "Longline",
    description:
      "A longline overcoat with a structured shoulder and soft hand. The winter layer that finishes every look.",
    image: px(842811),
    image2: u("photo-1617137968427-85924c800a22"),
    care: "Dry clean only. Brush between wears. Store on a wide hanger.",
    origin: "Wool blend · Studio tailored",
    styling: "Wear over a knit and trousers, or over a full suit.",
    model: "Model is 186 cm and wears size M",
  },
  {
    name: "UrbanThread Tailored Chinos",
    category: "Bottoms",
    brand: "UrbanThread",
    gender: "MEN",
    price: 2599,
    mrp: 3499,
    sku: "NX-MN-024",
    fabric: "Stretch cotton twill",
    fit: "Tapered",
    description:
      "Tapered chinos with a clean crease and easy stretch. Desk to dinner without a wardrobe change.",
    image: u("photo-1488161628813-04466f872be2"),
    image2: u("photo-1617137968427-85924c800a22"),
    care: "Machine wash cold. Tumble low. Steam to restore the crease.",
    origin: "Cotton twill · Studio made",
    styling: "Pair with the Oxford shirt and loafers.",
    model: "Model is 185 cm and wears size M",
  },
  {
    name: "UrbanThread Balloon Sleeve Sale Set",
    category: "Tops",
    extraCategory: "Bottoms",
    brand: "UrbanThread",
    gender: "WOMEN",
    price: 1299,
    mrp: 2499,
    sku: "NX-WS-025",
    fabric: "Cotton-blend poplin",
    fit: "Oversized top · A-line mini",
    description:
      "A monochrome off-shoulder balloon-sleeve blouse with a flared peplum and matching black mini skirt, finished with a slim belt and gold buckle. A high-contrast sale look for warm days and city evenings.",
    image: "/products/urbanthread-balloon-sleeve-set.jpg",
    image2: px(13076542),
    care: "Cold gentle wash. Hang dry. Steam sleeves — do not iron the volume.",
    origin: "Designed in-house · Cotton blend",
    styling: "Keep jewellery minimal; let the sleeves and gold buckle lead.",
    model: "Model wears size S",
  },
];
