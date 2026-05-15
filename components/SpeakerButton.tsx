import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setAudioModeAsync,
  useAudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AUDIO_REPEAT_KEY,
  AUDIO_SPEED_KEY,
  audioSpeedToRate,
  parseAudioRepeat,
  parseAudioSpeed,
} from '../constants/audioSettingsStorage';
import { ACTIVE, BUTTON_TEXT, INACTIVE } from '../constants/theme';
import type { ModuleCode } from '../constants/products';
import { getPreloadedSource } from '../utils/audioPreloader';
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
  /** Defaults to Unit 1 — pass active learning module for bundled phrase assets. */
  moduleCode?: ModuleCode;
  avatarSource?: any;
};

export default function SpeakerButton({
  accessibilityLabel,
  letter,
  phraseId,
  moduleCode = '101',
  avatarSource,
}: SpeakerButtonProps) {
  const voice = letter.trim().toUpperCase() === 'M' ? 'm' : 'f';
  const source = getPreloadedSource(phraseId, voice, moduleCode);

  const player = useAudioPlayer(null, { updateInterval: 100 });

  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishCountRef = useRef(0);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);
  const isReleasedRef = useRef(false);

  const clearStatusSubscription = useCallback(() => {
    statusSubRef.current?.remove();
    statusSubRef.current = null;
  }, []);

  useEffect(() => {
    isReleasedRef.current = false;
  }, [phraseId, moduleCode]);

  useEffect(() => {
    if (!source) return;
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    clearStatusSubscription();
    if (isReleasedRef.current) return;
    safePlayerPause(player);
    if (isReleasedRef.current) return;
    safePlayerReplace(player, source);
  }, [source, player, clearStatusSubscription]);

  useEffect(() => {
    return () => {
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = null;
      }
      clearStatusSubscription();
      if (isReleasedRef.current) return;
      safePlayerPause(player);
      isReleasedRef.current = true;
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

      if (isReleasedRef.current) return;
      safePlayerPause(player);
      if (isReleasedRef.current) return;
      await safePlayerSeekTo(player, 0);

      if (isReleasedRef.current) return;
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
                if (isReleasedRef.current) return;
                await safePlayerSeekTo(player, 0);
                if (isReleasedRef.current) return;
                safePlayerPlay(player);
              } catch {
                clearStatusSubscription();
                if (isReleasedRef.current) return;
                safePlayerPause(player);
              }
            })();
          }, REPEAT_GAP_MS);
          return;
        }

        clearStatusSubscription();
        if (isReleasedRef.current) return;
        void safePlayerSeekTo(player, 0);
        if (isReleasedRef.current) return;
        safePlayerPause(player);
      });
      statusSubRef.current = sub;

      if (isReleasedRef.current) return;
      safePlayerPlay(player);
    } catch {
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = null;
      }
      clearStatusSubscription();
      if (isReleasedRef.current) return;
      safePlayerPause(player);
    }
  }, [clearStatusSubscription, phraseId, player, source]);

  const speakerName = letter.trim().toUpperCase() === 'M' ? 'Chris' : 'Ann';

  return (
    <Pressable
      style={styles.speakerRect}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={play}
    >
      {avatarSource ? (
        <View style={styles.avatarColumn}>
          <View style={styles.avatarRound}>
            <Image
              source={avatarSource}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.avatarName}>{speakerName}</Text>
        </View>
      ) : (
        <View style={styles.speakerCircle}>
          <Text style={styles.speakerLetter}>{letter}</Text>
        </View>
      )}
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
  avatarColumn: {
    alignItems: 'center',
  },
  avatarRound: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  avatarName: {
    fontSize: 13,
    color: INACTIVE,
    textAlign: 'center',
    marginTop: 4,
  },
});
