import { create } from 'zustand';
import type { AISettings, AIProvider } from '../types';
import { BACKEND_DEFAULTS } from '../types';
import { db } from '../db/database';

interface SettingsState {
  settings: AISettings | null;
  isConfigured: boolean;
  load: () => Promise<void>;
  save: (s: AISettings) => Promise<void>;
  setProvider: (provider: AIProvider) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isConfigured: false,

  load: async () => {
    const all = await db.settings.toArray();
    if (all.length > 0) {
      set({ settings: all[0], isConfigured: true });
    }
  },

  save: async (s: AISettings) => {
    await db.settings.clear();
    await db.settings.add(s);
    set({ settings: s, isConfigured: true });
  },

  setProvider: (provider: AIProvider) => {
    const defaults = BACKEND_DEFAULTS[provider];
    set((state) => ({
      settings: state.settings
        ? { ...state.settings, provider, endpoint: defaults.endpoint, model: defaults.models[0] }
        : { provider, endpoint: defaults.endpoint, model: defaults.models[0], apiKey: '', temperature: 0.7, maxTokens: 4096 },
    }));
  },
}));
