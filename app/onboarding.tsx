import { useFonts } from 'expo-font';
import { useCallback, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { FONT_DM_SERIF } from '../constants/theme';

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
  const [fontsLoaded] = useFonts({
    [FONT_DM_SERIF]: require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
  });

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
    if (slideIndex < 2) {
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
            <View style={styles.slideInnerFirst}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.slide1TextBlock}>
                <Text
                  style={[styles.titleWelcome, { fontFamily: FONT_DM_SERIF }]}
                >
                  Willkommen bei Disco 101
                </Text>
                <Text style={styles.subtitle}>
                  101 wichtige Redewendungen für deinen Urlaub
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
                So lernst du
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  · 🃏 Englischer Satz oben, deutsche Übersetzung darunter
                </Text>
                <Text style={styles.listItem}>
                  · 🔊 M oder F antippen → Aussprache anhören
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  · 🗣️ Nachsprechen und zur nächsten Phrase weiter
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
                Nach jedem Kapitel
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>
                  · 📝 Teste dein Wissen mit einem kurzen Quiz
                </Text>
                <Text style={styles.listItem}>
                  · 📌 Markiere schwierige Karten zur Wiederholung
                  {'\n'}
                  📍 Tippe den blauen Pin → er wird rot und die Karte{'\n'}
                  landet im Repeat-Stapel
                </Text>
                <Text style={[styles.listItem, styles.listItemLast]}>
                  · ⚙️ Alles jederzeit in Settings nachlesen
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <View
          style={[styles.footerFixed, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIndex && styles.dotActive]}
              />
            ))}
          </View>
          {slideIndex < 2 ? (
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
  slideInnerFirst: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide1TextBlock: {
    alignItems: 'center',
  },
  slideInnerCentered: {
    flex: 1,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 48,
    backgroundColor: 'transparent',
  },
  titleWelcome: {
    color: TITLE_DARK,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: BODY_GRAY,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 0,
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
