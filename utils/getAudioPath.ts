/**
 * Returns the bundled audio asset key (e.g. `phrase_001_m`) for a phrase voice.
 * `packageId` is reserved for future multi-package layouts.
 */
export function getAudioPath(
  packageId: string,
  phraseId: number,
  gender: 'm' | 'f',
): string {
  void packageId;
  return `phrase_${String(phraseId).padStart(3, '0')}_${gender}`;
}
