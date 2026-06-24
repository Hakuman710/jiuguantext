import { create } from 'zustand';
import type { WorldBook } from '../types';
import { db } from '../db/database';

interface WorldState {
  worlds: WorldBook[];
  selectedId: string | null;
  loadAll: () => Promise<void>;
  importWorld: (w: WorldBook) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  getSelected: () => WorldBook | undefined;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worlds: [],
  selectedId: null,

  loadAll: async () => {
    const w = await db.worlds.toArray();
    set({ worlds: w });
  },

  importWorld: async (w: WorldBook) => {
    w.createdAt = Date.now();
    await db.worlds.put(w);
    const worlds = await db.worlds.toArray();
    set({ worlds, selectedId: w.id });
  },

  deleteWorld: async (id: string) => {
    await db.worlds.delete(id);
    const worlds = await db.worlds.toArray();
    set({
      worlds,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  select: (id: string | null) => set({ selectedId: id }),

  getSelected: () => {
    const { worlds, selectedId } = get();
    return worlds.find((w) => w.id === selectedId);
  },
}));
