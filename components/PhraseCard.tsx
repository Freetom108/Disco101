import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACTIVE,
  BUTTON_TEXT,
  CARD_BG,
  CARD_DE,
  FONT_DM_SERIF,
  INACTIVE,
  SCREEN_BG,
} from '../constants/theme';
import SpeakerButton from './SpeakerButton';

export type PhraseCardProps = {
  categoryTitle: string;
  isChapterComplete: boolean;
  inChapterN: number;
  ch1Count: number;
  chapterBarPct: number;
  english: string;
  german: string;
  category: string;
  currentIndex: number;
  onBack: () => void;
  onNext: () => void;
};

export default function PhraseCard({
  categoryTitle,
  isChapterComplete,
  inChapterN,
  ch1Count,
  chapterBarPct,
  english,
  german,
  category,
  currentIndex,
  onBack,
  onNext,
}: PhraseCardProps) {
  return (
    <View style={styles.phraseCardOuter}>
      <View style={styles.phraseCardShadow}>
        <View style={styles.phraseCard}>
          <View>
            <Text style={styles.cardChapter}>
              KAPITEL 1 · {categoryTitle.toUpperCase()}
            </Text>
            <View style={styles.cardGlobalRow}>
              <Text style={styles.cardGlobalLabel}>Fortschritt gesamt</Text>
              <Text style={styles.cardGlobalValue}>15/101</Text>
            </View>
            <View style={styles.cardProgressTrack}>
              <View
                style={[
                  styles.cardProgressFill,
                  { width: `${chapterBarPct}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.cardMid}>
            {isChapterComplete ? (
              <Text
                style={[styles.cardCompleteTitle, { fontFamily: FONT_DM_SERIF }]}
              >
                Kapitel abgeschlossen!
              </Text>
            ) : (
              <>
                <View style={styles.cardNumberRow}>
                  <Text style={styles.cardBigNum}>{inChapterN}</Text>
                  <Text style={styles.cardNumHint}>
                    / {ch1Count}  Phrase im Kapitel
                  </Text>
                </View>
                <Text
                  style={[styles.cardEnglish, { fontFamily: FONT_DM_SERIF }]}
                  adjustsFontSizeToFit
                  numberOfLines={3}
                  minimumFontScale={0.7}
                >
                  {english}
                </Text>
                <Text
                  style={styles.cardGerman}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {german}
                </Text>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{category}</Text>
                </View>
              </>
            )}
          </View>

          <View
            style={[
              styles.speakerAndFooter,
              isChapterComplete && styles.speakerAndFooterComplete,
            ]}
          >
            {!isChapterComplete ? (
              <View style={styles.cardMFRow}>
                <SpeakerButton
                  accessibilityLabel="Male speaker"
                  letter="M"
                />
                <SpeakerButton
                  accessibilityLabel="Female speaker"
                  letter="F"
                />
              </View>
            ) : null}
            <View style={styles.cardFooterRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Zurück"
                onPress={onBack}
                disabled={currentIndex === 0}
                style={({ pressed }) => [
                  pressed && currentIndex > 0 && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.cardBack,
                    currentIndex === 0 && styles.cardBackDisabled,
                  ]}
                >
                  Zurück
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.cardNext,
                  isChapterComplete && styles.cardNextDisabled,
                  pressed && !isChapterComplete && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Nächste Phrase"
                onPress={onNext}
                disabled={isChapterComplete}
              >
                <Text
                  style={[
                    styles.cardNextText,
                    isChapterComplete && styles.cardNextTextDisabled,
                  ]}
                >
                  Nächste Phrase →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phraseCardOuter: {
    flex: 1,
    minHeight: 0,
  },
  phraseCardShadow: {
    flex: 1,
    minHeight: 0,
    backgroundColor: SCREEN_BG,
    borderRadius: 28,
    marginHorizontal: '3%',
    marginVertical: 8,
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
    }),
  },
  phraseCard: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardChapter: {
    color: INACTIVE,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  cardGlobalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardGlobalLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  cardGlobalValue: {
    color: ACTIVE,
    fontSize: 13,
    fontWeight: '600',
  },
  cardProgressTrack: {
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: 4,
    backgroundColor: ACTIVE,
    borderRadius: 2,
  },
  cardMid: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
    justifyContent: 'center',
  },
  cardCompleteTitle: {
    color: ACTIVE,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  speakerAndFooter: {},
  speakerAndFooterComplete: {
    marginTop: 4,
  },
  cardBackDisabled: {
    opacity: 0.35,
  },
  cardNextDisabled: {
    opacity: 0.5,
  },
  cardNextTextDisabled: {
    opacity: 0.85,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardBigNum: {
    color: ACTIVE,
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 60,
  },
  cardNumHint: {
    color: CARD_DE,
    fontSize: 15,
    marginBottom: 8,
  },
  cardEnglish: {
    color: INACTIVE,
    fontSize: 26,
    lineHeight: 34,
    marginTop: 12,
  },
  cardGerman: {
    color: CARD_DE,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  categoryPillText: {
    color: INACTIVE,
    fontSize: 13,
    fontWeight: '500',
  },
  cardMFRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cardBack: {
    color: INACTIVE,
    fontSize: 16,
    fontWeight: '500',
  },
  cardNext: {
    flex: 1,
    minWidth: 0,
    backgroundColor: ACTIVE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardNextText: {
    color: BUTTON_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});
