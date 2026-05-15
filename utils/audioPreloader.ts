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

/** Registers phrase audio sources for both voices in the preload cache. */
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

export function getPreloadedSource(
  phraseId: number,
  voice: 'm' | 'f',
  moduleCode: ModuleCode = '101',
): any | null {
  const key = cacheKey(moduleCode, phraseId, voice);
  return preloadedCache[key] ?? audioAssets[key] ?? null;
}
