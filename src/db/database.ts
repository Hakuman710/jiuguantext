import Dexie, { type Table } from 'dexie';
import type {
  CharacterCard,
  WorldBook,
  GameSession,
  EquipmentRecord,
  Item,
  Quest,
  ChatMessage,
  AISettings,
} from '../types';

export class TavernDB extends Dexie {
  characters!: Table<CharacterCard, string>;
  worlds!: Table<WorldBook, string>;
  sessions!: Table<GameSession, string>;
  equipment!: Table<EquipmentRecord, [string, string]>;
  inventory!: Table<Item, string>;
  quests!: Table<Quest, string>;
  messages!: Table<ChatMessage, string>;
  settings!: Table<AISettings, number>;

  constructor() {
    super('TavernDB');

    this.version(2).stores({
      characters: 'id, name, tags, createdAt',
      worlds: 'id, name, createdAt',
      sessions: 'id, primaryCharacterId, worldId, updatedAt',
      equipment: '[sessionId+slot], sessionId',
      inventory: 'id, sessionId, type',
      quests: 'id, sessionId, status',
      messages: 'id, sessionId, timestamp',
      settings: '++id, provider',
    });

    this.version(3).stores({
      characters: 'id, name, tags, createdAt',
      worlds: 'id, name, createdAt',
      sessions: 'id, primaryCharacterId, *worldIds, updatedAt',
      equipment: '[sessionId+slot], sessionId',
      inventory: 'id, sessionId, type',
      quests: 'id, sessionId, status',
      messages: 'id, sessionId, timestamp',
      settings: '++id, provider',
    }).upgrade(async (tx) => {
      // Migrate old sessions: worldId -> worldIds
      const sessions = await tx.table('sessions').toArray();
      for (const s of sessions) {
        if (s.worldId && !s.worldIds) {
          await tx.table('sessions').update(s.id, { worldIds: [s.worldId] });
        }
      }
    });
  }
}

export const db = new TavernDB();
