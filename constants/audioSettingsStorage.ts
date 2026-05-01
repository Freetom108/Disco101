/** AsyncStorage keys + defaults for phrase audio playback. */

export const AUDIO_SPEED_KEY = 'audio_speed';
export const AUDIO_REPEAT_KEY = 'audio_repeat';

export type AudioSpeedStored = '0.9' | '1.0' | '1.1';
export type AudioRepeatStored = '1' | '2';

export const DEFAULT_AUDIO_SPEED: AudioSpeedStored = '1.0';
export const DEFAULT_AUDIO_REPEAT: AudioRepeatStored = '1';

export function parseAudioSpeed(raw: string | null): AudioSpeedStored {
  if (raw === '0.9' || raw === '1.0' || raw === '1.1') return raw;
  return DEFAULT_AUDIO_SPEED;
}

export function parseAudioRepeat(raw: string | null): AudioRepeatStored {
  if (raw === '1' || raw === '2') return raw;
  return DEFAULT_AUDIO_REPEAT;
}

export function audioSpeedToRate(s: AudioSpeedStored): number {
  switch (s) {
    case '0.9':
      return 0.9;
    case '1.0':
      return 1.0;
    case '1.1':
      return 1.1;
  }
}
