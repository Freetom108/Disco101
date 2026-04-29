/**
 * Central chapter configuration for Disco 101 (Kapitel 1–7), derived from
 * `data/sentences.json` (phrase ranges and category titles).
 */

function phraseIdRange(from: number, to: number): readonly number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export const packages = {
  disco101: {
    id: 'disco101' as const,
    label: 'Disco 101',
    chapterIds: [1, 2, 3, 4, 5, 6, 7] as const,
  },
} as const;

export const chapters = {
  1: {
    chapterId: 1 as const,
    title: 'Ankunft & Orientierung',
    phraseIds: phraseIdRange(1, 15),
    phraseCount: 15,
  },
  2: {
    chapterId: 2 as const,
    title: 'Unterkunft',
    phraseIds: phraseIdRange(16, 27),
    phraseCount: 12,
  },
  3: {
    chapterId: 3 as const,
    title: 'Essen & Trinken',
    phraseIds: phraseIdRange(28, 47),
    phraseCount: 20,
  },
  4: {
    chapterId: 4 as const,
    title: 'Small Talk & Höflichkeit',
    phraseIds: phraseIdRange(48, 65),
    phraseCount: 18,
  },
  5: {
    chapterId: 5 as const,
    title: 'Shoppen & Service',
    phraseIds: phraseIdRange(66, 80),
    phraseCount: 15,
  },
  6: {
    chapterId: 6 as const,
    title: 'Notfall & Gesundheit',
    phraseIds: phraseIdRange(81, 88),
    phraseCount: 8,
  },
  7: {
    chapterId: 7 as const,
    title: 'Verstehen & Nachfragen',
    phraseIds: phraseIdRange(89, 101),
    phraseCount: 13,
  },
} as const;
