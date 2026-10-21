import { Product } from "@/types/store";

export const INITIAL_PRODUCTS: Product[] = [
  // 1. OVERSIZED
  {
    id: "ts-001",
    name: "The Mayfair Heavyweight Oversized Tee",
    subtitle: "320gsm Combed Cotton with Dropped Shoulder Cut",
    price: 2499,
    originalPrice: 2999,
    category: "Oversized",
    description: "An architectural everyday essential cut with an exaggerated dropped shoulder, wide 3cm ribbed collar, and a relaxed, heavy silhouette that maintains its structured boxy drape all day.",
    details: [
      "100% Heavyweight Long-Staple Combed Cotton (320gsm)",
      "High-density rib knit collar that resists stretching",
      "Seamless dropped shoulders for natural silhouette drape",
      "Pre-shrunk and garment-dyed in small batches",
      "Blind-stitched sleeve and waist hems",
    ],
    fabric: "320gsm Ultra-Heavy Combed Cotton",
    careInstructions: ["Machine wash cold inside out", "Hang dry in shade", "Do not tumble dry"],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Deep Burgundy", hex: "#4A1216" },
      { name: "Dark Espresso", hex: "#2B080A" },
      { name: "Warm Ivory", hex: "#F9F6F4" },
      { name: "Washed Obsidian", hex: "#1A1A1A" },
    ],
    featured: true,
    isNew: false,
    isBestSeller: true,
    inStock: true,
    stockCount: 24,
    rating: 4.9,
    reviewsCount: 48,
    reviews: [
      {
        id: "rev-1",
        author: "Marcus Chen",
        rating: 5,
        date: "October 14, 2026",
        title: "The holy grail of oversized tees",
        comment: "The 320gsm weight is unbelievable. It holds the structure completely away from the body without feeling stiff. The collar sits perfectly flush.",
        verified: true,
      },
    ],
    tags: ["oversized", "heavyweight", "t-shirt", "streetwear", "essentials"],
  },
  {
    id: "ts-002",
    name: "The Tokyo Drop-Shoulder Oversized Hoodie",
    subtitle: "520gsm Loopback French Terry with Double-Walled Hood",
    price: 4999,
    originalPrice: 5799,
    category: "Oversized",
    description: "Engineered with maximum volume and zero compromise. Cut from custom-milled 520gsm Japanese loopback cotton, featuring an oversized hood without drawstrings for an uncompromising brutalist look.",
    details: [
      "520gsm 100% Organic Loopback French Terry",
      "Double-layered structural hood that stands on its own",
      "Dropped shoulders with elongated sleeves and snug wrist rib",
      "Hidden interior side-seam stash pocket",
      "Garment washed for a vintage soft hand-feel",
    ],
    fabric: "520gsm Japanese Loopback Terry",
    careInstructions: ["Cold gentle machine wash", "Reshape while damp", "Dry flat"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Burgundy", hex: "#4A1216" },
      { name: "Vintage Charcoal", hex: "#333333" },
      { name: "Oatmeal Warm Ivory", hex: "#F5F2EB" },
    ],
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 15,
    rating: 5.0,
    reviewsCount: 36,
    reviews: [
      {
        id: "rev-2",
        author: "Liam K.",
        rating: 5,
        date: "October 08, 2026",
        title: "Incredible weight and drape",
        comment: "This hoodie weighs almost 1.5kg. The silhouette is wide and draped in all the right ways.",
        verified: true,
      },
    ],
    tags: ["oversized", "hoodie", "heavyweight", "streetwear", "french terry"],
  },
  {
    id: "ts-003",
    name: "The Kyoto Relaxed Oversized Flannel",
    subtitle: "280gsm Japanese Brushed Ombré Cotton",
    price: 3999,
    originalPrice: 4599,
    category: "Oversized",
    description: "An elevated layering piece cut with an exaggerated chest width and dropped shoulder stance. Woven from slow-loomed Japanese brushed ombré cotton plaid with a velvety hand-feel.",
    details: [
      "100% Japanese Cotton woven in Hamamatsu",
      "Double-brushed interior and exterior for maximum softness",
      "Curved oversized hem with reinforced side gussets",
      "Matte horn buttons with custom laser engraving",
    ],
    fabric: "280gsm Japanese Brushed Flannel",
    careInstructions: ["Machine wash cold", "Line dry", "Cool iron if needed"],
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Burgundy Ombré Plaid", hex: "#4A1216" },
      { name: "Espresso & Ivory Check", hex: "#2B080A" },
    ],
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    stockCount: 18,
    rating: 4.8,
    reviewsCount: 19,
    reviews: [],
    tags: ["oversized", "flannel", "plaid", "layering", "japanese cotton"],
  },

  // 2. JEANS
  {
    id: "ts-004",
    name: "The Shibuya Relaxed Carpenter Jeans",
    subtitle: "14oz Japanese Redline Selvedge Denim with Utility Details",
    price: 5499,
    originalPrice: 6299,
    category: "Jeans",
    description: "Cut with a relaxed wide leg and natural puddle stacking over sneakers. Crafted from 14oz redline selvedge denim woven on vintage Toyoda shuttle looms, complete with utility hammer loop and dual tool pockets.",
    details: [
      "14oz Japanese Redline Selvedge Denim from Okayama",
      "Relaxed baggy thigh transitioning to a loose ankle stack",
      "Reinforced double-layer knees with rivet accents",
      "Heavyweight custom branded nickel hardware",
      "Thick vegetable-tanned leather waistband patch",
    ],
    fabric: "14oz 100% Cotton Selvedge Denim",
    careInstructions: ["Wash infrequently inside out in cold water", "Hang dry strictly"],
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["30", "32", "34", "36", "38"],
    colors: [
      { name: "Washed Vintage Blue", hex: "#5C768D" },
      { name: "Raw Rigid Indigo", hex: "#1A2238" },
      { name: "Washed Charcoal", hex: "#3A3A3A" },
    ],
    featured: true,
    isNew: false,
    isBestSeller: true,
    inStock: true,
    stockCount: 20,
    rating: 4.9,
    reviewsCount: 52,
    reviews: [
      {
        id: "rev-3",
        author: "Devin Rossi",
        rating: 5,
        date: "September 30, 2026",
        title: "Flawless baggy proportions",
        comment: "The stack over sneakers is sublime. Doesn't drag on the floor, has that authentic 90s skater yet elevated luxury feel.",
        verified: true,
      },
    ],
    tags: ["jeans", "denim", "carpenter", "selvedge", "relaxed fit", "wide leg"],
  },
  {
    id: "ts-005",
    name: "The Okayama Bootcut Flare Denim",
    subtitle: "14.5oz Japanese Selvedge Cotton with Flared Leg & Puddle Stacking",
    price: 5999,
    originalPrice: 6999,
    category: "Jeans",
    description: "Engineered with a sculpted upper block through the thigh that gently opens into an authentic bootcut flare below the knee. Woven from 14.5oz Okayama selvedge denim to puddle naturally over sneakers and boots with zero drag.",
    details: [
      "14.5oz Okayama Redline Selvedge Denim",
      "Gentle knee release into an authentic bootcut flare ankle stack",
      "Chain-stitched bottom hem on vintage Union Special machines",
      "Hand-abraded whiskers and natural stone-wash patina",
      "Solid copper hand-hammered hardware",
    ],
    fabric: "14.5oz Okayama Selvedge Denim",
    careInstructions: ["Machine wash cold inside out", "Air dry flat"],
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["30", "32", "34", "36"],
    colors: [
      { name: "Sun-Bleached Light Blue", hex: "#8DA9C4" },
      { name: "Medium Vintage Wash", hex: "#4B6584" },
    ],
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 14,
    rating: 4.9,
    reviewsCount: 22,
    reviews: [
      {
        id: "rev-bootcut-1",
        author: "Kai Vance",
        rating: 5,
        date: "October 16, 2026",
        title: "The ideal bootcut flare",
        comment: "The slight flare at the bottom creates the most satisfying stack over sneakers. Incredibly rigid 14.5oz cotton that drapes without feeling stiff.",
        verified: true,
      },
    ],
    tags: ["jeans", "bootcut", "flare", "denim", "okayama", "selvedge", "puddle stack"],
  },
  {
    id: "ts-006",
    name: "Raw Indigo Straight Baggy Jeans",
    subtitle: "15oz Heavyweight Kurabo Selvedge Denim",
    price: 5499,
    originalPrice: 6499,
    category: "Jeans",
    description: "Unwashed, un-sanforized rigid raw selvedge denim that shapes and molds specifically to your body and lifestyle over years of wear, developing high-contrast personalized fades.",
    details: [
      "15oz Kurabo Mill Japanese Selvedge Raw Denim",
      "Classic 5-pocket straight-cut baggy architecture",
      "Chain-stitched hems on union special machines",
      "Solid copper hand-hammered rivets",
    ],
    fabric: "15oz Rigid Raw Selvedge Cotton",
    careInstructions: ["Wear for 6 months before first cold soak", "Hang dry"],
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["30", "32", "34", "36", "38"],
    colors: [
      { name: "Deep Raw Indigo", hex: "#0E1A2B" },
      { name: "Pitch Black Raw", hex: "#111111" },
    ],
    featured: true,
    isNew: false,
    isBestSeller: true,
    inStock: true,
    stockCount: 11,
    rating: 5.0,
    reviewsCount: 29,
    reviews: [],
    tags: ["jeans", "raw denim", "selvedge", "kurabo", "baggy"],
  },

  // 3. BOXY FIT
  {
    id: "ts-007",
    name: "The Boxy Heavyweight Poplin Overshirt",
    subtitle: "220gsm Crisp Mercerized Cotton with Cropped Square Cut",
    price: 3499,
    originalPrice: 3999,
    category: "Boxy Fit",
    description: "A masterclass in modern geometry. Cut wide across the chest with sharp drop shoulders and cropped at the natural waistline to produce an immaculate proportion when paired with baggy jeans.",
    details: [
      "100% Mercerized High-Density Cotton Poplin (220gsm)",
      "Squared-off flat hem with side split vents",
      "Dual oversized magnetic chest cargo pockets",
      "Concealed button placket with genuine horn buttons",
    ],
    fabric: "220gsm Mercerized Structured Poplin",
    careInstructions: ["Machine wash cold", "Warm steam iron", "Dry on flat surface"],
    images: [
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Burgundy", hex: "#4A1216" },
      { name: "Warm Ivory", hex: "#F9F6F4" },
      { name: "Obsidian Black", hex: "#111111" },
    ],
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 16,
    rating: 4.8,
    reviewsCount: 27,
    reviews: [],
    tags: ["boxy fit", "cropped", "overshirt", "poplin", "minimalist"],
  },
  {
    id: "ts-008",
    name: "The Boxy Structured Knit Sweater",
    subtitle: "100% Extra-Fine Merino Wool in Heavy Gauge Rib",
    price: 4499,
    originalPrice: 5199,
    category: "Boxy Fit",
    description: "Chunky yet refined. Spun from 7-gauge Italian extra-fine merino wool, crafted with a wide horizontal box silhouette, tight collar ring, and clean cropped hem.",
    details: [
      "100% Extra-Fine Italian Merino Wool (7-gauge knit)",
      "Wide boxy body with dropped armholes",
      "Stiff ribbed collar that retains shape permanently",
      "Thermoregulating natural noble fiber",
    ],
    fabric: "Italian Merino Wool",
    careInstructions: ["Hand wash in cool water with wool shampoo", "Dry flat strictly"],
    images: [
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Espresso Shadow", hex: "#2B080A" },
      { name: "Burgundy Marl", hex: "#4A1216" },
      { name: "Ecru Ivory", hex: "#EBE5DF" },
    ],
    featured: false,
    isNew: false,
    isBestSeller: true,
    inStock: true,
    stockCount: 12,
    rating: 4.9,
    reviewsCount: 31,
    reviews: [],
    tags: ["boxy fit", "knitwear", "merino wool", "minimalist", "sweater"],
  },
  {
    id: "ts-009",
    name: "The Boxy Minimalist Half-Zip Sweatshirt",
    subtitle: "480gsm Heavyweight French Terry with Custom Silver Hardware",
    price: 3799,
    originalPrice: 4299,
    category: "Boxy Fit",
    description: "Refined post-streetwear silhouette. Features a wide, relaxed chest, high stand collar with custom matte silver Excella zipper, and a cropped elasticized waist.",
    details: [
      "480gsm 100% Combed Cotton French Terry",
      "Matte silver YKK Excella dual-pull half zipper",
      "High stand funnel collar",
      "Elastic waistband cinch for adjustable box drape",
    ],
    fabric: "480gsm French Terry",
    careInstructions: ["Machine wash cold", "Dry flat"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Burgundy", hex: "#4A1216" },
      { name: "Dark Espresso", hex: "#2B080A" },
      { name: "Heather Grey", hex: "#A8A8A8" },
    ],
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    stockCount: 19,
    rating: 4.7,
    reviewsCount: 16,
    reviews: [],
    tags: ["boxy fit", "half zip", "sweatshirt", "streetwear"],
  },

  // 4. JACKETS
  {
    id: "ts-010",
    name: "The Tuscan Suede MA-1 Flight Jacket",
    subtitle: "Supple Butter-Soft Lambskin Suede with 2-Way Raccagni Zipper",
    price: 8999,
    originalPrice: 10499,
    category: "Jackets",
    description: "Artisanal bomber jacket handcrafted in Florence from velvety Tuscan lambskin suede. Features a relaxed boxy cut, ribbed wool trim, and silky cupro interior.",
    details: [
      "100% Tuscan Lambskin Suede",
      "100% Merino wool ribbed collar, cuffs and waist",
      "Antiqued brass 2-way Raccagni zipper",
      "Internal magnetic closure welt pockets",
      "Silky breathable Bemberg cupro lining",
    ],
    fabric: "Italian Lambskin Suede & Merino Trim",
    careInstructions: ["Specialist leather and suede clean only"],
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Burgundy", hex: "#4A1216" },
      { name: "Dark Espresso", hex: "#2B080A" },
      { name: "Cognac Tobacco", hex: "#8B4513" },
    ],
    featured: true,
    isNew: false,
    isBestSeller: true,
    inStock: true,
    stockCount: 8,
    rating: 5.0,
    reviewsCount: 38,
    reviews: [
      {
        id: "rev-4",
        author: "Julian Thorne",
        rating: 5,
        date: "October 02, 2026",
        title: "Sensational leather craft",
        comment: "The drape of this suede is heavenly. Substantial yet supple, and the Burgundy hue catches evening light beautifully.",
        verified: true,
      },
    ],
    tags: ["jackets", "bomber", "suede", "leather", "flight jacket"],
  },
  {
    id: "ts-011",
    name: "Heavyweight Washed Canvas Workwear Jacket",
    subtitle: "16oz Rugged Cotton Duck with Contrast Corduroy Collar",
    price: 6999,
    originalPrice: 7999,
    category: "Jackets",
    description: "Built like armor. Cut from 16oz tightly woven duck canvas, pre-washed for immediate comfort and break-in. Finished with a heavy corduroy collar and insulated quilted flannel lining.",
    details: [
      "16oz Heavy-Duty Ring-Spun Cotton Duck Canvas",
      "100% Cotton 8-wale corduroy collar",
      "Quilted 120gsm thermal flannel lining",
      "Triple-needle flat-felled chain stitching across all strain points",
      "Heavy brass front zipper with storm flap",
    ],
    fabric: "16oz Heavy Cotton Duck Canvas",
    careInstructions: ["Spot clean with damp cloth", "Cold gentle machine wash when needed"],
    images: [
      "https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Burgundy Washed Canvas", hex: "#4A1216" },
      { name: "Dark Espresso Duck", hex: "#2B080A" },
      { name: "Vintage Tan", hex: "#C19A6B" },
    ],
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 14,
    rating: 4.9,
    reviewsCount: 41,
    reviews: [],
    tags: ["jackets", "workwear", "canvas", "duck canvas", "outerwear"],
  },
  {
    id: "ts-012",
    name: "The Mayfair Boxy Leather Moto Jacket",
    subtitle: "100% Full-Grain Vegetable-Tanned Cowhide",
    price: 11999,
    originalPrice: 13999,
    category: "Jackets",
    description: "An heirloom piece engineered with an exaggerated boxy dropped-shoulder silhouette. Cut from 1.3mm full-grain cowhide that breaks in into a gleaming buttery leather armor.",
    details: [
      "100% Vegetable-Tanned Italian Full-Grain Cowhide (1.3mm)",
      "Heavy gauge antiqued silver hardware throughout",
      "Boxy cropped cut with action back shoulder pleats",
      "Custom Burgundy jacquard silk-blend lining",
      "Belted waist with removable buckle",
    ],
    fabric: "Full-Grain Italian Cowhide",
    careInstructions: ["Specialist leather care only", "Condition with natural beeswax balsam"],
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Obsidian Black", hex: "#111111" },
      { name: "Oxblood Burgundy", hex: "#4A1216" },
    ],
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    stockCount: 6,
    rating: 5.0,
    reviewsCount: 15,
    reviews: [],
    tags: ["jackets", "leather", "moto", "full-grain", "boxy fit"],
  },

  // --- JODHPUR EDIT (placeholder copy & imagery — replace with your real range) ---
  {
    id: "ts-013",
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Blue City Indigo Oversized Tee",
    subtitle: "260gsm Cotton, Indigo-Dipped in Small Batches",
    price: 1999,
    originalPrice: 2499,
    category: "Oversized",
    description: "Named for Jodhpur's indigo-washed old city. Each tee is dipped by hand, so the blue settles a little differently on every piece. Dropped shoulders, wide body, built for 40° afternoons.",
    details: [
      "260gsm breathable combed cotton",
      "Hand-dipped indigo — no two identical",
      "Dropped shoulder, relaxed body",
      "Pre-washed to limit shrinkage"
    ],
    fabric: "260gsm Indigo-Dyed Combed Cotton",
    careInstructions: [
      "Wash separately in cold water for the first 3 washes",
      "Dry in shade",
      "Do not bleach"
    ],
    images: [
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    colors: [
      {
        name: "Blue City Indigo",
        hex: "#1F3A6B"
      },
      {
        name: "Neel Wash",
        hex: "#4A6A9B"
      }
    ],
    stockCount: 34,
    tags: [
      "oversized",
      "indigo",
      "jodhpur",
      "summer"
    ]
  },
  {
    id: "ts-014",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Bandhani Dot Oversized Tee",
    subtitle: "Tie-Dye Dot Pattern on 240gsm Cotton",
    price: 2199,
    originalPrice: 2699,
    category: "Oversized",
    description: "Marwar's bandhani tie-and-dye, scaled up for streetwear. Tiny resist dots scatter across a roomy cut that stays cool in desert heat.",
    details: [
      "240gsm cotton jersey",
      "Bandhani-style resist-dye dots",
      "Oversized drop-shoulder fit",
      "Ribbed crew neck"
    ],
    fabric: "240gsm Tie-Dyed Cotton Jersey",
    careInstructions: [
      "Hand wash cold",
      "Dry inside out in shade"
    ],
    images: [
      "https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Marigold",
        hex: "#E39B2D"
      },
      {
        name: "Rani Pink",
        hex: "#C2185B"
      }
    ],
    stockCount: 8,
    tags: [
      "oversized",
      "bandhani",
      "tie-dye",
      "festive"
    ]
  },
  {
    id: "ts-015",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Mehrangarh Skyline Graphic Tee",
    subtitle: "Puff-Print Fort Silhouette, 280gsm",
    price: 1899,
    category: "Oversized",
    description: "The fort's ridge-line, printed across the back in raised puff ink. A heavyweight everyday tee with a story you can wear.",
    details: [
      "280gsm heavyweight cotton",
      "Raised puff-print back graphic",
      "Oversized fit",
      "Twin-needle hems"
    ],
    fabric: "280gsm Heavyweight Cotton",
    careInstructions: [
      "Wash inside out",
      "Do not iron on print"
    ],
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    colors: [
      {
        name: "Sandstone",
        hex: "#D8C3A0"
      },
      {
        name: "Washed Black",
        hex: "#1A1A1A"
      }
    ],
    stockCount: 41,
    tags: [
      "oversized",
      "graphic",
      "jodhpur"
    ]
  },
  {
    id: "ts-016",
    featured: true,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Thar Sand Heavyweight Hoodie",
    subtitle: "400gsm Brushed Fleece for Desert Nights",
    price: 3999,
    originalPrice: 4699,
    category: "Oversized",
    description: "Thar evenings drop fast. A dense brushed-fleece hoodie in desert sand, with a double-layer hood and kangaroo pocket.",
    details: [
      "400gsm brushed-back fleece",
      "Double-layer hood",
      "Kangaroo pocket",
      "Ribbed cuffs and hem"
    ],
    fabric: "400gsm Brushed Cotton Fleece",
    careInstructions: [
      "Machine wash cold",
      "Tumble dry low"
    ],
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Thar Sand",
        hex: "#C9A97A"
      },
      {
        name: "Dune Grey",
        hex: "#8C8478"
      }
    ],
    stockCount: 22,
    tags: [
      "oversized",
      "hoodie",
      "winter"
    ]
  },
  {
    id: "ts-017",
    featured: false,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Ghanta Ghar Straight Selvedge",
    subtitle: "13.5oz Selvedge Denim, Straight Leg",
    price: 4499,
    originalPrice: 5299,
    category: "Jeans",
    description: "A clean straight leg in mid-weight selvedge, named after the clock tower at the heart of Sardar Market. Fades in with every wear.",
    details: [
      "13.5oz selvedge denim",
      "Straight leg, mid rise",
      "Copper rivets",
      "Selvedge cuff detail"
    ],
    fabric: "13.5oz Raw Selvedge Denim",
    careInstructions: [
      "Wash rarely, inside out, cold",
      "Line dry"
    ],
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "28",
      "30",
      "32",
      "34",
      "36"
    ],
    colors: [
      {
        name: "Raw Indigo",
        hex: "#1B2A4A"
      }
    ],
    stockCount: 19,
    tags: [
      "jeans",
      "selvedge",
      "straight"
    ]
  },
  {
    id: "ts-018",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Dabu Print Wide-Leg Denim",
    subtitle: "Mud-Resist Print Panels on Light Denim",
    price: 4999,
    category: "Jeans",
    description: "Rajasthan's dabu mud-resist printing meets a relaxed wide leg. Printed side panels make it a statement without trying too hard.",
    details: [
      "11oz light denim",
      "Dabu-style printed side panels",
      "Relaxed wide leg",
      "Button fly"
    ],
    fabric: "11oz Cotton Denim",
    careInstructions: [
      "Hand wash cold",
      "Dry in shade to protect the print"
    ],
    images: [
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "28",
      "30",
      "32",
      "34"
    ],
    colors: [
      {
        name: "Stone Wash",
        hex: "#7C93B5"
      }
    ],
    stockCount: 6,
    tags: [
      "jeans",
      "dabu",
      "block print",
      "wide leg"
    ]
  },
  {
    id: "ts-019",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Sardar Market Carpenter Jeans",
    subtitle: "Utility Pockets, Relaxed Taper",
    price: 3799,
    originalPrice: 4299,
    category: "Jeans",
    description: "Built for walking the bazaar all day: a hammer loop, tool pocket and a relaxed taper that stacks over sneakers.",
    details: [
      "12oz cotton denim",
      "Hammer loop and tool pocket",
      "Relaxed tapered leg",
      "Bar-tacked stress points"
    ],
    fabric: "12oz Cotton Denim",
    careInstructions: [
      "Machine wash cold inside out",
      "Line dry"
    ],
    images: [
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "30",
      "32",
      "34",
      "36"
    ],
    colors: [
      {
        name: "Mid Blue",
        hex: "#3F5F8F"
      },
      {
        name: "Jet Black",
        hex: "#111111"
      }
    ],
    stockCount: 27,
    tags: [
      "jeans",
      "carpenter",
      "utility"
    ]
  },
  {
    id: "ts-020",
    featured: true,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Bagru Block-Print Boxy Shirt",
    subtitle: "Hand Block-Printed Cotton, Cropped Boxy Cut",
    price: 2899,
    originalPrice: 3399,
    category: "Boxy Fit",
    description: "Printed with carved wooden blocks in the Bagru tradition, then cut short and wide. Camp collar, breathable cotton, made for summer weddings and city nights alike.",
    details: [
      "Hand block-printed cotton poplin",
      "Camp collar",
      "Cropped boxy hem",
      "Coconut-shell buttons"
    ],
    fabric: "Block-Printed Cotton Poplin",
    careInstructions: [
      "Hand wash cold separately",
      "Dry in shade"
    ],
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Indigo Block",
        hex: "#26407A"
      },
      {
        name: "Terracotta Block",
        hex: "#B5523B"
      }
    ],
    stockCount: 9,
    tags: [
      "boxy fit",
      "block print",
      "bagru",
      "festive"
    ]
  },
  {
    id: "ts-021",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Leheriya Stripe Boxy Tee",
    subtitle: "Diagonal Wave-Dye, 220gsm Cotton",
    price: 1999,
    category: "Boxy Fit",
    description: "Leheriya's diagonal 'wave' stripes, the dye pattern of Rajasthani monsoons, on a cropped boxy tee.",
    details: [
      "220gsm cotton",
      "Leheriya-style diagonal dye",
      "Cropped boxy fit",
      "Wide 2.5cm collar"
    ],
    fabric: "220gsm Wave-Dyed Cotton",
    careInstructions: [
      "Wash cold separately",
      "Dry in shade"
    ],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Saffron Wave",
        hex: "#E07A1F"
      },
      {
        name: "Peacock Wave",
        hex: "#0F6E74"
      }
    ],
    stockCount: 30,
    tags: [
      "boxy fit",
      "leheriya",
      "monsoon"
    ]
  },
  {
    id: "ts-022",
    featured: true,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Jodhpuri Bandhgala Bomber",
    subtitle: "Band-Collar Bomber in Wool Blend",
    price: 6999,
    originalPrice: 7999,
    category: "Jackets",
    description: "The Jodhpuri bandhgala's stand collar, reworked as a streetwear bomber. Sharp enough for a sangeet, easy enough for every day.",
    details: [
      "Wool-blend shell",
      "Bandhgala stand collar",
      "Antique brass zip",
      "Quilted satin lining"
    ],
    fabric: "Wool-Blend Twill",
    careInstructions: [
      "Dry clean only"
    ],
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Royal Indigo",
        hex: "#1F2E5A"
      },
      {
        name: "Mehrangarh Red",
        hex: "#8E2F25"
      }
    ],
    stockCount: 7,
    tags: [
      "jackets",
      "bandhgala",
      "jodhpuri",
      "wedding"
    ]
  },
  {
    id: "ts-023",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Indigo Chore Jacket",
    subtitle: "Garment-Dyed Cotton Drill, Three Patch Pockets",
    price: 5499,
    category: "Jackets",
    description: "A workwear chore coat dyed deep indigo. Three patch pockets, a soft drill hand, and it only gets better with wear.",
    details: [
      "Garment-dyed cotton drill",
      "Three patch pockets",
      "Corozo buttons",
      "Unlined for warm days"
    ],
    fabric: "Garment-Dyed Cotton Drill",
    careInstructions: [
      "Wash cold separately",
      "Line dry"
    ],
    images: [
      "https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    colors: [
      {
        name: "Deep Indigo",
        hex: "#1C2D52"
      }
    ],
    stockCount: 16,
    tags: [
      "jackets",
      "chore",
      "indigo"
    ]
  },
  {
    id: "ts-024",
    featured: false,
    isNew: true,
    isBestSeller: false,
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    name: "Desert Utility Field Jacket",
    subtitle: "Water-Resistant Cotton Canvas",
    price: 5999,
    originalPrice: 6799,
    category: "Jackets",
    description: "Four bellow pockets, a stowaway hood and a sand-toned canvas that shrugs off dust storms and drizzle.",
    details: [
      "Water-resistant cotton canvas",
      "Four bellow pockets",
      "Stowaway hood",
      "Drawcord waist"
    ],
    fabric: "Waxed-Finish Cotton Canvas",
    careInstructions: [
      "Spot clean",
      "Do not tumble dry"
    ],
    images: [
      "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: [
      "M",
      "L",
      "XL"
    ],
    colors: [
      {
        name: "Dune Olive",
        hex: "#6B6A45"
      },
      {
        name: "Thar Sand",
        hex: "#C9A97A"
      }
    ],
    stockCount: 12,
    tags: [
      "jackets",
      "utility",
      "field"
    ]
  },
];
