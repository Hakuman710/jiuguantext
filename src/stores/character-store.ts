import { create } from 'zustand';
import type { CharacterCard } from '../types';
import { db } from '../db/database';

interface CharacterState {
  characters: CharacterCard[];
  selectedId: string | null;
  loadAll: () => Promise<void>;
  importCharacter: (card: CharacterCard) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  getSelected: () => CharacterCard | undefined;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  selectedId: null,

  loadAll: async () => {
    const chars = await db.characters.toArray();
    set({ characters: chars });
  },

  importCharacter: async (card: CharacterCard) => {
    card.createdAt = Date.now();
    await db.characters.put(card);
    const chars = await db.characters.toArray();
    set({ characters: chars, selectedId: card.id });
  },

  deleteCharacter: async (id: string) => {
    await db.characters.delete(id);
    const chars = await db.characters.toArray();
    set({
      characters: chars,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  select: (id: string | null) => set({ selectedId: id }),

  getSelected: () => {
    const { characters, selectedId } = get();
    return characters.find((c) => c.id === selectedId);
  },
}));
