import { PrismaClient, ProductCategory, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Trend Street database seed on Supabase PostgreSQL...");

  // 1. Seed or update Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "global" },
    update: {
      storeName: "Trend Street",
      storeTagline: "Architectural Luxury Streetwear",
      announcementText: "COMPLIMENTARY BLUE DART AIR DELIVERY ACROSS INDIA ON ALL ORDERS OVER ₹1,999",
      announcementActive: true,
      heroTitle1: "Architectural Drape.",
      heroTitle2: "Uncompromising Menswear.",
      heroSubtitle: "Engineered in Mumbai from heavyweight Okayama selvedge denim, 520gsm French Terry, and custom-loomed luxury textiles.",
      heroBadge: "Atelier Collection 2026",
      conciergePhone: "+91 98200 12345",
      conciergeEmail: "concierge@trendstreet.in",
    },
    create: {
      id: "global",
      storeName: "Trend Street",
      storeTagline: "Architectural Luxury Streetwear",
      announcementText: "COMPLIMENTARY BLUE DART AIR DELIVERY ACROSS INDIA ON ALL ORDERS OVER ₹1,999",
      announcementActive: true,
      heroTitle1: "Architectural Drape.",
      heroTitle2: "Uncompromising Menswear.",
      heroSubtitle: "Engineered in Mumbai from heavyweight Okayama selvedge denim, 520gsm French Terry, and custom-loomed luxury textiles.",
      heroBadge: "Atelier Collection 2026",
      conciergePhone: "+91 98200 12345",
      conciergeEmail: "concierge@trendstreet.in",
    },
  });
  console.log("✓ Site settings seeded.");

  // 2. Seed Initial Admin User
  await prisma.user.upsert({
    where: { email: "sujal@.com" },
    update: {
      role: Role.ADMIN,
      name: "Sujal Solanki",
    },
    create: {
      email: "sujal@.com",
      // No password stored: admin sign-in uses ADMIN_EMAIL / ADMIN_PASSWORD from the environment.
      name: "Sujal Solanki",
      role: Role.ADMIN,
    },
  });
  console.log("✓ Admin user (sujal@.com) seeded.");

  // 3. Seed Active Promo Coupons
  const coupons = [
    {
      code: "TREND10",
      discountPercent: 10,
      description: "10% off on orders of ₹1,999 or more",
      minSpend: 199900,
      active: true,
    },
    {
      code: "VIP15",
      discountPercent: 15,
      description: "15% VIP atelier discount on orders over ₹4,999",
      minSpend: 499900,
      active: true,
    },
    {
      code: "FREESHIP",
      discountPercent: 0,
      description: "Complimentary priority express shipping on any order",
      minSpend: 0,
      active: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log("✓ Promotional coupons seeded.");

  // 4. Seed Products across the 4 Core Silhouettes
  const productsData = [
    // --- 1. OVERSIZED ---
    {
      id: "ts-001",
      slug: "mayfair-heavyweight-oversized-tee",
      name: "The Mayfair Heavyweight Oversized Tee",
      subtitle: "320gsm Combed Cotton with Dropped Shoulder Cut",
      category: ProductCategory.OVERSIZED,
      description: "An architectural everyday essential cut with an exaggerated dropped shoulder, wide 3cm ribbed collar, and a relaxed, heavy silhouette that maintains its structured boxy drape all day.",
      fabric: "320gsm Ultra-Heavy Combed Cotton",
      careInstructions: ["Machine wash cold inside out", "Hang dry in shade", "Do not tumble dry"],
      details: [
        "100% Heavyweight Long-Staple Combed Cotton (320gsm)",
        "High-density rib knit collar that resists stretching",
        "Seamless dropped shoulders for natural silhouette drape",
        "Pre-shrunk and garment-dyed in small batches",
        "Blind-stitched sleeve and waist hems",
      ],
      basePrice: 249900, // ₹2,499
      originalPrice: 299900,
      featured: true,
      isNew: false,
      isBestSeller: true,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [
        { name: "Deep Burgundy", hex: "#4A1216" },
        { name: "Dark Espresso", hex: "#2B080A" },
        { name: "Warm Ivory", hex: "#F9F6F4" },
      ],
    },
    {
      id: "ts-002",
      slug: "tokyo-drop-shoulder-oversized-hoodie",
      name: "The Tokyo Drop-Shoulder Oversized Hoodie",
      subtitle: "520gsm Loopback French Terry with Double-Walled Hood",
      category: ProductCategory.OVERSIZED,
      description: "Sculpted from exceptionally dense 520gsm loopback cotton. Features an oversized double-layered hood without drawstrings for clean architectural lines.",
      fabric: "520gsm Loopback French Terry Cotton",
      careInstructions: ["Machine wash gentle cold", "Dry flat", "Cool iron on reverse"],
      details: [
        "520gsm heavyweight loopback French Terry",
        "Double-walled structured hood designed to stand upright",
        "Discreet inseam kangaroo pocket with bar-tack reinforcement",
        "Ribbed 1x1 heavy knit cuffs and waist",
      ],
      basePrice: 499900, // ₹4,999
      originalPrice: 599900,
      featured: true,
      isNew: true,
      isBestSeller: false,
      images: [
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [
        { name: "Deep Burgundy", hex: "#4A1216" },
        { name: "Dark Espresso", hex: "#2B080A" },
      ],
    },
    // --- 2. JEANS ---
    {
      id: "ts-004",
      slug: "okayama-15oz-selvedge-wide-leg-denim",
      name: "The Okayama 15oz Selvedge Wide-Leg Denim",
      subtitle: "Kuroki Mills Raw Selvedge with Redline ID",
      category: ProductCategory.JEANS,
      description: "Loomed in Kojima, Japan on vintage shuttle looms. Raw, unwashed 15oz red-line selvedge with a wide straight leg that pools cleanly over footwear.",
      fabric: "15oz 100% Japanese Selvedge Denim (Kuroki Mills)",
      careInstructions: ["Wear 6 months before first wash", "Cold soak inside out", "Hang dry"],
      details: [
        "15oz pure indigo shuttle-loomed Japanese denim",
        "Classic red-line selvedge ID on coin pocket and outseam",
        "Solid custom brass buttons with antique patina",
        "Hidden back pocket rivets and chain-stitched hem",
      ],
      basePrice: 549900, // ₹5,499
      originalPrice: 649900,
      featured: true,
      isNew: false,
      isBestSeller: true,
      images: [
        "https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["30", "32", "34", "36"],
      colors: [
        { name: "Raw Indigo", hex: "#1A2536" },
        { name: "Washed Obsidian", hex: "#1A1A1A" },
      ],
    },
    {
      id: "ts-005",
      slug: "okayama-bootcut-flare-denim",
      name: "The Okayama Bootcut Flare Denim",
      subtitle: "14.5oz Japanese Selvedge with Puddle Stack",
      category: ProductCategory.JEANS,
      description: "Meticulously proportioned with a subtle flare from knee to hem, creating an elongated architectural puddle stack over footwear. Features chain-stitched hems and custom copper hardware.",
      fabric: "14.5oz Japanese Raw Indigo Selvedge",
      careInstructions: ["Cold wash inside out", "Hang dry", "Do not machine dry"],
      details: [
        "14.5oz ring-spun Okayama selvedge denim",
        "Subtle flared leg opening designed for puddle drape",
        "Solid copper rivet reinforcements",
        "Custom leather debossed patch with atelier seal",
      ],
      basePrice: 599900, // ₹5,999
      originalPrice: 699900,
      featured: true,
      isNew: true,
      isBestSeller: false,
      images: [
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["30", "32", "34", "36"],
      colors: [
        { name: "Raw Indigo", hex: "#1A2536" },
      ],
    },
    // --- 3. BOXY FIT ---
    {
      id: "ts-007",
      slug: "berlin-cropped-boxy-tee",
      name: "The Berlin Cropped Boxy Tee",
      subtitle: "290gsm Mercerized Jersey with Square Cut Torso",
      category: ProductCategory.BOXY_FIT,
      description: "An intentional wide square cut with a cropped hemline hitting precisely at the belt-line. Engineered to accentuate wide-leg trousers and pleated jeans.",
      fabric: "290gsm Double-Mercerized Egyptian Cotton",
      careInstructions: ["Machine wash cold", "Do not wring", "Dry flat"],
      details: [
        "290gsm double-mercerized silky cotton finish",
        "Calculated box cut: 4cm wider body with shortened torso",
        "Double-needle neck binding with zero seam exposure",
      ],
      basePrice: 249900, // ₹2,499
      originalPrice: 299900,
      featured: true,
      isNew: false,
      isBestSeller: true,
      images: [
        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Warm Ivory", hex: "#F9F6F4" },
        { name: "Deep Burgundy", hex: "#4A1216" },
      ],
    },
    // --- 4. JACKETS ---
    {
      id: "ts-010",
      slug: "mayfair-wool-cashmere-flight-coat",
      name: "The Mayfair Wool-Cashmere Flight Coat",
      subtitle: "Double-Faced 700gsm Melton Wool with Storm Flap",
      category: ProductCategory.JACKETS,
      description: "The pinnacle of architectural streetwear outerwear. Combines the structured drape of military flight outerwear with modern dropped shoulders and Italian RiRi hardware.",
      fabric: "80% Melton Wool / 20% Mongolian Cashmere (700gsm)",
      careInstructions: ["Specialist dry clean only", "Store on broad cedar hanger"],
      details: [
        "700gsm double-faced wool-cashmere blend",
        "Full Bemberg cupro lining for friction-free layering",
        "Horn buttons etched with Trend Street monogram",
        "Internal chest passport pocket with brass RiRi zipper",
      ],
      basePrice: 1199900, // ₹11,999
      originalPrice: 1399900,
      featured: true,
      isNew: false,
      isBestSeller: true,
      images: [
        "https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [
        { name: "Dark Espresso", hex: "#2B080A" },
        { name: "Deep Burgundy", hex: "#4A1216" },
      ],
    },
    {
      id: "ts-011",
      slug: "tuscan-suede-flight-jacket",
      name: "The Tuscan Suede Flight Jacket",
      subtitle: "Heavyweight Italian Calf Suede with RiRi Two-Way Zippers",
      category: ProductCategory.JACKETS,
      description: "Crafted in Florence from supple 1.4mm Italian calf suede with a cropped, boxy flight cut, elasticized rear hem, and two-way RiRi zippers.",
      fabric: "1.4mm Italian Calf Suede with Silk-Blend Lining",
      careInstructions: ["Specialist leather clean only", "Avoid direct rain"],
      details: [
        "1.4mm full-grain Italian calf suede",
        "Custom RiRi M8 two-way zipper in brushed nickel",
        "Quilted silk-blend interior insulation",
        "Drop-shoulder boxy flight cut",
      ],
      basePrice: 1099900, // ₹10,999
      originalPrice: 1249900,
      featured: true,
      isNew: true,
      isBestSeller: false,
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Dark Espresso", hex: "#2B080A" },
      ],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: {
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        description: p.description,
        fabric: p.fabric,
        careInstructions: p.careInstructions,
        details: p.details,
        basePrice: p.basePrice,
        originalPrice: p.originalPrice,
        featured: p.featured,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
      },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        description: p.description,
        fabric: p.fabric,
        careInstructions: p.careInstructions,
        details: p.details,
        basePrice: p.basePrice,
        originalPrice: p.originalPrice,
        featured: p.featured,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
      },
    });

    // Seed images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < p.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: p.images[i],
          sortOrder: i,
          alt: `${p.name} - View ${i + 1}`,
        },
      });
    }

    // Seed variants and inventory
    for (const size of p.sizes) {
      for (const color of p.colors) {
        const sku = `${p.id}-${size}-${color.name.toUpperCase().replace(/\s+/g, "_")}`;
        const variant = await prisma.productVariant.upsert({
          where: { sku },
          update: {
            size,
            colorName: color.name,
            colorHex: color.hex,
          },
          create: {
            productId: product.id,
            size,
            colorName: color.name,
            colorHex: color.hex,
            sku,
            priceDelta: 0,
          },
        });

        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: { quantity: 25 },
          create: {
            variantId: variant.id,
            quantity: 25,
            reservedQty: 0,
          },
        });
      }
    }
  }

  console.log(`✓ ${productsData.length} luxury products, variants, and inventory seeded.`);
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
