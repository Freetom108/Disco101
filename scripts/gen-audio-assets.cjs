const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'utils', 'audioAssets.ts');
fs.mkdirSync(path.dirname(out), { recursive: true });

let s = 'export const audioAssets: Record<string, any> = {\n';
for (let i = 1; i <= 101; i++) {
  const id = String(i).padStart(3, '0');
  s += `  'phrase_${id}_m': require('../assets/audio/phrase_${id}_m.mp3'),\n`;
  s += `  'phrase_${id}_f': require('../assets/audio/phrase_${id}_f.mp3'),\n`;
}
s += '};\n';

fs.writeFileSync(out, s);
console.log('Wrote', out);
