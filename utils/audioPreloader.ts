import { audioAssets } from './audioAssets';

const preloadedCache: Record<string, any> = {};

function cacheKey(phraseId: number, voice: 'm' | 'f'): string {
  return `phrase_${String(phraseId).padStart(3, '0')}_${voice}`;
}

/** Registers phrase audio sources for both voices in the preload cache. */
export function preloadPhraseAudio(phraseIds: number[]): void {
  for (const phraseId of phraseIds) {
    const mKey = cacheKey(phraseId, 'm');
    const fKey = cacheKey(phraseId, 'f');
    const mSrc = audioAssets[mKey];
    const fSrc = audioAssets[fKey];
    if (mSrc != null) preloadedCache[mKey] = mSrc;
    if (fSrc != null) preloadedCache[fKey] = fSrc;
  }
}

export function getPreloadedSource(
  phraseId: number,
  voice: 'm' | 'f',
): any | null {
  const key = cacheKey(phraseId, voice);
  return preloadedCache[key] ?? audioAssets[key] ?? null;
}
