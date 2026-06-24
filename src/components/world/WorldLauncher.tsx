import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { useChatStore } from '../../stores/chat-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useStartGame } from '../game/NewGameFlow';
import { useAppStore } from '../../stores/app-store';
import { Play, Trash2, Plus, Sword, Users, MapPin, User, Pencil, Check, X, Settings } from 'lucide-react';
import type { GameSession, CharacterCard, WorldBook } from '../../types';

export function WorldLauncher() {
  const session = useChatStore((s) => s.session);
  const { startNew, continueGame } = useStartGame();
  const addToast = useAppStore((s) => s.addToast);
  const isConfigured = useSettingsStore((s) => s.isConfigured);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [allChars, setAllChars] = useState<CharacterCard[]>([]);
  const [allWorlds, setAllWorlds] = useState<WorldBook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWorldIds, setSelectedWorldIds] = useState<string[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [playerCharId, setPlayerCharId] = useState<string | null>(null);
  const [worldName, setWorldName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [manageId, setManageId] = useState<string | null>(null);
  const [addCharId, setAddCharId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    const [s, c, w] = await Promise.all([
      db.sessions.orderBy('updatedAt').reverse().toArray(),
      db.characters.toArray(),
      db.worlds.toArray(),
    ]);
    const normalized = s.map((session) => ({
      ...session,
      name: session.name || '',
      npcCharacterIds: session.npcCharacterIds || [],
      skills: session.skills || [null, null, null, null, null],
      agi: session.agi ?? 0,
      spi: session.spi ?? 0,
      mres: session.mres ?? 0,
      deadCharacterIds: session.deadCharacterIds || [],
      worldIds: session.worldIds || ((session as any).worldId ? [(session as any).worldId] : []),
    }));
    setSessions(normalized);
    setAllChars(c.map((ch) => ({ ...ch, initialSkills: ch.initialSkills || [] })));
    setAllWorlds(w);
  };

  const handleContinue = async (s: GameSession) => {
    await continueGame(s.id);
  };

  const handleDelete = async (sessionId: string) => {
    await db.messages.where('sessionId').equals(sessionId).delete();
    await db.equipment.where('sessionId').equals(sessionId).delete();
    await db.inventory.where('sessionId').equals(sessionId).delete();
    await db.quests.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
    setDeleteConfirmId(null);
    loadData();
    addToast('存档已删除', 'info');
  };

  const handleAddCharacter = async (sessionId: string, charId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return;
    const allIds = [s.primaryCharacterId, ...s.npcCharacterIds];
    if (allIds.includes(charId)) {
      addToast('该角色已在世界中', 'warning');
      return;
    }
    const updated = [...s.npcCharacterIds, charId];
    await db.sessions.update(sessionId, { npcCharacterIds: updated });
    setAddCharId(null);
    loadData();
    addToast('角色已加入世界', 'success');
  };

  const handleRemoveDead = async (sessionId: string, charId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return;
    const updatedNpcs = s.npcCharacterIds.filter((id) => id !== charId);
    const updatedDead = (s.deadCharacterIds || []).filter((id) => id !== charId);
    await db.sessions.update(sessionId, {
      npcCharacterIds: updatedNpcs,
      deadCharacterIds: updatedDead,
    });
    loadData();
    addToast('已故角色已移除', 'info');
  };

  const handleRename = async (sessionId: string) => {
    if (!renameText.trim()) {
      setRenameId(null);
      return;
    }
    await db.sessions.update(sessionId, { name: renameText.trim() });
    setRenameId(null);
    loadData();
  };

  const startRename = (s: GameSession) => {
    setRenameId(s.id);
    setRenameText(s.name || '');
  };

  const handleCreate = () => {
    if (selectedWorldIds.length === 0 || selectedCharIds.length === 0 || !playerCharId) {
      addToast('请至少选择一个世界书和一个角色，并指定操控角色', 'warning');
      return;
    }
    if (!isConfigured) {
      addToast('请先在设置中配置 AI 后端', 'warning');
      return;
    }
    if (selectedCharIds.length > 10) {
      addToast('最多选择 10 个角色', 'warning');
      return;
    }
    const npcIds = selectedCharIds.filter((id) => id !== playerCharId);
    startNew(playerCharId, selectedWorldIds, npcIds, worldName.trim() || undefined);
    setShowCreate(false);
    setSelectedWorldIds([]);
    setSelectedCharIds([]);
    setPlayerCharId(null);
    setWorldName('');
  };

  const toggleChar = (id: string) => {
    setSelectedCharIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(playerCharId || '')) {
        setPlayerCharId(null);
      }
      return next;
    });
  };

  const getCharName = (id: string) => allChars.find((c) => c.id === id)?.name || '未知';
  const getWorldName = (id: string) => allWorlds.find((w) => w.id === id)?.name || '未知';
  const getWorldNames = (ids: string[]) => ids.map(getWorldName).join(' + ');
  const getDisplayName = (s: GameSession) => {
    if (s.name) return s.name;
    // Fallback for old sessions without a name
    const charName = getCharName(s.primaryCharacterId);
    const worldName = getWorldNames(s.worldIds || []);
    return `${charName} @ ${worldName}`;
  };

  const isSolo = selectedCharIds.length === 1;

  if (session) return null;

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-amber-glow">🗺️ 开启世界</h3>
        <button
          onClick={() => {
            setShowCreate(true);
            setSelectedWorldIds([]);
            setSelectedCharIds([]);
            setPlayerCharId(null);
            setWorldName('');
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors text-sm"
        >
          <Plus size={16} />
          新建世界
        </button>
      </div>

      {/* Create world form */}
      {showCreate && (
        <div className="p-3 rounded-lg border border-amber-glow/30 bg-cosmic-light/50 space-y-3">
          <h4 className="text-sm font-serif text-amber-glow">创建新世界</h4>

          {/* World name */}
          <div>
            <p className="text-xs text-parchment-dark/70 mb-1">世界名称（可选）</p>
            <input
              type="text"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              placeholder="留空则自动使用「角色名 @ 世界名」"
              className="w-full rounded-lg border border-parchment-dark/30 bg-cosmic-light px-3 py-1.5 text-xs text-parchment placeholder-parchment-dark/40 focus:outline-none focus:ring-2 focus:ring-amber-glow"
            />
          </div>

          {/* Step 1: Select world books (multi-select) */}
          <div>
            <p className="text-xs text-parchment-dark/70 mb-1">选择世界书（{selectedWorldIds.length} 本，可多选）</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {allWorlds.length === 0 && (
                <p className="text-xs text-parchment-dark/40">暂无世界书，请先在「世界库」导入</p>
              )}
              {allWorlds.map((w) => {
                const isSelected = selectedWorldIds.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-glow/20 border border-amber-glow'
                        : 'hover:bg-tavern-wood-light/30 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedWorldIds((prev) =>
                        prev.includes(w.id) ? prev.filter((x) => x !== w.id) : [...prev, w.id]
                      )}
                      className="accent-amber-glow"
                    />
                    <MapPin size={14} className="text-parchment-dark" />
                    <span className={`${isSelected ? 'text-parchment' : 'text-parchment-dark'}`}>{w.name}</span>
                    <span className="text-parchment-dark/40 truncate">{w.description.slice(0, 30)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select characters */}
          <div>
            <p className="text-xs text-parchment-dark/70 mb-1">
              选择角色（{selectedCharIds.length}/10）— {isSolo ? '单人探索模式' : '多人冒险模式'}
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {allChars.length === 0 && (
                <p className="text-xs text-parchment-dark/40">暂无角色卡，请先在「角色库」导入</p>
              )}
              {allChars.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    selectedCharIds.includes(c.id)
                      ? 'bg-amber-glow/20 border border-amber-glow/50'
                      : 'hover:bg-tavern-wood-light/30 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharIds.includes(c.id)}
                    onChange={() => toggleChar(c.id)}
                    className="accent-amber-glow"
                  />
                  <span className="text-parchment">{c.name}</span>
                  <span className="text-parchment-dark/40">{c.tags?.join(', ')}</span>
                </label>
              ))}
            </div>

            {selectedCharIds.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-glow/20">
                <p className="text-xs text-amber-glow mb-1 flex items-center gap-1">
                  <User size={12} />
                  {isSolo ? '你的角色（单人探索）' : '选择你操控的角色'}
                </p>
                <div className="space-y-1">
                  {selectedCharIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => setPlayerCharId(id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                        playerCharId === id
                          ? 'bg-green-800/30 border border-green-400 text-green-300'
                          : 'hover:bg-tavern-wood-light/30 text-parchment-dark border border-transparent'
                      }`}
                    >
                      <Play size={12} className={playerCharId === id ? 'text-green-400' : 'text-parchment-dark/40'} />
                      {getCharName(id)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={selectedWorldIds.length === 0 || selectedCharIds.length === 0 || !playerCharId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <Sword size={16} />
              开始冒险
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-tavern-wood-light text-parchment-dark rounded-lg hover:bg-tavern-wood transition-colors text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Existing worlds list */}
      {!showCreate && (
        <div>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🌍</p>
              <p className="text-sm text-parchment-dark/60">尚无冒险世界</p>
              <p className="text-xs text-parchment-dark/40 mt-1">点击「新建世界」开始你的旅程</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-parchment-dark/60">现有冒险（{sessions.length}）</p>
              {sessions.map((s) => {
                const isSoloSession = (s.npcCharacterIds || []).length === 0;
                const displayName = getDisplayName(s);
                return (
                  <div key={s.id}>
                  <div
                    className="p-3 rounded-lg border border-parchment-dark/20 bg-cosmic-light/50 hover:bg-cosmic-light/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        {/* Name row */}
                        {renameId === s.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="text"
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(s.id);
                                if (e.key === 'Escape') setRenameId(null);
                              }}
                              className="flex-1 rounded border border-amber-glow bg-cosmic-light px-2 py-0.5 text-sm text-parchment focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleRename(s.id)} className="p-0.5 text-green-400 hover:bg-green-800/30 rounded">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setRenameId(null)} className="p-0.5 text-parchment-dark hover:text-parchment rounded">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-parchment font-medium">
                              {isSoloSession ? '🧭' : '👥'} {displayName}
                            </p>
                            <button
                              onClick={() => startRename(s)}
                              className="p-0.5 text-parchment-dark/30 hover:text-parchment-dark transition-colors"
                              title="重命名"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-parchment-dark/50">
                          {getCharName(s.primaryCharacterId)}
                          <span className="text-parchment-dark/40"> @ {getWorldNames(s.worldIds || [])}</span>
                        </p>
                        {!isSoloSession && (
                          <p className="text-xs text-parchment-dark/50 mt-0.5">
                            <Users size={10} className="inline mr-1" />
                            {(s.npcCharacterIds || []).map((id) => getCharName(id)).join('、')}
                          </p>
                        )}
                        <p className="text-[10px] text-parchment-dark/40 mt-1">
                          {new Date(s.updatedAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {deleteConfirmId === s.id ? (
                          <>
                            <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-[10px] bg-red-600 text-white rounded hover:bg-red-700">
                              确认删除
                            </button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-[10px] bg-tavern-wood-light text-parchment-dark rounded">
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setManageId(manageId === s.id ? null : s.id)} className="p-1.5 text-parchment-dark/40 hover:text-amber-glow transition-colors" title="世界设置">
                              <Settings size={14} />
                            </button>
                            <button onClick={() => handleContinue(s)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-glow/20 text-amber-glow rounded-lg hover:bg-amber-glow/30 transition-colors text-xs">
                              <Play size={14} />
                              继续
                            </button>
                            <button onClick={() => setDeleteConfirmId(s.id)} className="p-1.5 text-parchment-dark/40 hover:text-red-400 transition-colors" title="删除">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Manage panel */}
                  {manageId === s.id && (
                    <div className="p-3 rounded-lg border border-amber-glow/30 bg-cosmic-light/80 space-y-3">
                      <h4 className="text-sm font-serif text-amber-glow">⚙️ 世界设置</h4>

                      {/* Current characters */}
                      <div>
                        <p className="text-xs text-parchment-dark/60 mb-1">当前角色</p>
                        <div className="space-y-1">
                          {/* Player character */}
                          <div className="flex items-center gap-2 p-2 rounded bg-amber-glow/10 border border-amber-glow/30 text-xs">
                            <span className="text-amber-glow">👑</span>
                            <span className="text-parchment">{getCharName(s.primaryCharacterId)}</span>
                            <span className="text-amber-glow/60 text-[10px]">操控角色（不可更改）</span>
                          </div>
                          {/* NPC characters */}
                          {s.npcCharacterIds.map((id) => {
                            const isDead = (s.deadCharacterIds || []).includes(id);
                            return (
                              <div
                                key={id}
                                className={`flex items-center gap-2 p-2 rounded text-xs ${
                                  isDead
                                    ? 'bg-red-900/10 border border-red-800/30'
                                    : 'bg-cosmic-light border border-parchment-dark/20'
                                }`}
                              >
                                <span>{isDead ? '💀' : '👤'}</span>
                                <span className={`${isDead ? 'text-red-400/70 line-through' : 'text-parchment'}`}>
                                  {getCharName(id)}
                                </span>
                                {isDead && (
                                  <span className="text-red-400/50 text-[10px] ml-auto mr-1">已故</span>
                                )}
                                {isDead && (
                                  <button
                                    onClick={() => handleRemoveDead(s.id, id)}
                                    className="text-[10px] px-1.5 py-0.5 bg-red-600/30 text-red-300 rounded hover:bg-red-600/50"
                                  >
                                    移除
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Add character */}
                      <div>
                        <p className="text-xs text-parchment-dark/60 mb-1">添加角色</p>
                        {addCharId === s.id ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {allChars
                              .filter((c) => {
                                const inWorld = [s.primaryCharacterId, ...s.npcCharacterIds].includes(c.id);
                                const isDead = (s.deadCharacterIds || []).includes(c.id);
                                return !inWorld || isDead;
                              })
                              .map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => handleAddCharacter(s.id, c.id)}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs hover:bg-amber-glow/10 text-parchment transition-colors"
                                >
                                  <span className="w-6 h-6 rounded-full bg-cosmic-light flex items-center justify-center text-[10px]">
                                    {c.name[0]}
                                  </span>
                                  <span>{c.name}</span>
                                  <span className="text-parchment-dark/40">{c.tags?.join(', ')}</span>
                                </button>
                              ))}
                            {allChars.filter((c) => {
                              const inWorld = [s.primaryCharacterId, ...s.npcCharacterIds].includes(c.id);
                              const isDead = (s.deadCharacterIds || []).includes(c.id);
                              return !inWorld || isDead;
                            }).length === 0 && (
                              <p className="text-xs text-parchment-dark/40">所有角色已在世界中</p>
                            )}
                            <button
                              onClick={() => setAddCharId(null)}
                              className="text-xs text-parchment-dark hover:text-parchment mt-1"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddCharId(s.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-cosmic-light border border-parchment-dark/30 text-parchment-dark rounded-lg hover:border-amber-glow/30 hover:text-parchment transition-colors text-xs"
                          >
                            <Plus size={14} />
                            加入新角色
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
