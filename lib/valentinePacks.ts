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
    id: 'pack-angham-art',
    title: 'Art of Nature II & Angham',
    subtitle: 'Sweet warmth & Woody balance',
    himId: 'cmkzkzdt80006hrmukdq6g95i',
    himName: 'Art of Nature II',
    herId: 'cmkzkzeel000ghrmuqb0xzkh5',
    herName: 'Angham',
    description: 'A warm and calming combination that feels intimate and sophisticated. Angham wraps the senses in soft, comforting sweetness, while Art of Nature II adds a smooth, woody depth. A set designed for those who appreciate subtle elegance and a feeling of balance.',
    discount: 10,
  },
  {
    id: 'pack-effects-heritage',
    title: 'Heritage Lionheart & Effects of Uniq',
    subtitle: 'Playful sweetness & Confident aroma',
    himId: 'cmkzkzelu000khrmurvns7aiu',
    himName: 'Heritage Lionheart',
    herId: 'cmkzkzesz000ohrmuo470jaw8',
    herName: 'Effects of Uniq',
    description: 'A modern and seductive blend of comfort and strength. Effects of Uniq brings a playful, gourmand warmth, while Heritage Lionheart adds aromatic depth and confident masculinity. An expressive duo made for those who enjoy fragrance with personality.',
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
  }
];