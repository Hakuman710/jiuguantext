import type { LoreEntry } from '../types';

export function matchLore(text: string, entries: LoreEntry[]): LoreEntry[] {
  const lowerText = text.toLowerCase();
  const matched: LoreEntry[] = [];

  for (const entry of entries) {
    const triggered = entry.keys.some((key) =>
      lowerText.includes(key.toLowerCase())
    );
    if (triggered) {
      matched.push(entry);
    }
  }

  return matched.sort((a, b) => b.priority - a.priority);
}
