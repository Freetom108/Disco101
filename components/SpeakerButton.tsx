import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIVE, BUTTON_TEXT } from '../constants/theme';

type SpeakerButtonProps = {
  accessibilityLabel: string;
  letter: string;
};

export default function SpeakerButton({
  accessibilityLabel,
  letter,
}: SpeakerButtonProps) {
  return (
    <Pressable style={styles.speakerRect} accessibilityLabel={accessibilityLabel}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
