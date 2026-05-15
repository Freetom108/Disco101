import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  coerceModuleCode,
  getActiveLearningModule,
} from './activeLearningModule';
import type { ModuleCode } from './products';
import { getSentencesForModule } from './sentencePacks';

export const LAST_POSITION_KEY = 'last_position';

export const LEGACY_PINNED_KEY = 'pinned_phrases';
export const LEGACY_CHAPTER_PROGRESS_KEY = 'chapter_progress';

export function pinnedKeyForModule(m: ModuleCode): string {
  return `pinned_phrases_${m}`;
}

export function chapterProgressKey(m: ModuleCode): string {
  return `chapter_progress_${m}`;
}

export async function loadPinnedIdsForModule(m: ModuleCode): Promise<number[]> {
  try {
    let raw = await AsyncStorage.getItem(pinnedKeyForModule(m));
    if (!raw && m === '101') {
      raw = await AsyncStorage.getItem(LEGACY_PINNED_KEY);
      if (raw) {
        await AsyncStorage.setItem(pinnedKeyForModule('101'), raw);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is number => typeof x === 'number')
      : [];
  } catch {
    return [];
  }
}

export async function persistPinnedIdsForModule(
  m: ModuleCode,
  ids: number[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(pinnedKeyForModule(m), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function parseChapterProgressRecord(val: string | null): Record<string, number> {
  if (!val) return {};
  try {
    const o = JSON.parse(val) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return {};
    const out: Record<string, number> = {};
    for (let i = 1; i <= 7; i++) {
      const k = String(i);
      const v = o[k] ?? o[i as unknown as string];
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export async function readChapterProgressRaw(m: ModuleCode): Promise<string | null> {
  let raw = await AsyncStorage.getItem(chapterProgressKey(m));
  if (!raw && m === '101') {
    raw = await AsyncStorage.getItem(LEGACY_CHAPTER_PROGRESS_KEY);
    if (raw) {
      await AsyncStorage.setItem(chapterProgressKey('101'), raw);
    }
  }
  return raw;
}

export async function applyChapterProgressUpdatesAsync(
  moduleCode: ModuleCode,
  updates: Array<{ chapterId: number; phraseIndex: number }>,
): Promise<void> {
  try {
    const raw = await readChapterProgressRaw(moduleCode);
    const progress = parseChapterProgressRecord(raw);
    for (const { chapterId, phraseIndex } of updates) {
      const key = String(chapterId);
      progress[key] = Math.max(progress[key] ?? 0, phraseIndex);
    }
    await AsyncStorage.setItem(
      chapterProgressKey(moduleCode),
      JSON.stringify(progress),
    );
  } catch {
    /* ignore */
  }
}

export async function resolveHomeResume(): Promise<{
  module: ModuleCode;
  chapterId: number;
  phraseIndex: number;
}> {
  const settingsModule = await getActiveLearningModule();
  const pack = getSentencesForModule(settingsModule);
  if (pack.length === 0) {
    return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
  }

  const lpRaw = await AsyncStorage.getItem(LAST_POSITION_KEY);
  if (!lpRaw) {
    return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
  }

  try {
    const p = JSON.parse(lpRaw) as {
      chapterId?: unknown;
      phraseIndex?: unknown;
      moduleCode?: unknown;
    };
    const lpModule =
      p.moduleCode != null ? coerceModuleCode(p.moduleCode) : ('101' as ModuleCode);

    if (lpModule !== settingsModule) {
      await AsyncStorage.setItem(
        LAST_POSITION_KEY,
        JSON.stringify({
          chapterId: 1,
          phraseIndex: 0,
          moduleCode: settingsModule,
        }),
      );
      return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
    }

    const ch = Number(p.chapterId);
    const idx = Number(p.phraseIndex);
    if (!Number.isFinite(ch) || !Number.isFinite(idx)) {
      return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
    }
    if (ch < 1 || ch > 7) {
      return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
    }
    const maxInCh = pack.filter((x) => x.chapterId === ch).length;
    const clampedIdx = Math.min(Math.max(0, idx), maxInCh);
    return {
      module: settingsModule,
      chapterId: ch,
      phraseIndex: clampedIdx,
    };
  } catch {
    return { module: settingsModule, chapterId: 1, phraseIndex: 0 };
  }
}
