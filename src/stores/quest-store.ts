import { create } from 'zustand';
import type { Quest, QuestStatus } from '../types';
import { db } from '../db/database';

interface QuestState {
  quests: Quest[];
  version: number;
  sessionId: string | null;
  loadSession: (id: string) => Promise<void>;
  addQuest: (q: Quest) => Promise<void>;
  updateObjective: (questId: string, objIndex: number, completed: boolean) => Promise<void>;
  setStatus: (questId: string, status: QuestStatus) => Promise<void>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  version: 0,
  sessionId: null,

  loadSession: async (id: string) => {
    const quests = await db.quests.where('sessionId').equals(id).toArray();
    set({ quests, sessionId: id, version: get().version + 1 });
  },

  addQuest: async (q: Quest) => {
    const sid = get().sessionId;
    if (!sid) return;
    q.id = q.id || crypto.randomUUID();
    q.createdAt = Date.now();
    q.status = q.status || 'active';
    // Ensure objectives have IDs
    q.objectives = (q.objectives || []).map((obj) => ({
      ...obj,
      id: obj.id || crypto.randomUUID(),
    }));
    await db.quests.put({ ...q, sessionId: sid } as Quest);
    const quests = await db.quests.where('sessionId').equals(sid).toArray();
    set({ quests, version: get().version + 1 });
  },

  updateObjective: async (questId: string, objIndex: number, completed: boolean) => {
    const quest = await db.quests.get(questId);
    if (!quest) return;
    quest.objectives[objIndex].completed = completed;
    if (quest.objectives.every((o) => o.completed)) {
      quest.status = 'completed';
    }
    await db.quests.put(quest);
    const sid = get().sessionId;
    if (sid) {
      const quests = await db.quests.where('sessionId').equals(sid).toArray();
      set({ quests, version: get().version + 1 });
    }
  },

  setStatus: async (questId: string, status: QuestStatus) => {
    await db.quests.update(questId, { status });
    const sid = get().sessionId;
    if (sid) {
      const quests = await db.quests.where('sessionId').equals(sid).toArray();
      set({ quests, version: get().version + 1 });
    }
  },
}));
