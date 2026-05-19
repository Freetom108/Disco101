import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import type { AppPalette } from '../constants/themePalettes';
import { FONT_DM_SERIF } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import { useAppTheme } from '../context/AppThemeContext';
import { audioAssets } from '../utils/audioAssets';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSeekTo,
  safePlayerSetPlaybackRate,
} from '../utils/safeAudioPlayer';

const CHRIS_AVATAR = require('../assets/chris.png');
const ANN_AVATAR = require('../assets/ann.png');
const ONBOARDING_KEY = 'onboarding_done';

/** Space reserved for dots + primary/ghost button + padding (fixed bottom bar). */
const FOOTER_ZONE = 140;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createOnboardingStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const width = windowWidth > 0 ? windowWidth : 400;
  /** Fallback before onLayout; matches pager viewport ≈ screen minus footer overlay. */
  const pageHeightFallback = Math.max(
    200,
    windowHeight - insets.top - insets.bottom - FOOTER_ZONE,
  );
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideIndexRef = useRef(0);
  slideIndexRef.current = slideIndex;
  const [pagerViewportH, setPagerViewportH] = useState(0);
  const pageH =
    pagerViewportH > 0 ? pagerViewportH : pageHeightFallback;
  const welcomePlayer = useAudioPlayer(null, { updateInterval: 100 });
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

  useEffect(() => {
    return () => {
      safePlayerPause(welcomePlayer);
    };
  }, [welcomePlayer]);

  const playWelcomeVoice = useCallback(
    async (gender: 'm' | 'f') => {
      const key = gender === 'm' ? 'welcome_m' : 'welcome_f';
      const src = audioAssets[key];
      if (!src) return;
      try {
        safePlayerPause(welcomePlayer);
        safePlayerReplace(welcomePlayer, src);
        for (let i = 0; i < 60; i++) {
          if (welcomePlayer.currentStatus.duration > 0) break;
          await new Promise<void>((r) => setTimeout(r, 40));
        }
        if (welcomePlayer.currentStatus.duration <= 0) return;
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
        safePlayerPause(welcomePlayer);
        await safePlayerSeekTo(welcomePlayer, 0);
        safePlayerSetPlaybackRate(welcomePlayer, 1, 'medium');
        safePlayerPlay(welcomePlayer);
      } catch (e) {
        console.log('Welcome audio', e);
        safePlayerPause(welcomePlayer);
      }
    },
    [welcomePlayer],
  );

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.min(3, Math.max(0, index));
      const h = pagerViewportH > 0 ? pagerViewportH : pageHeightFallback;
      scrollRef.current?.scrollTo({
        y: clamped * h,
        animated: true,
      });
      setSlideIndex(clamped);
    },
    [pageHeightFallback, pagerViewportH],
  );

  const onPagerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const h = pagerViewportH > 0 ? pagerViewportH : pageHeightFallback;
      if (h <= 0) return;
      const idx = Math.round(y / h);
      setSlideIndex(Math.min(3, Math.max(0, idx)));
    },
    [pageHeightFallback, pagerViewportH],
  );

  /** After measuring the pager, realign offset without animation (viewport height changed). */
  useEffect(() => {
    if (pagerViewportH <= 0) return;
    scrollRef.current?.scrollTo({
      y: slideIndexRef.current * pagerViewportH,
      animated: false,
    });
  }, [pagerViewportH]);

  const onWeiter = () => {
    if (slideIndex < 3) goToSlide(slideIndex + 1);
  };

  const onLos = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  if (!fontsLoaded) {
    return <View style={[styles.root, styles.loadingOnly]} />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View
          style={styles.pagerOuter}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0 && h !== pagerViewportH) setPagerViewportH(h);
          }}
        >
          <ScrollView
            ref={scrollRef}
            style={[styles.scroll, { width }]}
            contentContainerStyle={{ width }}
            pagingEnabled
            nestedScrollEnabled
            scrollEventThrottle={16}
            onMomentumScrollEnd={onPagerScrollEnd}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
          <View style={[styles.slide, { width, height: pageH }]}>
            <View style={styles.slide1Wrap}>
              <Image
                source={require('../assets/images/disco-ball.png')}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  letterSpacing: 3,
                  color: '#999999',
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                DISCO 101
              </Text>
              <View style={styles.practiceCard}>
                <Text
                  style={[styles.slide1English, { fontFamily: FONT_DM_SERIF }]}
                  adjustsFontSizeToFit
                  numberOfLines={4}
                  minimumFontScale={0.85}
                >
                  {STRINGS.onboardingWelcomeEnglish}
                </Text>
                <Text style={styles.slide1German}>
                  {STRINGS.onboardingWelcomeGerman}
                </Text>
                <View style={styles.slide1AvatarRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.a11yChrisMaleVoice}
                    onPress={() => void playWelcomeVoice('m')}
                    style={({ pressed }) => [
                      styles.slide1SpeakerBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <View style={styles.slide1AvatarColumn}>
                      <View style={styles.slide1AvatarCircle}>
                        <Image
                          source={CHRIS_AVATAR}
                          style={styles.slide1AvatarImg}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.slide1VoiceLabel}>{STRINGS.voiceChris}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.a11yAnnFemaleVoice}
                    onPress={() => void playWelcomeVoice('f')}
                    style={({ pressed }) => [
                      styles.slide1SpeakerBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <View style={styles.slide1AvatarColumn}>
                      <View style={styles.slide1AvatarCircle}>
                        <Image
                          source={ANN_AVATAR}
                          style={styles.slide1AvatarImg}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.slide1VoiceLabel}>{STRINGS.voiceAnn}</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.slide, { width, height: pageH }]}>
            <ScrollView
              style={styles.slideBodyScroll}
              contentContainerStyle={styles.slideBodyScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={[styles.slideInnerCentered, styles.slideInnerLearn]}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                {STRINGS.onboardingSlide2Title}
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide2Item1}
                </Text>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide2Item2}
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  {STRINGS.onboardingSlide2Item3}
                </Text>
              </View>
              </View>
            </ScrollView>
          </View>
          <View style={[styles.slide, { width, height: pageH }]}>
            <ScrollView
              style={styles.slideBodyScroll}
              contentContainerStyle={styles.slideBodyScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.slideInnerCentered}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                {STRINGS.onboardingSlide3Title}
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide3Item1}
                </Text>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide3Item2}
                </Text>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide3Item3}
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  {STRINGS.onboardingSlide3Item4}
                </Text>
              </View>
            </View>
            </ScrollView>
          </View>
          <View style={[styles.slide, { width, height: pageH }]}>
            <ScrollView
              style={styles.slideBodyScroll}
              contentContainerStyle={styles.slideBodyScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.slideInnerCentered}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                {STRINGS.onboardingSlide4Title}
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide4Item1}
                </Text>
                <Text style={styles.listItem}>
                  {STRINGS.onboardingSlide4Item2}
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  {STRINGS.onboardingSlide4Item3}
                </Text>
              </View>
            </View>
            </ScrollView>
          </View>
          </ScrollView>
        </View>
        <View
          style={[styles.footerFixed, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIndex && styles.dotActive]}
              />
            ))}
          </View>
          {slideIndex < 3 ? (
            <Pressable
              onPress={onWeiter}
              style={({ pressed }) => [
                styles.btnGhost,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.onboardingWeiterA11y}
            >
              <Text style={styles.btnGhostText}>{STRINGS.onboardingWeiter}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onLos}
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.onboardingLosA11y}
            >
              <Text style={styles.btnPrimaryText}>{STRINGS.onboardingLos}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function createOnboardingStyles(c: AppPalette) {
  const rootBg = c.scheme === 'dark' ? c.screenBg : c.headerBg;

  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: rootBg,
  },
  loadingOnly: {
    backgroundColor: rootBg,
  },
  safe: {
    flex: 1,
  },
  pagerOuter: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    minHeight: 200,
    overflow: 'hidden',
  },
  slideBodyScroll: {
    flex: 1,
  },
  slideBodyScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  slide1Wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '3%',
    paddingBottom: 12,
  },
  slide1Logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  practiceCard: {
    alignSelf: 'stretch',
    backgroundColor: c.cardBg,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    marginTop: 24,
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
  slide1English: {
    color: c.textPrimary,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  slide1German: {
    color: c.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  slide1AvatarRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    alignItems: 'stretch',
  },
  slide1SpeakerBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 80,
    borderRadius: 14,
    backgroundColor: c.speakerBg,
    borderWidth: 1,
    borderColor: c.speakerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide1AvatarColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide1AvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },
  slide1AvatarImg: {
    width: 72,
    height: 72,
  },
  slide1VoiceLabel: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  slideInnerCentered: {
    flex: 1,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  /** Slide 2: avoid vertically-centered clipping — pin content below safe/header zone */
  slideInnerLearn: {
    justifyContent: 'flex-start',
    paddingTop: 32,
    paddingBottom: 24,
  },
  titleSection: {
    color: c.textPrimary,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleSectionSpaced: {
    marginBottom: 48,
  },
  list: {
    width: '100%',
  },
  listItem: {
    color: c.textSecondary,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 32,
  },
  listItemLast: {
    marginBottom: 0,
  },
  footerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    backgroundColor: rootBg,
    zIndex: 50,
    ...Platform.select({
      android: { elevation: 24 },
    }),
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.iconMuted,
  },
  dotActive: {
    backgroundColor: c.accentBlue,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  btnGhost: {
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  btnGhostText: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: c.accentRed,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: c.buttonOnAccent,
    fontSize: 18,
    fontWeight: '600',
  },
});
}
