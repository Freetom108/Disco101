import type { ModuleCode } from '../constants/products';

/** Asset map keys for Metro bundle — Units 2+ use prefixed IDs so IDs can overlap Unit 1. */
export function phraseAudioAssetKey(
  moduleCode: ModuleCode,
  phraseId: number,
  gender: 'm' | 'f',
): string {
  const base = `phrase_${String(phraseId).padStart(3, '0')}_${gender}`;
  if (moduleCode === '102') return `102_${base}`;
  if (moduleCode === '103') return `103_${base}`;
  return base;
}
