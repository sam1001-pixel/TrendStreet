/**
 * Curated outfits for /complete-the-fit. Every piece references a real catalog id,
 * so prices, sizes and stock always come from the live catalog.
 */
export interface LookPiece {
  productId: string;
  role: "Top" | "Layer" | "Bottom" | "Outerwear";
}

export interface CuratedLook {
  id: string;
  name: string;
  vibe: string;
  occasion: "Everyday" | "Festive" | "Winter" | "Summer" | "Night out";
  image: string;
  note: string;
  pieces: LookPiece[];
}

/** Bundle saving applied via the server-honoured BUNDLE15 code. */
export const BUNDLE_PERCENT = 15;
export const BUNDLE_CODE = "BUNDLE15";

export const CURATED_LOOKS: CuratedLook[] = [
  {
    id: "shibuya-uniform",
    name: "The Shibuya Uniform",
    vibe: "Heavy tee, wide carpenter denim, washed canvas layer",
    occasion: "Everyday",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop",
    note: "The 320gsm tee keeps its shoulder line under the canvas jacket, and the carpenter leg stacks cleanly over chunky sneakers.",
    pieces: [
      { productId: "ts-001", role: "Top" },
      { productId: "ts-011", role: "Outerwear" },
      { productId: "ts-004", role: "Bottom" },
    ],
  },
  {
    id: "milan-flight",
    name: "The Milan Flight Set",
    vibe: "520gsm hoodie under a suede MA-1, raw straight denim",
    occasion: "Winter",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    note: "The double-walled hood stands on its own above the bomber collar. Raw indigo keeps the palette dark and sharp.",
    pieces: [
      { productId: "ts-002", role: "Layer" },
      { productId: "ts-010", role: "Outerwear" },
      { productId: "ts-006", role: "Bottom" },
    ],
  },
  {
    id: "sangeet-night",
    name: "Sangeet Night",
    vibe: "Bandhgala bomber, block-print boxy shirt, straight selvedge",
    occasion: "Festive",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1200&auto=format&fit=crop",
    note: "A Jodhpuri collar without the formality. Wear the Bagru shirt open over the bomber or on its own once the dancing starts.",
    pieces: [
      { productId: "ts-020", role: "Top" },
      { productId: "ts-022", role: "Outerwear" },
      { productId: "ts-017", role: "Bottom" },
    ],
  },
  {
    id: "summer-40",
    name: "Forty Degrees",
    vibe: "Indigo tee, leheriya boxy tee, wide-leg dabu denim",
    occasion: "Summer",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    note: "Breathable cotton in two layers you can split apart by noon. The wide leg lets air move, the indigo hides the heat.",
    pieces: [
      { productId: "ts-013", role: "Top" },
      { productId: "ts-021", role: "Layer" },
      { productId: "ts-018", role: "Bottom" },
    ],
  },
  {
    id: "after-dark",
    name: "After Dark",
    vibe: "Boxy knit, leather moto, bootcut flare",
    occasion: "Night out",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=1200&auto=format&fit=crop",
    note: "The cropped knit sits at the belt so the moto closes clean. The flare breaks over boots for a long, low line.",
    pieces: [
      { productId: "ts-008", role: "Top" },
      { productId: "ts-012", role: "Outerwear" },
      { productId: "ts-005", role: "Bottom" },
    ],
  },
  {
    id: "thar-field",
    name: "Thar Field Kit",
    vibe: "Sand hoodie, utility field jacket, carpenter denim",
    occasion: "Winter",
    image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=1200&auto=format&fit=crop",
    note: "Earth tones for cold desert nights. Four-pocket field jacket over a heavyweight hoodie; utility denim to match.",
    pieces: [
      { productId: "ts-016", role: "Layer" },
      { productId: "ts-024", role: "Outerwear" },
      { productId: "ts-019", role: "Bottom" },
    ],
  },
];

/* ---------------- Shop Your Way ---------------- */

export interface Budget {
  id: string;
  label: string;
  short: string;
  min: number;
  max: number;
}

export const BUDGETS: Budget[] = [
  { id: "u2k", label: "Under ₹2,000", short: "< ₹2K", min: 0, max: 1999 },
  { id: "2-4k", label: "₹2,000 – ₹4,000", short: "₹2–4K", min: 2000, max: 3999 },
  { id: "4-6k", label: "₹4,000 – ₹6,000", short: "₹4–6K", min: 4000, max: 5999 },
  { id: "6k", label: "₹6,000 and up", short: "₹6K+", min: 6000, max: Number.MAX_SAFE_INTEGER },
];

export interface Occasion {
  id: string;
  title: string;
  line: string;
  /** Any product carrying one of these tags matches. */
  tags: string[];
  image: string;
}

export const OCCASIONS: Occasion[] = [
  {
    id: "everyday",
    title: "Everyday",
    line: "Tees and denim on repeat",
    tags: ["everyday", "essentials", "minimalist", "straight"],
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "festive",
    title: "Festive & Wedding",
    line: "Block prints, bandhani, bandhgala",
    tags: ["festive", "wedding", "block print", "bandhani"],
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "summer",
    title: "Summer Heat",
    line: "Breathable cotton for 40°+",
    tags: ["summer", "monsoon", "indigo"],
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "winter",
    title: "Winter Layers",
    line: "Hoodies, knits and jackets",
    tags: ["winter", "hoodie", "knitwear", "outerwear", "bomber"],
    image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "street",
    title: "Street Ready",
    line: "Heavyweight, baggy, loud",
    tags: ["streetwear", "baggy", "graphic", "carpenter", "wide leg"],
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "statement",
    title: "Statement Pieces",
    line: "Leather, suede, the big buys",
    tags: ["leather", "suede", "moto", "flight jacket"],
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop",
  },
];
