import type { RPGChange, RPGExtract } from '../types';
import { useInventoryStore } from '../stores/inventory-store';
import { useQuestStore } from '../stores/quest-store';
import { useChatStore } from '../stores/chat-store';
import { db } from '../db/database';

export function parseRPGChanges(text: string): RPGChange[] {
  // More robust regex: handles \r\n, trailing spaces, case variations
  const match = text.match(/```rpg\s*\r?\n([\s\S]*?)\r?\n\s*```/i);
  if (!match) return [];

  try {
    const parsed: RPGExtract = JSON.parse(match[1]);
    return parsed.changes || [];
  } catch {
    return [];
  }
}

export async function applyChanges(changes: RPGChange[]): Promise<void> {
  const session = useChatStore.getState().session;
  if (!session) return;

  for (const change of changes) {
    switch (change.type) {
      case 'stat': {
        if (change.stat && change.value !== undefined) {
          const key = change.stat;
          const s = session as unknown as Record<string, unknown>;
          if (typeof s[key] === 'number') {
            let newVal = (s[key] as number) + change.value;
            // Round to 2 decimal places
            newVal = Math.round(newVal * 100) / 100;
            // Lock: affection cannot drop once it reaches 100 (absolute loyalty)
            if (key === 'affection' && (s[key] as number) >= 100 && change.value < 0) {
              break; // Reject affection loss at max loyalty
            }
            // Clamp: mres is percentage 0-100, hp/mp/affection also have bounds
            if (key === 'mres') {
              s[key] = Math.max(0, Math.min(100, newVal));
            } else if (key === 'hp' || key === 'mp' || key === 'affection') {
              s[key] = Math.max(0, Math.min(100, newVal));
            } else {
              s[key] = Math.max(0, newVal);
            }
          }
        }
        break;
      }
      case 'item_add': {
        if (change.item) {
          await useInventoryStore.getState().addItem(change.item);
        }
        break;
      }
      case 'item_remove': {
        if (change.itemId) {
          await useInventoryStore.getState().removeItem(change.itemId, 1);
        }
        break;
      }
      case 'quest_new': {
        if (change.quest) {
          await useQuestStore.getState().addQuest(change.quest);
        }
        break;
      }
      case 'quest_update': {
        if (change.questId && change.objective !== undefined) {
          await useQuestStore
            .getState()
            .updateObjective(change.questId, change.objective, !!change.completed);
        }
        break;
      }
      case 'quest_complete': {
        if (change.questId) {
          await useQuestStore.getState().setStatus(change.questId, 'completed');
        }
        break;
      }
      case 'location_change': {
        if (change.locationId) {
          session.currentLocation = change.locationId;
        }
        break;
      }
      case 'skill_learn': {
        if (change.skill) {
          const skills = [...(session.skills || [null, null, null, null, null])];
          // Find the first empty slot, or use replaceIndex if specified
          const emptyIdx = skills.findIndex((s) => s === null);
          const targetIdx = change.replaceIndex !== undefined ? change.replaceIndex : emptyIdx;
          if (targetIdx >= 0 && targetIdx < 5) {
            skills[targetIdx] = { ...change.skill, id: change.skill.id || crypto.randomUUID() };
            session.skills = skills;
          }
        }
        break;
      }
      case 'skill_forget': {
        if (change.skillIndex !== undefined) {
          const skills = [...(session.skills || [null, null, null, null, null])];
          if (change.skillIndex >= 0 && change.skillIndex < 5) {
            skills[change.skillIndex] = null;
            session.skills = skills;
          }
        }
        break;
      }
    }
  }

  await db.sessions.put(session);
  useChatStore.getState().setSession(session);
}
