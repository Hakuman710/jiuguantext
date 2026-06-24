import { create } from 'zustand';
import type { ChatMessage, GameSession } from '../types';
import { db } from '../db/database';

interface ChatState {
  messages: ChatMessage[];
  session: GameSession | null;
  isStreaming: boolean;
  sessionId: string | null;
  loadSession: (id: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => Promise<void>;
  addToStore: (msg: ChatMessage) => void;
  appendToLast: (content: string) => void;
  finalizeStreaming: (content: string) => Promise<void>;
  setStreaming: (v: boolean) => void;
  setSession: (s: GameSession) => void;
  saveAndExit: () => Promise<void>;
  exit: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  session: null,
  isStreaming: false,
  sessionId: null,

  loadSession: async (id: string) => {
    const msgs = await db.messages.where('sessionId').equals(id).sortBy('timestamp');
    // Filter out empty placeholder messages that might have leaked into DB
    const valid = msgs.filter(m => m.content.trim() !== '');
    set({ messages: valid, sessionId: id });
  },

  addMessage: async (msg: ChatMessage) => {
    await db.messages.put(msg);
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  addToStore: (msg: ChatMessage) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  appendToLast: (content: string) => {
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + content,
        };
      }
      return { messages: msgs };
    });
  },

  finalizeStreaming: async (content: string) => {
    const state = get();
    const msgs = [...state.messages];
    if (msgs.length > 0) {
      const last = { ...msgs[msgs.length - 1], content };
      msgs[msgs.length - 1] = last;
      // Save the completed message to DB
      await db.messages.put(last);
      set({ messages: msgs });
    }
  },

  setStreaming: (v: boolean) => set({ isStreaming: v }),

  setSession: (s: GameSession) => set({ session: s, sessionId: s.id }),

  saveAndExit: async () => {
    const session = get().session;
    if (session) {
      session.updatedAt = Date.now();
      await db.sessions.put(session);
    }
    set({ session: null, sessionId: null, messages: [] });
  },

  exit: () => set({ session: null, sessionId: null, messages: [] }),
}));
