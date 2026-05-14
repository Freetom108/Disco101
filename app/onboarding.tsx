import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { FONT_DM_SERIF, CARD_BG, INACTIVE } from '../constants/theme';
import { audioAssets } from '../utils/audioAssets';
import {
  safePlayerPause,
  safePlayerPlay,
  safePlayerReplace,
  safePlayerSeekTo,
  safePlayerSetPlaybackRate,
} from '../utils/safeAudioPlayer';

const CHRIS_AVATAR = require('../assets/images/chris-avatar.png');
const ANN_AVATAR = require('../assets/images/ann-avatar.png');
const ONBOARDING_BG = '#EDE9E3';
const ONBOARDING_KEY = 'onboarding_done';
const TITLE_DARK = '#1A1A1A';
const BODY_GRAY = '#444444';
const DOT_INACTIVE = '#AAAAAA';

/** Space reserved for dots + primary/ghost button + padding (fixed bottom bar). */
const FOOTER_ZONE = 140;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const width = windowWidth > 0 ? windowWidth : 400;
  const slideHeight = Math.max(
    200,
    windowHeight - insets.top - insets.bottom - FOOTER_ZONE,
  );
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
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

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      setSlideIndex(Math.round(x / width));
    },
    [width],
  );

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setSlideIndex(index);
  };

  const onWeiter = () => {
    if (slideIndex < 3) {
      goToSlide(slideIndex + 1);
    }
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
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
          <View style={[styles.slide, { width, height: slideHeight }]}>
            <View style={styles.slide1Wrap}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.slide1Logo}
                resizeMode="contain"
              />
              <View style={styles.practiceCard}>
                <Text
                  style={[styles.slide1English, { fontFamily: FONT_DM_SERIF }]}
                  adjustsFontSizeToFit
                  numberOfLines={4}
                  minimumFontScale={0.85}
                >
                  Welcome to Disco 101! Let us show you how it works.
                </Text>
                <Text style={styles.slide1German}>
                  Willkommen bei Disco 101! Lass dir zeigen wie es funktioniert.
                </Text>
                <View style={styles.slide1AvatarRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Chris (männliche Stimme)"
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
                      <Text style={styles.slide1VoiceLabel}>Chris</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ann (weibliche Stimme)"
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
                      <Text style={styles.slide1VoiceLabel}>Ann</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.slide, { width, height: slideHeight }]}>
            <View style={[styles.slideInnerCentered, styles.slideInnerLearn]}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                So lernst du
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  · 🃏 Auf der Übungskarte erscheint eine englische Redewendung
                  mit der deutschen Übersetzung darunter
                </Text>
                <Text style={styles.listItem}>
                  · 🔊 Hör dir bei Chris und Ann die richtige Aussprache an und
                  wiederhole den Satz laut so oft du möchtest – mit der großen
                  roten Taste kommst du zur nächsten Phrase
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  · 📌 Übungskarten bei denen du noch nicht sicher bist markierst
                  du mit der blauen Stecknadel – sie wandern in den Repeat-Stapel
                  wo du sie üben kannst bis sie sicher sitzen
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.slide, { width, height: slideHeight }]}>
            <View style={styles.slideInnerCentered}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                Testen & Wiederholen
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  · 🎧 Test 1: Chris oder Ann lesen dir einen Satz vor – erkenne
                  ihn unter drei englischen Optionen
                </Text>
                <Text style={styles.listItem}>
                  · 🇩🇪 Test 2: Chris oder Ann lesen dir einen Satz vor – finde
                  die richtige deutsche Bedeutung unter drei Optionen
                </Text>
                <Text style={styles.listItem}>
                  · ⚡ Jeder Test stellt dir 8 zufällige Aufgaben aus dem
                  Kapitel – bei Wiederholung bekommst du andere Fragen
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  · 🔄 Falsch beantwortete Karten landen automatisch im
                  Repeat-Stapel damit du sie jederzeit üben kannst bis sie sitzen
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.slide, { width, height: slideHeight }]}>
            <View style={styles.slideInnerCentered}>
              <Text
                style={[
                  styles.titleSection,
                  styles.titleSectionSpaced,
                  { fontFamily: FONT_DM_SERIF },
                ]}
              >
                Dein Lernplan
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  · 📚 Im Learn Tab siehst du deinen Fortschritt und kannst
                  jederzeit in jedes Kapitel einsteigen
                </Text>
                <Text style={styles.listItem}>
                  · ⚙️ In Settings kannst du Geschwindigkeit und Anzahl der
                  Wiederholungen der Stimmen anpassen
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  · 💡 Alles jederzeit in Settings nachlesen
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
              accessibilityLabel="Weiter"
            >
              <Text style={styles.btnGhostText}>Weiter →</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onLos}
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Los geht's"
            >
              <Text style={styles.btnPrimaryText}>Los geht's →</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ONBOARDING_BG,
  },
  loadingOnly: {
    backgroundColor: ONBOARDING_BG,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  slide: {
    minHeight: 200,
  },
  slide1Wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '3%',
    paddingVertical: 12,
  },
  slide1Logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  practiceCard: {
    alignSelf: 'stretch',
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
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
  slide1English: {
    color: TITLE_DARK,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  slide1German: {
    color: BODY_GRAY,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
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
    color: INACTIVE,
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
    color: TITLE_DARK,
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
    color: BODY_GRAY,
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
    backgroundColor: DOT_INACTIVE,
  },
  dotActive: {
    backgroundColor: TITLE_DARK,
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
    color: TITLE_DARK,
    fontSize: 18,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#CF142B',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
