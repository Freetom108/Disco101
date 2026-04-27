import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getPhraseAudioSource } from '../constants/phraseAudioModules';
import { ACTIVE, BUTTON_TEXT } from '../constants/theme';

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
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) {
        void s.unloadAsync();
      }
    };
  }, []);

  const play = useCallback(async () => {
    const voice = letter.trim().toUpperCase() === 'M' ? 'm' : 'f';
    const source = getPhraseAudioSource(phraseId, voice);
    if (!source) return;

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const prev = soundRef.current;
      soundRef.current = null;
      if (prev) {
        prev.setOnPlaybackStatusUpdate(null);
        await prev.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(source);
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          void sound.unloadAsync();
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });

      await sound.playAsync();
    } catch {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) {
        await s.unloadAsync().catch(() => {});
      }
    }
  }, [letter, phraseId]);

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
