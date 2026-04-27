const fs = require('fs');
const path = require('path');
const https = require('https');

// KONFIGURATION - hier deinen API Key eintragen
const API_KEY = 'sk_e7cbb17ae34477caaa8d97eac7100783317d98b52c8138c8';
const VOICE_M = 'xaxI6Jfc2lX56zg0yQP5'; // Chris
const VOICE_F = 'jfSyWle6YaTVjEHwZMoa'; // Ann

// Ausgabe-Ordner
const OUTPUT_DIR = path.join(__dirname, 'app', 'assets', 'audio');

// Sätze laden (flaches Array: id, english, german, category, chapterId)
const phrases = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'app', 'data', 'sentences.json'),
    'utf8'
  )
);

// Ausgabe-Ordner erstellen falls nicht vorhanden
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Verzögerung zwischen Requests (ElevenLabs Rate Limit)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Audio generieren
async function generateAudio(text, voiceId, filename) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
        'xi-api-key': API_KEY,
      }
    };

    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} für ${filename}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(filename, Buffer.concat(chunks));
        console.log(`✅ Erstellt: ${path.basename(filename)}`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`🎙️ Starte Audio-Generierung für ${phrases.length} Phrasen...`);
  console.log(`📁 Ausgabe: ${OUTPUT_DIR}`);
  console.log('');

  for (const phrase of phrases) {
    const id = String(phrase.id).padStart(3, '0');
    
    // Männliche Stimme
    const fileM = path.join(OUTPUT_DIR, `phrase_${id}_m.mp3`);
    if (!fs.existsSync(fileM)) {
      await generateAudio(phrase.english, VOICE_M, fileM);
      await delay(1000); // 1 Sekunde Pause
    } else {
      console.log(`⏭️ Übersprungen (existiert): phrase_${id}_m.mp3`);
    }

    // Weibliche Stimme
    const fileF = path.join(OUTPUT_DIR, `phrase_${id}_f.mp3`);
    if (!fs.existsSync(fileF)) {
      await generateAudio(phrase.english, VOICE_F, fileF);
      await delay(1000); // 1 Sekunde Pause
    } else {
      console.log(`⏭️ Übersprungen (existiert): phrase_${id}_f.mp3`);
    }
  }

  console.log('');
  console.log('🎉 Fertig! Alle Audio-Dateien wurden erstellt.');
}

main().catch(console.error);
