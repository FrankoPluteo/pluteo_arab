// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Gender = "men" | "women" | "unisex";

function genderFromCode(code: "M" | "W" | "U"): Gender {
  if (code === "M") return "men";
  if (code === "W") return "women";
  return "unisex";
}

async function main() {
  // 1) Brands
  const lattafa = await prisma.brand.upsert({
    where: { name: "Lattafa" },
    update: {},
    create: {
      name: "Lattafa",
      description:
        "Dubai-based fragrance house known for bold Middle Eastern-inspired compositions and strong value for money.",
      websiteUrl: null,
      logoUrl: null,
    },
  });

  const armaf = await prisma.brand.upsert({
    where: { name: "Armaf" },
    update: {},
    create: {
      name: "Armaf",
      description:
        "Popular modern fragrance brand known for accessible interpretations across fresh, woody, gourmand, and oriental styles.",
      websiteUrl: null,
      logoUrl: null,
    },
  });

  const frenchAvenue = await prisma.brand.upsert({
    where: { name: "French Avenue" },
    update: {},
    create: {
      name: "French Avenue",
      description:
        "Contemporary fragrance line featuring modern crowd-pleasing profiles, including aquatic freshies and sweet ambers.",
      websiteUrl: null,
      logoUrl: null,
    },
  });

  // 2) Products
  const products = [
    // -------------------------
    // LATTAFA
    // -------------------------
    {
      brandId: lattafa.id,
      name: "Fire On Ice",
      size: 100,
      price: 39.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [] as string[],
      description:
        "A boozy-spiced fruity opening of cognac and raspberry melts into rosy caramel sweetness over a resinous, woody amber base.",
      topNotes: ["Cognac", "Raspberry", "Cinnamon"],
      heartNotes: ["Rose Petals", "Caramel", "Moss"],
      baseNotes: ["Oak", "Myrrh", "Cedarwood", "Ambroxan"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Pride Art Of Nature II",
      size: 100,
      price: 39.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Citrus-fruity brightness with incense nuance up top, settling into a softly floral-spiced heart and a smooth vanilla-amber woods drydown.",
      topNotes: ["Olibanum (Frankincense)", "Mandarin", "Bergamot", "Apple"],
      heartNotes: ["Cardamom", "Orange Blossom", "Rose"],
      baseNotes: ["Vanilla", "Musk", "Ambroxan", "Guaiac Wood", "Cedarwood"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Pride La Collection Antiquities 1910",
      size: 100,
      price: 44.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A fruity-rose opening with an aromatic twist leads to a refined woody-floral center, finishing with cozy vanilla, tonka sweetness and patchouli depth.",
      topNotes: ["Apple", "Davana", "Rose"],
      heartNotes: ["Cedar", "Osmanthus"],
      baseNotes: ["Vanilla", "Tonka Bean", "Patchouli"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Pride Nebras",
      size: 100,
      price: 29.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A berry-citrus pop up front turns into creamy cacao-vanilla with rose accents, drying down into sugary amber musk and tonka warmth.",
      topNotes: ["Red Berries", "Mandarin Orange"],
      heartNotes: ["Vanilla", "Cacao", "Rose"],
      baseNotes: ["Sugar", "Tonka Bean", "Amber", "Musk"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Sheikh Al Shuyukh Supreme",
      size: 100,
      price: 19.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Spiced saffron and cinnamon wrapped around rose, with a sweet caramel-patchouli core and a warm amber-vanilla woody base.",
      topNotes: ["Cinnamon", "Rose", "Saffron"],
      heartNotes: ["Caramel", "Patchouli"],
      baseNotes: ["Vanilla", "Ambroxan", "Woody Notes", "Amber"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Khamrah Dukhan",
      size: 100,
      price: 37.99,
      concentration: "EDP",
      gender: genderFromCode("M"),
      images: [],
      description:
        "A smoky-spiced mandarin opening flows into incense and balsamic richness, finishing with praline sweetness, tobacco warmth and resinous amber.",
      topNotes: ["Spices", "Pimento", "Mandarin"],
      heartNotes: ["Incense", "Labdanum", "Orange Blossom", "Patchouli"],
      baseNotes: ["Praline", "Tobacco", "Amber", "Tonka Bean", "Benzoin"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "Angham",
      size: 100,
      price: 24.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Sparkling ginger-citrus with pink pepper leads into a cozy praline-cacao heart with aromatic lavender, resting on a smooth vanilla amber musk base.",
      topNotes: ["Ginger", "Mandarin", "Pink Pepper"],
      heartNotes: ["Lavender", "Praline", "Cacao", "Jasmine"],
      baseNotes: ["Vanilla", "Amber", "Musk"],
      stock: 10,
    },
    {
      brandId: lattafa.id,
      name: "The Kingdom",
      size: 100,
      price: 34.99,
      concentration: "EDP",
      gender: genderFromCode("W"),
      images: [],
      description:
        "A playful fruity-floral opening of pear and berries melts into praline-jasmine sweetness, settling into a creamy musky vanilla with warm amber woods.",
      topNotes: ["Pear", "Peony", "Cassis (Black Currant)"],
      heartNotes: ["Praline", "Jasmine", "Tonka Bean"],
      baseNotes: ["Vanilla", "Musk", "Sandalwood", "Amber"],
      stock: 10,
    },

    // -------------------------
    // ARMAF
    // -------------------------
    {
      brandId: armaf.id,
      name: "Club de Nuit Heritage Lionheart",
      size: 100,
      price: 39.99,
      concentration: "EDT",
      gender: genderFromCode("M"),
      images: [],
      description:
        "A fresh aromatic opening of mint and lavender turns creamy with vanilla and benzoin, finishing with a rich honeyed tobacco-tonka drydown.",
      topNotes: ["Mint", "Lavender"],
      heartNotes: ["Vanilla", "Benzoin"],
      baseNotes: ["Honey", "Tonka Bean", "Tobacco"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Dubai Nights Midnight",
      size: 100,
      price: 34.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Clean lavender and bergamot open into a crisp floral-fougère heart, drying down earthy and woody with patchouli depth.",
      topNotes: ["Lavender", "Bergamot"],
      heartNotes: ["Orange Blossom", "Geranium"],
      baseNotes: ["Patchouli", "Woody Notes"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Effects of Uniq",
      size: 100,
      price: 29.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Juicy pear and mandarin brighten the opening, followed by creamy vanilla and orange blossom, finishing with coffee-caramel woods and soft musk.",
      topNotes: ["Pear", "Mandarin"],
      heartNotes: ["Vanilla", "Orange Blossom"],
      baseNotes: ["Coffee", "Caramel", "Cedarwood", "Patchouli", "White Musk"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Éter Perfume Oasis",
      size: 100,
      price: 39.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A lush fruity cocktail of peach, pineapple and pear leads to airy florals and cashmere wood, settling into a warm oud-sandalwood amber vanilla base.",
      topNotes: ["Peach", "Pineapple", "Bergamot", "Pear", "Plum"],
      heartNotes: ["Cashmere Wood", "Violet Leaves", "Freesia", "Jasmine"],
      baseNotes: ["Agarwood (Oud)", "Sandalwood", "Amber", "Vanilla", "Musk"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Odyssey Homme",
      size: 100,
      price: 24.99,
      concentration: "EDP",
      gender: genderFromCode("M"),
      images: [],
      description:
        "Amber-vanilla richness up top with a powdery iris-spice heart, drying down to smooth leathered vanilla with a touch of jasmine.",
      topNotes: ["Vanilla", "Amber"],
      heartNotes: ["Oriental Notes", "Spices", "Iris"],
      baseNotes: ["Vanilla", "Leather", "Jasmine"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Odyssey Aqua",
      size: 100,
      price: 21.99,
      concentration: "EDP",
      gender: genderFromCode("M"),
      images: [],
      description:
        "Bright citrus and aromatic greens open into minty lavender freshness, finishing clean and modern with ambroxan, cypress and patchouli.",
      topNotes: ["Orange", "Grapefruit", "Artemisia"],
      heartNotes: ["Mint", "Lavender"],
      baseNotes: ["Ambroxan", "Cypress", "Patchouli"],
      stock: 10,
    },
    {
      brandId: armaf.id,
      name: "Odyssey Homme White Edition",
      size: 100,
      price: 19.99,
      concentration: "EDP",
      gender: genderFromCode("M"),
      images: [],
      description:
        "A crisp citrus-spice opening blends into airy violet leaf and marine notes, finishing with a smooth woody amber trail.",
      topNotes: ["Pink Pepper", "Yuzu", "Grapefruit"],
      heartNotes: ["Violet Leaf", "Sea Notes"],
      baseNotes: ["Amber", "Amberwood", "Guaiac Wood"],
      stock: 10,
    },

    // -------------------------
    // FRENCH AVENUE
    // -------------------------
    {
      brandId: frenchAvenue.id,
      name: "Ace",
      size: 80,
      price: 24.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Spiced-floral top notes move into a cozy chestnut-woods heart, finishing smooth and balsamic with vanilla and cashmeran warmth.",
      topNotes: ["Cloves", "Pink Pepper", "Orange Blossom"],
      heartNotes: ["Chestnut", "Guaiac Wood", "Juniper"],
      baseNotes: ["Vanilla", "Peru Balsam", "Cashmeran"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Atlantis",
      size: 100,
      price: 39.99,
      concentration: "Extrait de Parfum",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A zesty citrus opening dives into a breezy tropical heart of watermelon and coconut, drying down into a cocoa-amberwood and ambergris base.",
      topNotes: ["Orange", "Mandarin Orange", "Lemon"],
      heartNotes: ["Watermelon", "Coconut"],
      baseNotes: ["Cacao", "Amberwood", "Ambergris"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Enigma Quatre",
      size: 100,
      price: 29.99,
      concentration: "EDP",
      gender: genderFromCode("W"),
      images: [],
      description:
        "A rose-forward bouquet from top to base: sparkling mandarin with layered Turkish/Bulgarian/Moroccan roses, finishing with patchouli depth.",
      topNotes: ["Damask Rose", "Mandarin", "Taif Rose"],
      heartNotes: ["Bulgarian Rose", "Moroccan Rose", "Rose", "Orange Blossom", "Jasmine"],
      baseNotes: ["Turkish Rose", "Patchouli"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Enigma Une",
      size: 100,
      price: 29.99,
      concentration: "EDP",
      gender: genderFromCode("M"),
      images: [],
      description:
        "Warm spices and grapefruit open into aromatic lavender and creamy vanilla, settling into an ambery, earthy patchouli-vetiver base with a licorice twist.",
      topNotes: ["Cardamom", "Cinnamon", "Nutmeg", "Grapefruit"],
      heartNotes: ["Lavender", "Coumarin", "Vanilla"],
      baseNotes: ["Licorice", "Patchouli", "Amber", "Vetiver"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Francique 107.9",
      size: 100,
      price: 26.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Cherry and bergamot sparkle with peppery bite, melting into heliotrope-vanilla softness and a musky amber-resin base.",
      topNotes: ["Cherry", "Bergamot", "Pepper"],
      heartNotes: ["Heliotrope", "Vanilla", "Orange Blossom"],
      baseNotes: ["Tonka Bean", "White Musk", "Cashmere Musk", "Olibanum (Frankincense)", "Ambroxan", "Labdanum"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Moonstone Bleu",
      size: 100,
      price: 27.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A cool, metallic-aquatic opening with aldehydes and violet leaf leads to lavender, beeswax and leather nuances, drying down into honeyed mossy amber woods.",
      topNotes: ["Metallic Notes", "Aldehydes", "Watery Notes", "Black Pepper", "Violet Leaf", "Cardamom"],
      heartNotes: ["Lavender", "Beeswax", "Lime", "Leather", "Cyclamen"],
      baseNotes: ["White Musk", "Honey", "Oakmoss", "Patchouli", "Woody Notes", "Cedar", "Tonka Bean", "Vanilla", "Amber", "Gurjan Balsam", "Myrrh"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Paradigm",
      size: 100,
      price: 29.99,
      concentration: "Extrait de Parfum",
      gender: genderFromCode("U"),
      images: [],
      description:
        "Fruity plum and apple over bright bergamot open into aromatic clary sage and pepper, finishing smooth and sensual with vanilla, leather, musk and patchouli.",
      topNotes: ["Plum", "Apple", "Bergamot"],
      heartNotes: ["Clary Sage", "Pepper"],
      baseNotes: ["Musk", "Vanilla", "Leather", "Patchouli"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Roses D´Emotion",
      size: 100,
      price: 29.99,
      concentration: "EDP",
      gender: genderFromCode("W"),
      images: [],
      description:
        "A rosy, lightly spicy floral: Turkish rose and pink pepper on top, raspberry-rose in the heart, and a clean papyrus/amber base.",
      topNotes: ["Turkish Rose", "Pink Pepper"],
      heartNotes: ["Turkish Rose", "Raspberry"],
      baseNotes: ["Papyrus", "White Amber"],
      stock: 10,
    },
    {
      brandId: frenchAvenue.id,
      name: "Vulcan Feu",
      size: 100,
      price: 39.99,
      concentration: "EDP",
      gender: genderFromCode("U"),
      images: [],
      description:
        "A juicy tropical opening (mango, lemon, ginger, rhubarb) turns creamy-sweet with praline and soft florals, finishing on tonka, woods, moss and ambergris.",
      topNotes: ["Mango", "Lemon", "Ginger", "Rhubarb"],
      heartNotes: ["Pink Pepper", "Jasmine", "Violet", "Praline"],
      baseNotes: ["Tonka Bean", "Cedarwood", "Ambergris", "Moss"],
      stock: 10,
    },
  ];

  // Insert products (idempotent-ish): delete then recreate per brand if you want strict sync.
  // Here we upsert by (brandId + name) using a manual find-first approach since schema has no unique compound.
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { brandId: p.brandId, name: p.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...p,
          // keep createdAt as-is; Prisma handles updatedAt
        },
      });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
