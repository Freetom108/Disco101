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
import type { AppPalette } from '../constants/themePalettes';
import { FONT_DM_SERIF } from '../constants/theme';
import { useAppTheme } from '../context/AppThemeContext';
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
  currentChapterCount: number;
  totalPhraseCount: number;
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
  currentChapterCount,
  totalPhraseCount,
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createPhraseCardStyles(colors), [colors]);

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
                color={isPinned ? colors.accentRed : colors.phrasePinInactive}
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
                    ? `Alle ${totalPhraseCount} Phrasen gelernt! 🎉`
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
                    / {currentChapterCount}  Phrase im Kapitel
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
                  <Text
                    style={styles.categoryPillText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {category}
                  </Text>
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
                    color={colors.buttonOnAccent}
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

function createPhraseCardStyles(c: AppPalette) {
  return StyleSheet.create({
  phraseCardOuter: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  phraseCardShadow: {
    flex: 1,
    minHeight: 0,
    backgroundColor: c.screenBg,
    borderRadius: 28,
    marginHorizontal: '3%',
    marginVertical: 8,
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: c.shadowColor,
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
    backgroundColor: c.cardBg,
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
    color: c.textMeta,
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
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  cardGlobalValue: {
    color: c.accentBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  cardProgressTrack: {
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: c.progressTrack,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: 4,
    backgroundColor: c.accentBlue,
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
    color: c.accentBlue,
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 60,
  },
  cardNumHint: {
    color: c.textSecondary,
    fontSize: 15,
    marginBottom: 8,
  },
  cardEnglish: {
    color: c.textPrimary,
    fontSize: 26,
    lineHeight: 34,
    marginTop: 12,
  },
  cardGerman: {
    color: c.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 14,
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: c.categoryPillBg,
  },
  categoryPillText: {
    color: c.textPrimary,
    fontSize: 12,
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
    color: c.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardBackBelowDisabled: {
    opacity: 0.45,
  },
  cardNext: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: c.accentRed,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardNextText: {
    color: c.buttonOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMenuBlock: {
    width: '100%',
    alignItems: 'center',
  },
  chapterMenuTitle: {
    color: c.accentBlue,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  chapterMenuSubtitle: {
    color: c.textMeta,
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
    backgroundColor: c.accentBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chapterMenuBtnPrimaryText: {
    color: c.buttonOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMenuBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: c.borderHairline,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chapterMenuBtnOutlineText: {
    color: c.textMeta,
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
    color: c.textMeta,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  });
}

