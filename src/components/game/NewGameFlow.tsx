import { useChatStore } from '../../stores/chat-store';
import { useInventoryStore } from '../../stores/inventory-store';
import { useQuestStore } from '../../stores/quest-store';
import { useAppStore } from '../../stores/app-store';
import { useWorldStore } from '../../stores/world-store';
import { useCharacterStore } from '../../stores/character-store';
import { db } from '../../db/database';
import type { GameSession } from '../../types';

export function useStartGame() {
  const { loadSession, setSession } = useChatStore();
  const { loadSession: loadInv } = useInventoryStore();
  const { loadSession: loadQuests } = useQuestStore();
  const addToast = useAppStore((s) => s.addToast);
  const saveAndExit = useChatStore((s) => s.saveAndExit);

  const startNew = async (playerCharId: string, worldIds: string[], npcIds: string[] = [], name?: string) => {
    const char = await db.characters.get(playerCharId);
    const worlds = (await db.worlds.bulkGet(worldIds)).filter((w): w is NonNullable<typeof w> => w != null);
    if (!char || worlds.length === 0) {
      addToast('角色或世界不存在', 'error');
      return;
    }

    const firstWorld = worlds[0];
    const session: GameSession = {
      id: crypto.randomUUID(),
      name: name || `${char.name} @ ${firstWorld.name}`,
      primaryCharacterId: playerCharId,
      npcCharacterIds: npcIds,
      worldIds,
      currentLocation: firstWorld.locations[0]?.id || 'start',
      gameTime: Date.now(),
      skills: char.initialSkills?.slice(0, 5) || [null, null, null, null, null],
      deadCharacterIds: [],
      hp: char.baseStats.hp,
      mp: char.baseStats.mp,
      stamina: char.baseStats.stamina,
      affection: 100,
      atk: char.baseStats.atk,
      def: char.baseStats.def,
      agi: char.baseStats.agi,
      spi: char.baseStats.spi,
      mres: char.baseStats.mres,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.sessions.put(session);

    useWorldStore.getState().select(worlds[0].id);
    useCharacterStore.getState().select(playerCharId);
    setSession(session);
    await loadSession(session.id);
    await loadInv(session.id);
    await loadQuests(session.id);
    addToast('新的冒险开始了！', 'success');
  };

  const continueGame = async (sessionId: string) => {
    const session = await db.sessions.get(sessionId);
    if (!session) {
      addToast('存档不存在', 'error');
      return;
    }
    // Normalize old sessions
    session.agi = session.agi ?? 0;
    session.spi = session.spi ?? 0;
    session.mres = session.mres ?? 0;
    session.skills = session.skills || [null, null, null, null, null];
    session.npcCharacterIds = session.npcCharacterIds || [];
    session.deadCharacterIds = session.deadCharacterIds || [];
    session.worldIds = session.worldIds || ((session as any).worldId ? [(session as any).worldId] : []);
    // Sync stores
    if (session.worldIds.length > 0) {
      useWorldStore.getState().select(session.worldIds[0]);
    }
    useCharacterStore.getState().select(session.primaryCharacterId);
    setSession(session);
    await loadSession(session.id);
    await loadInv(session.id);
    await loadQuests(session.id);
    addToast('继续上次的冒险', 'info');
  };

  const handleSaveAndExit = async () => {
    await saveAndExit();
    addToast('已保存并退出', 'info');
  };

  return { startNew, continueGame, handleSaveAndExit };
}
