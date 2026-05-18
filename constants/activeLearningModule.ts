import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleCode } from './products';
import { MODULE_PRODUCTS } from './products';
import { STRINGS } from './strings';

export const ACTIVE_LEARNING_MODULE_KEY = 'active_learning_module';

export function coerceModuleCode(v: unknown): ModuleCode {
  if (v === '101' || v === '102' || v === '103' || v === '104') {
    return v;
  }
  return '101';
}

export function parseActiveLearningModule(raw: string | null): ModuleCode {
  return coerceModuleCode(raw);
}

export function titleForModule(code: ModuleCode): string {
  return MODULE_PRODUCTS.find((m) => m.code === code)?.title ?? STRINGS.moduleTitle101;
}

export async function getActiveLearningModule(): Promise<ModuleCode> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_LEARNING_MODULE_KEY);
    return parseActiveLearningModule(raw);
  } catch {
    return '101';
  }
}

/** Aufrufen, wenn der Nutzer in einer anderen Unit lernt (z. B. nach Paketwechsel). */
export async function setActiveLearningModule(code: ModuleCode): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_LEARNING_MODULE_KEY, code);
  } catch {
    /* ignore */
  }
}
