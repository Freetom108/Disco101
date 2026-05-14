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
