const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'constants', 'phraseAudioModules.ts');
let s = `/** Phrase MP3 modules — static requires for Metro bundler. */
import type { AVPlaybackSource } from 'expo-av';

const M: Record<number, AVPlaybackSource> = {
`;

for (let i = 1; i <= 101; i++) {
  const p = String(i).padStart(3, '0');
  s += `  ${i}: require('../assets/audio/phrase_${p}_m.mp3'),\n`;
}
s += `};

const F: Record<number, AVPlaybackSource> = {
`;
for (let i = 1; i <= 101; i++) {
  const p = String(i).padStart(3, '0');
  s += `  ${i}: require('../assets/audio/phrase_${p}_f.mp3'),\n`;
}
s += `};

export function getPhraseAudioSource(
  phraseId: number,
  voice: 'm' | 'f',
): AVPlaybackSource | undefined {
  return voice === 'm' ? M[phraseId] : F[phraseId];
}
`;

fs.writeFileSync(out, s);
console.log('Wrote', out);
