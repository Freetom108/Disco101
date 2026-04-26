import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
  chapterNumber: number;
  categoryTitle: string;
  isChapterComplete: boolean;
  isAllPhrasesComplete: boolean;
  inChapterN: number;
  ch1Count: number;
  globalProgressText: string;
  globalBarPct: number;
  english: string;
  german: string;
  category: string;
  currentIndex: number;
  completedChapterName: string;
  onStartTest: () => void;
  onRepeatChapter: () => void;
  onNextChapter: () => void;
  onBack: () => void;
  onNext: () => void;
};

export default function PhraseCard({
  chapterNumber,
  categoryTitle,
  isChapterComplete,
  isAllPhrasesComplete,
  inChapterN,
  ch1Count,
  globalProgressText,
  globalBarPct,
  english,
  german,
  category,
  currentIndex,
  completedChapterName,
  onStartTest,
  onRepeatChapter,
  onNextChapter,
  onBack,
  onNext,
}: PhraseCardProps) {
  const [pinned, setPinned] = useState(false);
  const showChapterMenu = isChapterComplete && !isAllPhrasesComplete;
  const isBackDisabled = false;

  return (
    <View style={styles.phraseCardOuter}>
      <View style={styles.phraseCardShadow}>
        <View style={styles.phraseCard}>
          <View>
            <View style={styles.cardHeaderTop}>
              <Text
                style={[styles.cardChapter, styles.cardChapterFlex]}
                numberOfLines={2}
              >
                {`KAPITEL ${chapterNumber} · ${categoryTitle.toUpperCase()}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={pinned ? 'Markierung entfernen' : 'Markieren'}
                hitSlop={8}
                onPress={() => setPinned((p) => !p)}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={pinned ? '#CF142B' : '#00247D'}
                />
              </Pressable>
            </View>
            <View style={styles.cardGlobalRow}>
              <Text style={styles.cardGlobalLabel}>Fortschritt gesamt</Text>
              <Text style={styles.cardGlobalValue}>{globalProgressText}</Text>
            </View>
            <View style={styles.cardProgressTrack}>
              <View
                style={[
                  styles.cardProgressFill,
                  { width: `${globalBarPct}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.cardMid}>
            {showChapterMenu ? (
              <View style={styles.chapterMenuBlock}>
                <Text
                  style={[
                    styles.chapterMenuTitle,
                    { fontFamily: FONT_DM_SERIF },
                  ]}
                >
                  Kapitel abgeschlossen! 🎉
                </Text>
                <Text style={styles.chapterMenuSubtitle}>
                  {completedChapterName}
                </Text>
                <View style={styles.chapterMenuButtons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Test starten"
                    style={({ pressed }) => [
                      styles.chapterMenuBtnPrimary,
                      pressed && { opacity: 0.92 },
                    ]}
                    onPress={onStartTest}
                  >
                    <Text style={styles.chapterMenuBtnPrimaryText}>
                      📝 Test starten
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Kapitel wiederholen"
                    style={({ pressed }) => [
                      styles.chapterMenuBtnOutline,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={onRepeatChapter}
                  >
                    <Text style={styles.chapterMenuBtnOutlineText}>
                      🔁 Kapitel wiederholen
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nächstes Kapitel"
                    style={({ pressed }) => [
                      styles.chapterMenuBtnGhost,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={onNextChapter}
                  >
                    <Text style={styles.chapterMenuBtnGhostText}>
                      Nächstes Kapitel →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : isChapterComplete ? (
              <Text
                style={[styles.cardCompleteTitle, { fontFamily: FONT_DM_SERIF }]}
              >
                Alle 101 Phrasen gelernt!
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
                disabled={isBackDisabled}
                style={({ pressed }) => [
                  pressed && !isBackDisabled && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.cardBack,
                    isBackDisabled && styles.cardBackDisabled,
                  ]}
                >
                  Zurück
                </Text>
              </Pressable>
              {!(isChapterComplete && !isAllPhrasesComplete) ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.cardNext,
                    isAllPhrasesComplete && styles.cardNextDisabled,
                    pressed && !isAllPhrasesComplete && { opacity: 0.92 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Nächste Phrase"
                  onPress={onNext}
                  disabled={isAllPhrasesComplete}
                >
                  <Text
                    style={[
                      styles.cardNextText,
                      isAllPhrasesComplete && styles.cardNextTextDisabled,
                    ]}
                  >
                    Nächste Phrase →
                  </Text>
                </Pressable>
              ) : null}
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
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardChapter: {
    color: INACTIVE,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  cardChapterFlex: {
    flex: 1,
  },
  cardGlobalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardGlobalLabel: {
    color: 'rgba(0, 0, 0, 0.55)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
    color: '#1A1A1A',
    fontSize: 26,
    lineHeight: 34,
    marginTop: 12,
  },
  cardGerman: {
    color: '#999999',
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
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  categoryPillText: {
    color: '#1A1A1A',
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
    backgroundColor: '#CF142B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardNextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMenuBlock: {
    width: '100%',
    alignItems: 'center',
  },
  chapterMenuTitle: {
    color: ACTIVE,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  chapterMenuSubtitle: {
    color: INACTIVE,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  chapterMenuButtons: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  chapterMenuBtnPrimary: {
    backgroundColor: ACTIVE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chapterMenuBtnPrimaryText: {
    color: BUTTON_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMenuBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: INACTIVE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chapterMenuBtnOutlineText: {
    color: INACTIVE,
    fontSize: 16,
    fontWeight: '500',
  },
  chapterMenuBtnGhost: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chapterMenuBtnGhostText: {
    color: INACTIVE,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
});
