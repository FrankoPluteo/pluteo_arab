export interface ValentinePack {
  id: string;
  title: string;
  subtitle: string;
  himId: string;
  himName: string;
  herId: string;
  herName: string;
  description: string;
  discount: number;
}

export const VALENTINE_PACKS: ValentinePack[] = [
  {
    id: 'pack-atlantis-roses',
    title: 'Atlantis & Roses d\'Émotion',
    subtitle: 'Fresh meets Floral',
    himId: 'cmkzkzfc80010hrmull7lmbz6',
    himName: 'Atlantis',
    herId: 'cmkzkzfwt001chrmu3mbvnqg6',
    herName: 'Roses d\'Émotion',
    description: 'This duo blends freshness and elegance in perfect harmony. Atlantis brings a light, sunlit energy and a sense of openness, while Roses d\'Émotion adds refined, modern femininity. Together, they create an airy, romantic pairing ideal for everyday moments of closeness.',
    discount: 10,
  },
  {
    id: 'pack-angham-art',
    title: 'Angham & Art of Nature II',
    subtitle: 'Sweet warmth & Woody balance',
    himId: 'cmkzkzdt80006hrmukdq6g95i',
    himName: 'Art of Nature II',
    herId: 'cmkzkzeel000ghrmuqb0xzkh5',
    herName: 'Angham',
    description: 'A warm and calming combination that feels intimate and sophisticated. Angham wraps the senses in soft, comforting sweetness, while Art of Nature II adds a smooth, woody depth. A set designed for those who appreciate subtle elegance and a feeling of balance.',
    discount: 10,
  },
  {
    id: 'pack-nebras-khamrah',
    title: 'Nebras & Khamrah Dukhan',
    subtitle: 'Sweet indulgence & Dark intensity',
    himId: 'cmkzkzebl000ehrmup3vkxbnp',
    himName: 'Khamrah Dukhan',
    herId: 'cmkzkze24000ahrmubz2m4vp8',
    herName: 'Nebras',
    description: 'A bold, evening-ready duo full of contrast and character. Nebras captivates with rich, creamy sweetness, while Khamrah Dukhan delivers smoky, resinous depth and powerful presence. Together, they form an intense pairing for lovers of deep, unforgettable scents.',
    discount: 10,
  },
  {
    id: 'pack-effects-heritage',
    title: 'Effects of Uniq & Heritage Lionheart',
    subtitle: 'Playful sweetness & Confident aroma',
    himId: 'cmkzkzelu000khrmurvns7aiu',
    himName: 'Heritage Lionheart',
    herId: 'cmkzkzesz000ohrmuo470jaw8',
    herName: 'Effects of Uniq',
    description: 'A modern and seductive blend of comfort and strength. Effects of Uniq brings a playful, gourmand warmth, while Heritage Lionheart adds aromatic depth and confident masculinity. An expressive duo made for those who enjoy fragrance with personality.',
    discount: 10,
  },
  {
    id: 'pack-vulcan-paradigm',
    title: 'Vulcan Feu & Paradigm',
    subtitle: 'Fruity energy & Woody depth',
    himId: 'cmkzkzfty001ahrmubj16b0eb',
    himName: 'Paradigm',
    herId: 'cmkzkzfzj001ehrmuq334thpa',
    herName: 'Vulcan Feu',
    description: 'A dynamic pairing where freshness meets depth. Vulcan Feu delivers vibrant, fruity energy and bold charisma, while Paradigm builds a grounded, woody signature enriched with a subtle fruity accent that adds warmth and sensuality. Together, they create a modern, captivating set full of character.',
    discount: 10,
  },
  {
    id: 'pack-enigma',
    title: 'Enigma Une & Enigma Quatre',
    subtitle: 'Aromatic mystery & Floral elegance',
    himId: 'cmkzkzfj70014hrmuwu786133',
    himName: 'Enigma Une',
    herId: 'cmkzkzfgc0012hrmu4ow8q8e5',
    herName: 'Enigma Quatre',
    description: 'An elegant play of contrast and harmony. Enigma Une offers aromatic depth and warmth, while Enigma Quatre highlights a confident, refined rose character. A sophisticated duo for those who value elegance, individuality, and timeless style.',
    discount: 10,
  },
  {
    id: 'pack-fire-pride',
    title: 'Fire on Ice & Pride La Collection Antiquities 1910',
    subtitle: 'Sweet intensity & Timeless floral charm',
    himId: 'cmkzkzdw00008hrmu47un45i6',
    himName: 'Pride La Collection Antiquities 1910',
    herId: 'cmkzkzdme0004hrmu50mudprw',
    herName: 'Fire on Ice',
    description: 'A contrast that draws you in. Fire on Ice brings rich, seductive warmth with a modern edge, while Antiquities 1910 adds classic elegance and composed depth. Together, they form a luxurious Valentine\'s set with strong emotional appeal.',
    discount: 10,
  },
];