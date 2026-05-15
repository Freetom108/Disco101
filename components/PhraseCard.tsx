import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ACTIVE,
  BUTTON_TEXT,
  CARD_BG,
  CARD_DE,
  FONT_DM_SERIF,
  INACTIVE,
  SCREEN_BG,
} from '../constants/theme';
import type { ModuleCode } from '../constants/products';
import SpeakerButton from './SpeakerButton';
import { preloadPhraseAudio } from '../utils/audioPreloader';

const CHRIS_AVATAR = require('../assets/chris.png');
const ANN_AVATAR = require('../assets/ann.png');

const SLIDE_OFFSET = Math.min(520, Math.round(Dimensions.get('window').height * 0.42));
const SLIDE_DURATION_MS = 380;
const SLIDE_EASING = Easing.inOut(Easing.ease);

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
  phraseId: number;
  chapterPhraseIds: number[];
  /** Active learning module — selects bundled phrase MP3s (e.g. Unit 2). */
  moduleCode: ModuleCode;
  isPinned: boolean;
  onTogglePin: (id: number) => void;
  onStartTest: () => void;
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
  phraseId,
  chapterPhraseIds,
  moduleCode,
  isPinned,
  onTogglePin,
  onStartTest,
  onNextChapter,
  onBack,
  onNext,
}: PhraseCardProps) {
  const showChapterMenu = isChapterComplete;
  const isBackDisabled = false;

  const slideY = useRef(new Animated.Value(0)).current;
  const [isSlideAnimating, setIsSlideAnimating] = useState(false);

  const swipeGesturesEnabled =
    !isChapterComplete && !isAllPhrasesComplete && !isSlideAnimating;

  useEffect(() => {
    if (!isSlideAnimating) {
      slideY.setValue(0);
    }
  }, [phraseId, slideY, isSlideAnimating]);

  useEffect(() => {
    preloadPhraseAudio(chapterPhraseIds, moduleCode);
  }, [chapterPhraseIds, moduleCode]);

  const runAnimatedNext = useCallback(() => {
    if (isSlideAnimating || isAllPhrasesComplete) return;
    slideY.stopAnimation();
    setIsSlideAnimating(true);
    Animated.timing(slideY, {
      toValue: -SLIDE_OFFSET,
      duration: SLIDE_DURATION_MS,
      easing: SLIDE_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setIsSlideAnimating(false);
        return;
      }
      slideY.setValue(SLIDE_OFFSET);
      onNext();
      requestAnimationFrame(() => {
        Animated.timing(slideY, {
          toValue: 0,
          duration: SLIDE_DURATION_MS,
          easing: SLIDE_EASING,
          useNativeDriver: true,
        }).start(() => {
          setIsSlideAnimating(false);
        });
      });
    });
  }, [slideY, onNext, isAllPhrasesComplete, isSlideAnimating]);

  const runAnimatedBack = useCallback(() => {
    if (isSlideAnimating || isBackDisabled) return;
    slideY.stopAnimation();
    setIsSlideAnimating(true);
    Animated.timing(slideY, {
      toValue: SLIDE_OFFSET,
      duration: SLIDE_DURATION_MS,
      easing: SLIDE_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setIsSlideAnimating(false);
        return;
      }
      slideY.setValue(-SLIDE_OFFSET);
      onBack();
      requestAnimationFrame(() => {
        Animated.timing(slideY, {
          toValue: 0,
          duration: SLIDE_DURATION_MS,
          easing: SLIDE_EASING,
          useNativeDriver: true,
        }).start(() => {
          setIsSlideAnimating(false);
        });
      });
    });
  }, [slideY, onBack, isBackDisabled, isSlideAnimating]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
          if (!swipeGesturesEnabled) return false;
          const { dx, dy } = g;
          return Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (!swipeGesturesEnabled) return;
          const { dy, vy } = g;
          if (dy < -56 || vy < -0.35) {
            runAnimatedNext();
          } else if (dy > 56 || vy > 0.35) {
            runAnimatedBack();
          }
        },
      }),
    [swipeGesturesEnabled, runAnimatedNext, runAnimatedBack],
  );

  return (
    <View style={styles.phraseCardOuter}>
      <Animated.View
        style={[
          styles.phraseCardShadow,
          { transform: [{ translateY: slideY }] },
        ]}
      >
        <View style={styles.phraseCard}>
          {!isChapterComplete ? (
            <Pressable
              style={styles.pinFloating}
              accessibilityRole="button"
              accessibilityLabel={isPinned ? 'Markierung entfernen' : 'Markieren'}
              hitSlop={12}
              onPress={() => {
                if (phraseId) onTogglePin(phraseId);
              }}
            >
              <Ionicons
                name="pin"
                size={20}
                color={isPinned ? '#C8102E' : '#00247D'}
              />
            </Pressable>
          ) : null}
          <View
            style={styles.swipeZone}
            {...panResponder.panHandlers}
          >
            <View>
              <View style={styles.cardHeaderTop}>
                <Text
                  style={[styles.cardChapter, styles.cardChapterFlex]}
                  numberOfLines={2}
                >
                  {`KAPITEL ${chapterNumber} · ${categoryTitle.toUpperCase()}`}
                </Text>
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
                  {isAllPhrasesComplete
                    ? 'Alle 101 Phrasen gelernt! 🎉'
                    : 'Kapitel abgeschlossen! 🎉'}
                </Text>
                <Text style={styles.chapterMenuSubtitle}>
                  {completedChapterName}
                </Text>
                <View style={styles.chapterMenuButtons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tests starten"
                    style={({ pressed }) => [
                      styles.chapterMenuBtnPrimary,
                      pressed && { opacity: 0.92 },
                    ]}
                    onPress={onStartTest}
                  >
                    <Text style={styles.chapterMenuBtnPrimaryText}>
                      📝 Tests starten
                    </Text>
                  </Pressable>
                  {chapterNumber < 7 ? (
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
                  ) : null}
                </View>
              </View>
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

            {!isChapterComplete ? (
              <View style={styles.cardMFRow}>
                <SpeakerButton
                  accessibilityLabel="Male speaker"
                  letter="M"
                  phraseId={phraseId}
                  moduleCode={moduleCode}
                  avatarSource={CHRIS_AVATAR}
                />
                <SpeakerButton
                  accessibilityLabel="Female speaker"
                  letter="F"
                  phraseId={phraseId}
                  moduleCode={moduleCode}
                  avatarSource={ANN_AVATAR}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.cardFooterColumn}>
            {!(isChapterComplete && !isAllPhrasesComplete) ? (
              <Pressable
                style={({ pressed }) => [
                  styles.cardNext,
                  isAllPhrasesComplete && styles.cardNextDisabled,
                  pressed && !isAllPhrasesComplete && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Nächste Phrase"
                onPress={runAnimatedNext}
                disabled={isAllPhrasesComplete || isSlideAnimating}
              >
                <View style={styles.cardNextInner}>
                  <Text
                    style={[
                      styles.cardNextText,
                      isAllPhrasesComplete && styles.cardNextTextDisabled,
                    ]}
                  >
                    Nächste Phrase
                  </Text>
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zurück"
              onPress={runAnimatedBack}
              disabled={isBackDisabled || isSlideAnimating}
              style={({ pressed }) => [
                styles.cardBackBelowWrap,
                (isBackDisabled || isSlideAnimating) && styles.cardBackBelowDisabled,
                pressed && !isBackDisabled && !isSlideAnimating && {
                  opacity: 0.72,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardBackBelowText,
                  isBackDisabled && styles.cardBackDisabled,
                ]}
              >
                Zurück
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  phraseCardOuter: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
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
    position: 'relative',
  },
  pinFloating: {
    position: 'absolute',
    right: 16,
    top: '45%',
    zIndex: 2,
    marginTop: -10,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
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
  swipeZone: {
    flex: 1,
    minHeight: 0,
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
    marginTop: 14,
  },
  cardFooterColumn: {
    marginTop: 18,
    width: '100%',
    alignItems: 'stretch',
  },
  cardNextInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardBackBelowWrap: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  cardBackBelowText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardBackBelowDisabled: {
    opacity: 0.45,
  },
  cardNext: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#C8102E',
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
