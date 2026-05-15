import AsyncStorage from '@react-native-async-storage/async-storage';

/** When true, Kapitel 2–7 of Disco 101 are playable (set after IAP). */
export const DISC101_FULL_KEY = 'purchase_disc101_full';

export async function hasDisc101FullAccess(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISC101_FULL_KEY)) === 'true';
  } catch {
    return false;
  }
}

export function isChapterLockedWithoutPurchase(chapterId: number): boolean {
  return chapterId > 1;
}

/**
 * Repeat ist ohne Kauf nur für freie Inhalte (Kapitel 1 je Unit / aktuell ein Datenbestand).
 */
export function filterPhraseIdsForRepeatAccess(
  ids: number[],
  hasDisc101FullAccess: boolean,
  sentences: ReadonlyArray<{ id: number; chapterId: number }>,
): number[] {
  if (hasDisc101FullAccess) return ids;
  const byChapter = new Map(sentences.map((s) => [s.id, s.chapterId]));
  return ids.filter((id) => {
    const ch = byChapter.get(id);
    return ch !== undefined && !isChapterLockedWithoutPurchase(ch);
  });
}
