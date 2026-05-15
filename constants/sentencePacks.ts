import type { ModuleCode } from './products';

export type SentenceRecord = {
  id: number;
  chapterId: number;
  english: string;
  german: string;
  category: string;
};

const PACKS: Record<ModuleCode, SentenceRecord[]> = {
  '101': require('../data/sentences.json'),
  '102': require('../data/sentences2.json'),
  '103': require('../data/sentences3.json'),
  '104': require('../data/sentences4.json'),
};

export function getSentencesForModule(code: ModuleCode): SentenceRecord[] {
  return PACKS[code];
}
