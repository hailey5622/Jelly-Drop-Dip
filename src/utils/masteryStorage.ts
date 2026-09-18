import { IdiomItem, MasteredIdiomRecord } from '../types';
import { IDIOM_DATABASE } from '../data/idioms';

const STORAGE_KEY = 'idiom_drop_dip_mastered_list';

export function getMasteredIdiomRecords(): Record<string, MasteredIdiomRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveMasteredIdiom(idiomId: string): void {
  try {
    const current = getMasteredIdiomRecords();
    const existing = current[idiomId];
    if (existing) {
      current[idiomId] = {
        ...existing,
        timesMastered: existing.timesMastered + 1,
      };
    } else {
      current[idiomId] = {
        idiomId,
        firstMasteredAt: new Date().toISOString(),
        timesMastered: 1,
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save mastered idiom', e);
  }
}

export function saveMultipleMasteredIdioms(idiomIds: string[]): void {
  if (idiomIds.length === 0) return;
  try {
    const current = getMasteredIdiomRecords();
    const now = new Date().toISOString();
    idiomIds.forEach((id) => {
      if (current[id]) {
        current[id] = {
          ...current[id],
          timesMastered: current[id].timesMastered + 1,
        };
      } else {
        current[id] = {
          idiomId: id,
          firstMasteredAt: now,
          timesMastered: 1,
        };
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save multiple mastered idioms', e);
  }
}

export function getMasteredIdiomItems(): { idiom: IdiomItem; record: MasteredIdiomRecord }[] {
  const records = getMasteredIdiomRecords();
  const idMap = new Map(IDIOM_DATABASE.map((item) => [item.id, item]));

  const result: { idiom: IdiomItem; record: MasteredIdiomRecord }[] = [];
  Object.values(records).forEach((rec) => {
    const item = idMap.get(rec.idiomId);
    if (item) {
      result.push({ idiom: item, record: rec });
    }
  });

  // Sort: recently mastered or alphabetically
  return result.sort((a, b) => b.record.timesMastered - a.record.timesMastered);
}
