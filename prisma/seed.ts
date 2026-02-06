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
        "Fire On Ice by Lattafa is a bold, long-lasting Arabian perfume that opens with a boozy-spiced blend of cognac, raspberry, and cinnamon. The heart reveals rosy caramel sweetness layered with moss, while the drydown delivers a warm, resinous base of oak, myrrh, cedarwood, and ambroxan. A luxurious unisex oriental fragrance perfect for evening wear and cooler seasons.",
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
        "Pride Art Of Nature II by Lattafa is a refined Arabian Eau de Parfum that combines citrus-fruity brightness with sacred frankincense. The heart blends spiced cardamom with delicate orange blossom and rose, while the long-lasting base of vanilla, musk, ambroxan, and guaiac wood creates a smooth, oriental drydown. An elegant unisex luxury fragrance for all occasions.",
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
        "Pride La Collection Antiquities 1910 by Lattafa is a heritage-inspired Arabian perfume with exceptional longevity. A fruity-rose opening of apple, davana, and rose transitions into a refined woody-floral heart of cedar and osmanthus. The luxurious base of vanilla, tonka bean, and patchouli provides hours of warm, sensual depth. An opulent unisex oriental fragrance.",
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
        "Pride Nebras by Lattafa is an irresistible Arabian perfume that blends juicy red berries and mandarin with a creamy cacao-vanilla heart accented by delicate rose. The long-lasting base wraps you in sugary amber, tonka bean, and musk warmth. A sweet, sensual oriental fragrance perfect for those who want a gourmand Arabian scent with excellent projection.",
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
        "Sheikh Al Shuyukh Supreme by Lattafa is one of the most beloved Arabian perfumes, offering incredible value for a luxury fragrance. Spiced saffron and cinnamon are wrapped around lush rose, leading into a sweet caramel-patchouli core. The warm amber-vanilla woody base delivers exceptional longevity — a signature Arabian oud-inspired scent that lasts all day.",
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
        "Khamrah Dukhan by Lattafa is a rich, smoky Arabian perfume for men that commands attention. A spiced mandarin opening flows into sacred incense and balsamic labdanum, while the long-lasting base of praline, tobacco, amber, tonka bean, and benzoin creates a mesmerizing oriental warmth. A bold, masculine luxury fragrance with outstanding sillage and longevity.",
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
        "Angham by Lattafa is a versatile Arabian perfume that balances sparkling freshness with cozy oriental warmth. Ginger, mandarin, and pink pepper open into a delicious praline-cacao heart layered with aromatic lavender and jasmine. The smooth vanilla-amber-musk base ensures long-lasting wear — a perfect everyday luxury fragrance that transitions beautifully from day to night.",
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
        "The Kingdom by Lattafa is an enchanting Arabian perfume for women, opening with a playful bouquet of pear, peony, and black currant. The heart reveals indulgent praline, jasmine, and tonka bean sweetness, while the long-lasting base of creamy vanilla, musk, sandalwood, and amber creates a sensual, oriental embrace. A feminine luxury fragrance with unforgettable depth.",
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
        "Club de Nuit Heritage Lionheart by Armaf is a sophisticated men's fragrance that blends fresh aromatic mint and lavender with a creamy vanilla-benzoin heart. The long-lasting base of honeyed tobacco and tonka bean delivers a rich, masculine drydown. A versatile luxury perfume with the depth of Arabian perfumery and clean modern appeal — ideal for daily wear and special evenings.",
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
        "Dubai Nights Midnight by Armaf captures the allure of Arabian nights in a refined, long-lasting Eau de Parfum. Clean lavender and bergamot open into a crisp floral-fougère heart of orange blossom and geranium, drying down to an earthy woody base anchored by patchouli. A sophisticated unisex oriental fragrance that evokes the elegance of Dubai.",
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
        "Effects of Uniq by Armaf is a gourmand Arabian perfume that opens with juicy pear and mandarin freshness, followed by a creamy heart of vanilla and orange blossom. The long-lasting base of coffee, caramel, cedarwood, patchouli, and white musk creates an addictive oriental drydown. A luxurious unisex fragrance that delivers exceptional sillage and all-day longevity.",
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
        "Éter Perfume Oasis by Armaf is a luxurious oud perfume that begins with a lush fruity cocktail of peach, pineapple, bergamot, and pear. Airy florals and cashmere wood form the elegant heart, while the prized base of genuine agarwood (oud), sandalwood, amber, vanilla, and musk provides exceptional longevity. A premium unisex Arabian fragrance for oud enthusiasts.",
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
        "Odyssey Homme by Armaf is a seductive men's Arabian perfume that opens with rich amber and vanilla warmth. The powdery iris and spice heart adds sophistication, while the long-lasting base of leathered vanilla and jasmine delivers a smooth, oriental finish. A masculine luxury fragrance with remarkable longevity — perfect for those who appreciate bold, warm scents.",
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
        "Odyssey Aqua by Armaf is a fresh, modern men's fragrance that brings aquatic energy to Arabian perfumery. Bright citrus of orange and grapefruit blends with aromatic artemisia, flowing into a refreshing minty-lavender heart. The clean base of ambroxan, cypress, and patchouli ensures long-lasting wear. An affordable luxury perfume ideal for warm-weather days and active lifestyles.",
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
        "Odyssey Homme White Edition by Armaf is a crisp, elegant men's fragrance that pairs yuzu and grapefruit with pink pepper spice. Airy violet leaf and marine sea notes create a breezy, refined heart, finishing with a smooth woody amber trail of amberwood and guaiac wood. A long-lasting luxury perfume that offers premium Arabian quality at an exceptional price.",
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
        "Ace by French Avenue is a warm, spiced Arabian perfume that opens with cloves, pink pepper, and orange blossom elegance. The cozy chestnut and guaiac wood heart is layered with aromatic juniper, leading to a smooth, long-lasting base of vanilla, Peru balsam, and cashmeran warmth. A refined unisex oriental fragrance that wraps you in sophisticated comfort.",
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
        "Atlantis by French Avenue is an Extrait de Parfum — the highest concentration of luxury fragrance — offering extraordinary longevity and projection. A zesty citrus opening of orange, mandarin, and lemon dives into a breezy tropical heart of watermelon and coconut. The rich base of cacao, amberwood, and ambergris delivers a unique, warm Arabian drydown. A standout unisex perfume.",
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
        "Enigma Quatre by French Avenue is a luxurious rose Arabian perfume for women, featuring a magnificent bouquet of the world's finest roses. Sparkling mandarin and Damask rose open into a heart layered with Bulgarian, Moroccan, and classic rose, accented by orange blossom and jasmine. Turkish rose and patchouli anchor the long-lasting base. A feminine oriental fragrance of unmatched floral depth.",
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
        "Enigma Une by French Avenue is a bold men's Arabian perfume built on warm spices and earthy depth. Cardamom, cinnamon, nutmeg, and grapefruit create a striking opening, while aromatic lavender and creamy vanilla form the refined heart. The long-lasting base of licorice, patchouli, amber, and vetiver delivers a masculine oriental drydown with exceptional staying power.",
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
        "Francique 107.9 by French Avenue is a captivating unisex Arabian perfume that opens with sparkling cherry and bergamot brightened by peppery spice. The sweet heliotrope-vanilla heart melts into a complex, long-lasting base of tonka bean, white and cashmere musk, frankincense, ambroxan, and labdanum. A luxurious oriental fragrance that balances sweetness with resinous depth.",
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
        "Moonstone Bleu by French Avenue is a complex, multi-faceted Arabian perfume with extraordinary longevity. A cool metallic-aquatic opening of aldehydes, violet leaf, black pepper, and cardamom transitions into lavender, beeswax, and leather nuances. The rich base layers white musk, honey, oakmoss, patchouli, cedar, tonka, vanilla, amber, and myrrh — a luxurious unisex oriental masterpiece.",
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
        "Paradigm by French Avenue is an Extrait de Parfum that delivers the ultimate in Arabian luxury fragrance. Fruity plum and apple sparkle with bright bergamot, opening into an aromatic heart of clary sage and pepper. The sensual, long-lasting base of musk, vanilla, supple leather, and patchouli creates an unforgettable oriental drydown. A unisex perfume of exceptional quality and longevity.",
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
        "Roses D'Emotion by French Avenue is an exquisite women's Arabian perfume that celebrates the timeless beauty of rose. Turkish rose and pink pepper create an elegant, lightly spicy opening, while the heart reveals juicy raspberry intertwined with deeper rose layers. A clean papyrus and white amber base provides long-lasting, feminine warmth. A romantic oriental fragrance for the modern woman.",
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
        "Vulcan Feu by French Avenue is a vibrant, tropical Arabian perfume that opens with an intoxicating blend of mango, lemon, ginger, and rhubarb. Pink pepper, jasmine, violet, and praline form a creamy-sweet heart, while the long-lasting base of tonka bean, cedarwood, ambergris, and moss delivers warm, oriental depth. A unique luxury unisex fragrance that stands out from the crowd.",
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
