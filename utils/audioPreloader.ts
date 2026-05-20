import type { ModuleCode } from '../constants/products';
import { audioAssets } from './audioAssets';
import { phraseAudioAssetKey } from './phraseAudioKey';

const preloadedCache: Record<string, any> = {};

function cacheKey(
  moduleCode: ModuleCode,
  phraseId: number,
  voice: 'm' | 'f',
): string {
  return phraseAudioAssetKey(moduleCode, phraseId, voice);
}

/** Warms the phrase audio lookup cache for both voices. Assets are bundled via require() so no IO is performed — this just copies references from audioAssets into a fast local map used by getPreloadedSource(). */
export function preloadPhraseAudio(
  phraseIds: number[],
  moduleCode: ModuleCode = '101',
): void {
  for (const phraseId of phraseIds) {
    const mKey = cacheKey(moduleCode, phraseId, 'm');
    const fKey = cacheKey(moduleCode, phraseId, 'f');
    const mSrc = audioAssets[mKey];
    const fSrc = audioAssets[fKey];
    if (mSrc != null) preloadedCache[mKey] = mSrc;
    if (fSrc != null) preloadedCache[fKey] = fSrc;
  }
}

/** Warm the first `maxCount` phrases of the current chapter (both voices) before any tap — reduces first-play glitches. */
export function preloadFirstPhrasesOfCurrentChapter(
  phrasesInChapterSorted: readonly { id: number }[],
  moduleCode: ModuleCode,
  maxCount = 5,
): void {
  const ids = phrasesInChapterSorted
    .slice(0, maxCount)
    .map((p) => p.id)
    .filter((id) => typeof id === 'number' && id > 0);
  if (ids.length === 0) return;
  preloadPhraseAudio(ids, moduleCode);
}

export function getPreloadedSource(
  phraseId: number,
  voice: 'm' | 'f',
  moduleCode: ModuleCode = '101',
): any | null {
  const key = cacheKey(moduleCode, phraseId, voice);
  return preloadedCache[key] ?? audioAssets[key] ?? null;
}
