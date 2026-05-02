import type { AudioPlayer, AudioSource, PitchCorrectionQuality } from 'expo-audio';

export function safePlayerPause(player: AudioPlayer | null | undefined): void {
  if (!player) return;
  try {
    player.pause();
  } catch {
    /* player may already be released */
  }
}

export async function safePlayerSeekTo(
  player: AudioPlayer | null | undefined,
  seconds: number,
): Promise<void> {
  if (!player) return;
  try {
    await player.seekTo(seconds);
  } catch {
    /* player may already be released */
  }
}

export function safePlayerPlay(player: AudioPlayer | null | undefined): void {
  if (!player) return;
  try {
    player.play();
  } catch {
    /* player may already be released */
  }
}

export function safePlayerReplace(
  player: AudioPlayer | null | undefined,
  source: AudioSource,
): void {
  if (!player) return;
  try {
    player.replace(source);
  } catch {
    /* player may already be released */
  }
}

export function safePlayerSetPlaybackRate(
  player: AudioPlayer | null | undefined,
  rate: number,
  pitchCorrectionQuality: PitchCorrectionQuality,
): void {
  if (!player) return;
  try {
    player.setPlaybackRate(rate, pitchCorrectionQuality);
  } catch {
    /* player may already be released */
  }
}
