import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setAudioModeAsync,
  useAudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AUDIO_REPEAT_KEY,
  AUDIO_SPEED_KEY,
  audioSpeedToRate,
  parseAudioRepeat,
  parseAudioSpeed,
} from '../constants/audioSettingsStorage';
import { ACTIVE, BUTTON_TEXT } from '../constants/theme';
import { audioAssets } from '../utils/audioAssets';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSeekTo,
  safePlayerSetPlaybackRate,
} from '../utils/safeAudioPlayer';

const REPEAT_GAP_MS = 800;
const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate' as const;

type SpeakerButtonProps = {
  accessibilityLabel: string;
  letter: string;
  phraseId: number;
};

export default function SpeakerButton({
  accessibilityLabel,
  letter,
  phraseId,
}: SpeakerButtonProps) {
  const voice = letter.trim().toUpperCase() === 'M' ? 'm' : 'f';
  const assetKey = `phrase_${String(phraseId).padStart(3, '0')}_${voice}`;
  const source = audioAssets[assetKey] ?? null;

  const player = useAudioPlayer(null, { updateInterval: 100 });

  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishCountRef = useRef(0);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);

  const clearStatusSubscription = useCallback(() => {
    statusSubRef.current?.remove();
    statusSubRef.current = null;
  }, []);

  useEffect(() => {
    if (!source) return;
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    clearStatusSubscription();
    safePlayerPause(player);
    safePlayerReplace(player, source);
  }, [source, player, clearStatusSubscription]);

  useEffect(() => {
    return () => {
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = null;
      }
      clearStatusSubscription();
      safePlayerPause(player);
    };
  }, [player, clearStatusSubscription]);

  const play = useCallback(async () => {
    if (!source) return;

    let speedRaw: string | null = null;
    let repeatRaw: string | null = null;
    try {
      [speedRaw, repeatRaw] = await Promise.all([
        AsyncStorage.getItem(AUDIO_SPEED_KEY),
        AsyncStorage.getItem(AUDIO_REPEAT_KEY),
      ]);
    } catch {
      /* defaults */
    }
    const speedStored = parseAudioSpeed(speedRaw);
    const repeatStored = parseAudioRepeat(repeatRaw);
    const rate = audioSpeedToRate(speedStored);
    const maxPlays = repeatStored === '2' ? 2 : 1;

    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    clearStatusSubscription();

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      safePlayerPause(player);
      await safePlayerSeekTo(player, 0);

      safePlayerSetPlaybackRate(player, rate, 'medium');

      finishCountRef.current = 0;

      const sub = player.addListener(PLAYBACK_STATUS_UPDATE, (status) => {
        if (!status.isLoaded || !status.didJustFinish) return;

        finishCountRef.current += 1;

        if (finishCountRef.current < maxPlays) {
          repeatTimeoutRef.current = setTimeout(() => {
            repeatTimeoutRef.current = null;
            void (async () => {
              try {
                await safePlayerSeekTo(player, 0);
                safePlayerPlay(player);
              } catch (e) {
                console.log('Player already released', e);
                clearStatusSubscription();
                safePlayerPause(player);
              }
            })();
          }, REPEAT_GAP_MS);
          return;
        }

        clearStatusSubscription();
        void safePlayerSeekTo(player, 0);
        safePlayerPause(player);
      });
      statusSubRef.current = sub;

      safePlayerPlay(player);
    } catch (e) {
      console.log('Player already released', e);
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = null;
      }
      clearStatusSubscription();
      safePlayerPause(player);
    }
  }, [clearStatusSubscription, phraseId, player, source]);

  return (
    <Pressable
      style={styles.speakerRect}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={play}
    >
      <View style={styles.speakerCircle}>
        <Text style={styles.speakerLetter}>{letter}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  speakerRect: {
    flex: 1,
    minWidth: 0,
    minHeight: 80,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerLetter: {
    color: BUTTON_TEXT,
    fontSize: 22,
    fontWeight: '700',
  },
});
