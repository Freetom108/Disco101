import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleCode } from './products';

/** Legacy bundle key — weiterhin Auswertung für bestehende Installationen */
export const DISC101_FULL_KEY = 'purchase_disc101_full';

export const PURCHASE_UNIT_1 = 'purchase_unit_1';
export const PURCHASE_UNIT_2 = 'purchase_unit_2';
export const PURCHASE_UNIT_3 = 'purchase_unit_3';
export const PURCHASE_UNIT_4 = 'purchase_unit_4';
export const PURCHASE_ALL_UNITS = 'purchase_all_units';

export const PURCHASE_KEY_BY_MODULE: Record<ModuleCode, string> = {
  '101': PURCHASE_UNIT_1,
  '102': PURCHASE_UNIT_2,
  '103': PURCHASE_UNIT_3,
  '104': PURCHASE_UNIT_4,
};

export type ModulePurchaseState = {
  /** Alle vier Units inkl. Kapitel 2–7 */
  allUnitsUnlocked: boolean;
  /** Pro Unit gekauft → Kapitel 2–7 frei (Kapitel 1 immer gratis) */
  units: Record<ModuleCode, boolean>;
};

export const INITIAL_MODULE_PURCHASE_STATE: ModulePurchaseState = {
  allUnitsUnlocked: false,
  units: {
    '101': false,
    '102': false,
    '103': false,
    '104': false,
  },
};

/**
 * Vorübergehend: alle Kapitel 1–7 aller Units ohne Kauf erreichbar (nur zu Tests).
 * Vor Store-Launch zwingend auf `false` setzen und die echte Logik in
 * `isChapterLockedWithoutPurchase` wieder aktiv lassen.
 */
export const TEMP_UNLOCK_ALL_CHAPTERS_FOR_TESTING = true;

/** Bundle oder Legacy „full“-Schalter */
export async function hasPurchaseAllUnits(): Promise<boolean> {
  try {
    const pairs = await AsyncStorage.multiGet([
      PURCHASE_ALL_UNITS,
      DISC101_FULL_KEY,
    ]);
    return pairs.some(([, v]) => v === 'true');
  } catch {
    return false;
  }
}

/** @deprecated Nutze hasPurchaseAllUnits — gleiche Bedeutung (Bundle / Legacy) */
export async function hasDisc101FullAccess(): Promise<boolean> {
  return hasPurchaseAllUnits();
}

export async function loadModulePurchaseState(): Promise<ModulePurchaseState> {
  try {
    const pairs = await AsyncStorage.multiGet([
      PURCHASE_ALL_UNITS,
      DISC101_FULL_KEY,
      PURCHASE_UNIT_1,
      PURCHASE_UNIT_2,
      PURCHASE_UNIT_3,
      PURCHASE_UNIT_4,
    ]);
    const map = Object.fromEntries(pairs);
    const allUnitsUnlocked =
      map[PURCHASE_ALL_UNITS] === 'true' || map[DISC101_FULL_KEY] === 'true';
    if (allUnitsUnlocked) {
      return {
        allUnitsUnlocked: true,
        units: { '101': true, '102': true, '103': true, '104': true },
      };
    }
    return {
      allUnitsUnlocked: false,
      units: {
        '101': map[PURCHASE_UNIT_1] === 'true',
        '102': map[PURCHASE_UNIT_2] === 'true',
        '103': map[PURCHASE_UNIT_3] === 'true',
        '104': map[PURCHASE_UNIT_4] === 'true',
      },
    };
  } catch {
    return INITIAL_MODULE_PURCHASE_STATE;
  }
}

export type RestorePurchasesResult = 'restored' | 'none';

function hasAnyUnlockedPurchase(state: ModulePurchaseState): boolean {
  return (
    state.allUnitsUnlocked || Object.values(state.units).some(Boolean)
  );
}

/**
 * Store-Käufe wiederherstellen (nach Anbindung IAP hier native Restore aufrufen),
 * anschließend lokalen Status neu laden.
 */
export async function restorePurchases(): Promise<RestorePurchasesResult> {
  try {
    // TODO: Sobald IAP aktiv ist: hier z. B. getAvailablePurchases / restoreCompletedTransactions aufrufen und Keys in AsyncStorage spiegeln.
    const state = await loadModulePurchaseState();
    return hasAnyUnlockedPurchase(state) ? 'restored' : 'none';
  } catch {
    return 'none';
  }
}

export function hasUnitAccess(
  moduleCode: ModuleCode,
  state: ModulePurchaseState,
): boolean {
  return state.allUnitsUnlocked || state.units[moduleCode];
}

/**
 * Kapitel 1 jeder Unit gratis. Kapitel 2–7 nur mit Kauf dieser Unit oder Bundle.
 *
 * Siehe `TEMP_UNLOCK_ALL_CHAPTERS_FOR_TESTING`: wenn `true`, liefert diese Funktion
 * immer `false` (nichts gesperrt) — nur bis zum Store-Launch so belassen.
 */
export function isChapterLockedWithoutPurchase(
  moduleCode: ModuleCode,
  chapterId: number,
  state: ModulePurchaseState,
): boolean {
  if (TEMP_UNLOCK_ALL_CHAPTERS_FOR_TESTING) return false;
  if (chapterId <= 1) return false;
  return !hasUnitAccess(moduleCode, state);
}

export function filterPhraseIdsForRepeatAccess(
  ids: number[],
  state: ModulePurchaseState,
  moduleCode: ModuleCode,
  sentences: ReadonlyArray<{ id: number; chapterId: number }>,
): number[] {
  const byChapter = new Map(sentences.map((s) => [s.id, s.chapterId]));
  return ids.filter((id) => {
    const ch = byChapter.get(id);
    if (ch === undefined) return false;
    return !isChapterLockedWithoutPurchase(moduleCode, ch, state);
  });
}
