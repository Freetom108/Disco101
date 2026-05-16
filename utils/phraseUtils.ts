import type { ModuleCode } from '../constants/products';
import type { SentenceRecord } from '../constants/sentencePacks';
import { audioAssets } from './audioAssets';
import { phraseAudioAssetKey } from './phraseAudioKey';

export function shufflePhrases(phrases: SentenceRecord[]): SentenceRecord[] {
  const a = [...phrases];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export function buildQuizOptions(correct: SentenceRecord, pool: SentenceRecord[]): SentenceRecord[] {
  const others = shufflePhrases(pool.filter((p) => p.id !== correct.id));
  const w1 = others[0] ?? correct;
  const w2 = others[1] ?? others[0] ?? correct;
  return shufflePhrases([correct, w1, w2]);
}

export function phraseAudioSource(
  phraseId: number,
  gender: 'm' | 'f',
  moduleCode: ModuleCode,
) {
  const key = phraseAudioAssetKey(moduleCode, phraseId, gender);
  return audioAssets[key] ?? null;
}
