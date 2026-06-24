import { create } from 'zustand';

type RightPanel = 'stats' | 'equipment' | 'inventory' | 'quests' | 'world';
type LeftView = 'adventures' | 'compendium' | 'characters' | 'worlds' | 'settings';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface AppState {
  leftOpen: boolean;
  rightOpen: boolean;
  activeLeftView: LeftView;
  activeRightPanel: RightPanel;
  toasts: Toast[];
  toggleLeft: () => void;
  toggleRight: () => void;
  setLeftView: (v: LeftView) => void;
  setRightPanel: (p: RightPanel) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  leftOpen: true,
  rightOpen: true,
  activeLeftView: 'adventures',
  activeRightPanel: 'stats',
  toasts: [],

  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  setLeftView: (v) => set({ activeLeftView: v }),
  setRightPanel: (p) => set({ activeRightPanel: p }),

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
