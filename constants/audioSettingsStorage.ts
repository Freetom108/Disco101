/** AsyncStorage keys + defaults for phrase audio playback. */

export const AUDIO_SPEED_KEY = 'audio_speed';
export const AUDIO_REPEAT_KEY = 'audio_repeat';

export type AudioSpeedStored = '0.7' | '0.8' | '0.9';
export type AudioRepeatStored = '1' | '2';

export const DEFAULT_AUDIO_SPEED: AudioSpeedStored = '0.8';
export const DEFAULT_AUDIO_REPEAT: AudioRepeatStored = '1';

export function parseAudioSpeed(raw: string | null): AudioSpeedStored {
  if (raw === '0.7' || raw === '0.8' || raw === '0.9') return raw;
  // Migration: ältere App-Versionen (0.9 / 1.0 / 1.1)
  if (raw === '1.0') return '0.8';
  if (raw === '1.1') return '0.9';
  return DEFAULT_AUDIO_SPEED;
}

export function parseAudioRepeat(raw: string | null): AudioRepeatStored {
  if (raw === '1' || raw === '2') return raw;
  return DEFAULT_AUDIO_REPEAT;
}

export function audioSpeedToRate(s: AudioSpeedStored): number {
  switch (s) {
    case '0.7':
      return 0.7;
    case '0.8':
      return 0.8;
    case '0.9':
      return 0.9;
  }
}
