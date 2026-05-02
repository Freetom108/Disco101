import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BUTTON_TEXT,
  HEADER_DARK,
  HEADER_TEXT_SUB,
  INACTIVE,
  SCREEN_BG,
} from '../../../constants/theme';
import SENTENCES from '../../../data/sentences.json';

const PINNED_KEY = 'pinned_phrases';

type Phrase = (typeof SENTENCES)[number];

type ChapterPinGroup = {
  chapterId: number;
  title: string;
  count: number;
  phraseIds: number[];
};

function buildChapterGroups(
  pinnedIds: number[],
  sentences: Phrase[],
): ChapterPinGroup[] {
  const byId = new Map(sentences.map((s) => [s.id, s]));
  const map = new Map<number, number[]>();
  for (const id of pinnedIds) {
    const s = byId.get(id);
    if (!s) continue;
    const list = map.get(s.chapterId) ?? [];
    list.push(id);
    map.set(s.chapterId, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chapterId, phraseIds]) => {
      const first = sentences.find((x) => x.chapterId === chapterId);
      return {
        chapterId,
        title: first?.category ?? `Kapitel ${chapterId}`,
        count: phraseIds.length,
        phraseIds,
      };
    });
}

export default function RepeatOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(PINNED_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          const ids = Array.isArray(parsed)
            ? parsed.filter((x: unknown) => typeof x === 'number')
            : [];
          if (!cancelled) setPinnedIds(ids);
        } catch {
          if (!cancelled) setPinnedIds([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const groups = useMemo(
    () => buildChapterGroups(pinnedIds, SENTENCES as Phrase[]),
    [pinnedIds],
  );

  const totalCount = useMemo(
    () => groups.reduce((n, g) => n + g.count, 0),
    [groups],
  );

  const showEmpty = !loading && totalCount === 0;

  const startAllSession = () => {
    if (pinnedIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: { phraseIds: JSON.stringify(pinnedIds) },
    });
  };

  const startChapterSession = (g: ChapterPinGroup) => {
    if (g.phraseIds.length === 0) return;
    router.push({
      pathname: '/(tabs)/wiederholen/session',
      params: { phraseIds: JSON.stringify(g.phraseIds) },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: SCREEN_BG }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerLine1}>Repeat</Text>
            <Text style={styles.headerLine2}>Dein Übungsstapel</Text>
          </View>
          <View style={styles.headerLogoMask}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBody} />
      ) : showEmpty ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="pin" size={48} color="#AAAAAA" />
          <Text style={styles.emptyTitle}>Noch keine Karten gespeichert.</Text>
          <Text style={styles.emptySubtext}>
            Tippe den PIN auf einer Karte – sie landet automatisch auf dem Stapel
            ihres Kapitels und wartet hier auf dich, damit du sie so oft wiederholen
            kannst bis sie sitzt.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 90 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stackHeaderBlock}>
            <Text style={styles.stackHeaderTitle}>
              Hier sind deine Übungsstapel
            </Text>
            <Text style={styles.stackHeaderSub}>
              {totalCount} Karte{totalCount === 1 ? '' : 'n'} gespeichert
            </Text>
          </View>

          <Pressable
            onPress={startAllSession}
            style={({ pressed }) => [
              styles.shuffleBtn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alle Karten wiederholen"
          >
            <Text style={styles.shuffleBtnText}>🔀 Alle Karten wiederholen</Text>
          </Pressable>

          <View style={styles.divider} />

          {groups.map((g) => (
            <Pressable
              key={g.chapterId}
              onPress={() => startChapterSession(g)}
              style={({ pressed }) => [
                styles.chapterCard,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${g.title}, ${g.count} Karten wiederholen`}
            >
              <View style={styles.chapterRowInner}>
                <Text style={styles.chapterTitle} numberOfLines={2}>
                  {g.title}
                </Text>
                <View style={styles.chapterMeta}>
                  <Text style={styles.chapterCount}>
                    {g.count} {g.count === 1 ? 'Karte' : 'Karten'}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#8E8E93"
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: HEADER_DARK,
    marginTop: 12,
    marginHorizontal: '3%',
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  headerLine1: {
    color: INACTIVE,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
  },
  headerLine2: {
    color: HEADER_TEXT_SUB,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  headerLogoMask: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  loadingBody: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#444444',
  },
  emptySubtext: {
    marginTop: 12,
    color: '#AAAAAA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: '3%',
  },
  stackHeaderBlock: {
    marginBottom: 16,
  },
  stackHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stackHeaderSub: {
    fontSize: 14,
    color: INACTIVE,
  },
  shuffleBtn: {
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  shuffleBtnText: {
    color: BUTTON_TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginBottom: 16,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
    }),
  },
  chapterRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 12,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterCount: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
