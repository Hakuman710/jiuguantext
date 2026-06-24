import { useState } from 'react';
import { PanelRightClose, PanelRightOpen, Swords, Shield, Package, ScrollText, MapPin } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { useChatStore } from '../../stores/chat-store';
import { useCharacterStore } from '../../stores/character-store';
import { StatBar } from '../shared/StatBar';
import { EquipmentPanel } from '../equipment/EquipmentPanel';
import { InventoryPanel } from '../inventory/InventoryPanel';
import { QuestPanel } from '../quest/QuestPanel';
import { WorldPanel } from '../world/WorldPanel';
import { db } from '../../db/database';
import { EQUIP_SLOTS } from '../../types';
import type { CharacterCard } from '../../types';

const panels = [
  { id: 'stats' as const, label: '属性', icon: Swords },
  { id: 'equipment' as const, label: '装备', icon: Shield },
  { id: 'inventory' as const, label: '背包', icon: Package },
  { id: 'quests' as const, label: '任务', icon: ScrollText },
  { id: 'world' as const, label: '地点', icon: MapPin },
];

export function RightSidebar() {
  const { rightOpen, toggleRight, activeRightPanel, setRightPanel } = useAppStore();
  const session = useChatStore((s) => s.session);
  const allCharacters = useCharacterStore((s) => s.characters);
  const [viewCharId, setViewCharId] = useState<string | null>(null);

  if (!session) return null;

  const allIds = [session.primaryCharacterId, ...(session.npcCharacterIds || [])];
  const adventureChars: CharacterCard[] = allIds
    .map((id) => allCharacters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c != null);

  const viewedCharId = viewCharId || session.primaryCharacterId;
  const viewedChar = adventureChars.find((c) => c.id === viewedCharId);
  const isPlayer = viewedCharId === session.primaryCharacterId;
  const playerChar = adventureChars.find((c) => c.id === session.primaryCharacterId);

  // Max values from the character card base stats
  const maxHp = isPlayer ? (playerChar?.baseStats.hp ?? 100) : (viewedChar?.baseStats.hp ?? 100);
  const maxMp = isPlayer ? (playerChar?.baseStats.mp ?? 100) : (viewedChar?.baseStats.mp ?? 100);

  const renderEquipmentSlots = (charId: string) => {
    const [equipment, setEquipment] = useState<Record<string, string | null>>({});
    const [items, setItems] = useState<any[]>([]);

    useState(() => {
      (async () => {
        if (!session) return;
        const eqs = await db.equipment.where('sessionId').equals(session.id).toArray();
        const map: Record<string, string | null> = {};
        for (const s of EQUIP_SLOTS) {
          const eq = eqs.find((e) => e.slot === s.slot);
          map[s.slot] = eq?.itemId || null;
        }
        setEquipment(map);
        const inv = await db.inventory.where('sessionId').equals(session.id).toArray();
        setItems(inv);
      })();
    });

    return (
      <div className="space-y-1">
        {EQUIP_SLOTS.map(({ slot, label, icon }) => {
          const itemId = equipment[slot];
          const item = itemId ? items.find((i) => i.id === itemId) : null;
          return (
            <div key={slot} className="flex items-center gap-2 p-1.5 rounded-lg border border-parchment-dark/20 bg-cosmic-light/30 text-xs">
              <span className="text-sm">{icon}</span>
              <span className="text-parchment-dark/60 text-[10px] w-8">{label}</span>
              {item ? (
                <span className="text-parchment text-[10px] truncate">{item.icon} {item.name}</span>
              ) : (
                <span className="text-parchment-dark/30 text-[10px]">空</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ---- Character avatar switcher (reused across panels) ----
  const renderAvatarSwitcher = () => (
    adventureChars.length > 0 && (
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-glow/20 overflow-x-auto">
        {adventureChars.map((c) => (
          <button
            key={c.id}
            onClick={() => setViewCharId(c.id)}
            className={`flex flex-col items-center gap-1 shrink-0 transition-opacity ${
              viewedCharId === c.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
            title={c.name}
          >
            {c.avatar ? (
              <img src={c.avatar} alt={c.name} className={`w-10 h-10 rounded-full object-cover border-2 ${
                viewedCharId === c.id ? 'border-amber-glow' : 'border-parchment-dark/30'
              }`} />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                viewedCharId === c.id
                  ? 'bg-amber-glow/30 text-amber-glow border-amber-glow'
                  : 'bg-cosmic-light text-parchment-dark border-parchment-dark/30'
              }`}>
                {c.name[0]}
              </div>
            )}
          </button>
        ))}
      </div>
    )
  );

  return (
    <>
      {rightOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/40" onClick={toggleRight} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-30 w-64 bg-tavern-wood border-l-2 border-amber-glow flex flex-col transition-transform ${
          rightOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'
        }`}
      >
        <div className="flex border-b border-amber-glow/30">
          {panels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setRightPanel(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                activeRightPanel === id
                  ? 'text-amber-glow border-b-2 border-amber-glow'
                  : 'text-parchment-dark hover:text-parchment'
              }`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
          <button onClick={toggleRight} className="px-2 text-parchment-dark hover:text-parchment" title="折叠">
            <PanelRightClose size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {/* ---- STATS ---- */}
          {activeRightPanel === 'stats' && session && (
            <div className="space-y-1">
              {renderAvatarSwitcher()}

              <h3 className="text-sm font-serif text-amber-glow">📜 角色状态</h3>
              <p className="text-base font-serif text-amber-glow mb-2 tracking-wide">{viewedChar?.name || '未知'}</p>

              {isPlayer ? (
                <>
                  <StatBar label="HP" value={session.hp} max={maxHp} color="bg-red-600" />
                  <StatBar label="MP" value={session.mp} max={maxMp} color="bg-blue-600" />
                  <StatBar label="好感度" value={session.affection} max={100} color="bg-pink-500" />
                  <div className="mt-3 pt-3 border-t border-amber-glow/20 text-xs text-parchment space-y-1">
                    <div className="flex justify-between"><span>攻击力</span><span className="text-ember-light">{session.atk.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>防御力</span><span className="text-blue-400">{session.def.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>敏捷力</span><span className="text-green-400">{session.agi.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>精神力</span><span className="text-purple-400">{session.spi.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>魔抗性</span><span className="text-cyan-400">{session.mres}%</span></div>
                  </div>

                  {/* Equipment quick view */}
                  <div className="mt-3 pt-3 border-t border-amber-glow/20">
                    <h4 className="text-xs font-serif text-amber-glow mb-2">🛡️ 装备</h4>
                    <QuickEquipmentSlots />
                  </div>

                  {/* Skills */}
                  <div className="mt-3 pt-3 border-t border-amber-glow/20">
                    <h4 className="text-xs font-serif text-amber-glow mb-2">✨ 技能</h4>
                    <div className="space-y-1.5">
                      {(session.skills || [null, null, null, null, null]).map((skill, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-xs ${
                            skill ? 'border-amber-glow/30 bg-cosmic-light hover:bg-cosmic-light/80 transition-colors'
                                  : 'border-parchment-dark/15 bg-cosmic-light/30'
                          }`}
                        >
                          {skill ? (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-parchment font-medium">{skill.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  skill.type === 'physical' ? 'bg-red-900/40 text-red-300' :
                                  skill.type === 'magic' ? 'bg-blue-900/40 text-blue-300' :
                                  'bg-green-900/40 text-green-300'
                                }`}>
                                  {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'}
                                </span>
                              </div>
                              <div className="flex gap-3 text-parchment-dark/70 text-[10px] mb-1">
                                <span>消耗 {skill.mpCost} MP</span>
                                {skill.type !== 'buff' && <span>倍率 {skill.multiplier}%</span>}
                              </div>
                              <p className="text-parchment-dark/60 text-[10px] leading-tight">{skill.description}</p>
                            </div>
                          ) : (
                            <span className="text-parchment-dark/30 text-[10px]">— 空槽位 —</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : viewedChar ? (
                <>
                  <StatBar label="HP" value={viewedChar.baseStats.hp} max={viewedChar.baseStats.hp} color="bg-red-600" />
                  <StatBar label="MP" value={viewedChar.baseStats.mp} max={viewedChar.baseStats.mp} color="bg-blue-600" />
                  <StatBar label="好感度" value={viewedChar.affinityBase} max={100} color="bg-pink-500" />
                  <div className="mt-3 pt-3 border-t border-amber-glow/20 text-xs text-parchment space-y-1">
                    <div className="flex justify-between"><span>攻击力</span><span className="text-ember-light">{viewedChar.baseStats.atk.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>防御力</span><span className="text-blue-400">{viewedChar.baseStats.def.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>敏捷力</span><span className="text-green-400">{viewedChar.baseStats.agi.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>精神力</span><span className="text-purple-400">{viewedChar.baseStats.spi.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>魔抗性</span><span className="text-cyan-400">{viewedChar.baseStats.mres}%</span></div>
                  </div>

                  {/* Equipment quick view for NPC */}
                  <div className="mt-3 pt-3 border-t border-amber-glow/20">
                    <h4 className="text-xs font-serif text-amber-glow mb-2">🛡️ 装备</h4>
                    <div className="space-y-1">
                      {EQUIP_SLOTS.map(({ slot, label, icon }) => (
                        <div key={slot} className="flex items-center gap-2 p-1.5 rounded-lg border border-parchment-dark/20 bg-cosmic-light/30 text-xs">
                          <span className="text-sm">{icon}</span>
                          <span className="text-parchment-dark/60 text-[10px] w-8">{label}</span>
                          <span className="text-parchment-dark/30 text-[10px]">空</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-3 pt-3 border-t border-amber-glow/20">
                    <h4 className="text-xs font-serif text-amber-glow mb-2">✨ 技能</h4>
                    <div className="space-y-1.5">
                      {(() => {
                        const skills = viewedChar.initialSkills || [];
                        const padded = skills.length > 0
                          ? [...skills.slice(0, 5), ...Array(Math.max(0, 5 - skills.length)).fill(null)]
                          : [null, null, null, null, null];
                        return padded.map((skill, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border text-xs ${
                              skill ? 'border-amber-glow/30 bg-cosmic-light hover:bg-cosmic-light/80 transition-colors'
                                    : 'border-parchment-dark/15 bg-cosmic-light/30'
                            }`}
                          >
                            {skill ? (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-parchment font-medium">{skill.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    skill.type === 'physical' ? 'bg-red-900/40 text-red-300' :
                                    skill.type === 'magic' ? 'bg-blue-900/40 text-blue-300' :
                                    'bg-green-900/40 text-green-300'
                                  }`}>
                                    {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'}
                                  </span>
                                </div>
                                <div className="flex gap-3 text-parchment-dark/70 text-[10px] mb-1">
                                  <span>消耗 {skill.mpCost} MP</span>
                                  {skill.type !== 'buff' && <span>倍率 {skill.multiplier}%</span>}
                                </div>
                                <p className="text-parchment-dark/60 text-[10px] leading-tight">{skill.description}</p>
                              </div>
                            ) : (
                              <span className="text-parchment-dark/30 text-[10px]">— 空槽位 —</span>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Personality & background at the bottom */}
                  <div className="mt-3 pt-3 border-t border-amber-glow/20 space-y-2 text-xs">
                    <div>
                      <span className="text-amber-glow/70">性格：</span>
                      <span className="text-parchment">{viewedChar.persona}</span>
                    </div>
                    <div>
                      <span className="text-amber-glow/70">背景：</span>
                      <span className="text-parchment">{viewedChar.backstory.slice(0, 120)}{viewedChar.backstory.length > 120 ? '...' : ''}</span>
                    </div>
                    <div>
                      <span className="text-amber-glow/70">风格：</span>
                      <span className="text-parchment">{viewedChar.speechStyle}</span>
                    </div>
                    {viewedChar.tags && viewedChar.tags.length > 0 && (
                      <div>
                        <span className="text-amber-glow/70">标签：</span>
                        <span className="text-parchment-dark">{viewedChar.tags.join(' · ')}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ---- EQUIPMENT (with avatar switcher) ---- */}
          {activeRightPanel === 'equipment' && (
            <div className="space-y-1">
              {renderAvatarSwitcher()}
              <EquipmentPanel />
            </div>
          )}

          {/* ---- INVENTORY (with avatar switcher) ---- */}
          {activeRightPanel === 'inventory' && (
            <div className="space-y-1">
              {renderAvatarSwitcher()}
              <InventoryPanel />
            </div>
          )}

          {activeRightPanel === 'quests' && <QuestPanel />}
          {activeRightPanel === 'world' && <WorldPanel />}
        </div>
      </aside>

      {!rightOpen && (
        <button
          onClick={toggleRight}
          className="fixed top-3 right-3 z-10 p-2 bg-tavern-wood rounded-lg border border-amber-glow text-parchment"
        >
          <PanelRightOpen size={20} />
        </button>
      )}
    </>
  );
}

// Quick equipment slots for the player stats panel
function QuickEquipmentSlots() {
  const session = useChatStore((s) => s.session);
  const [slots, setSlots] = useState<Record<string, { name: string; icon: string } | null>>({});

  useState(() => {
    (async () => {
      if (!session) return;
      const eqs = await db.equipment.where('sessionId').equals(session.id).toArray();
      const inv = await db.inventory.where('sessionId').equals(session.id).toArray();
      const map: Record<string, { name: string; icon: string } | null> = {};
      for (const s of EQUIP_SLOTS) {
        const eq = eqs.find((e) => e.slot === s.slot);
        if (eq?.itemId) {
          const item = inv.find((i) => i.id === eq.itemId);
          map[s.slot] = item ? { name: item.name, icon: item.icon } : null;
        } else {
          map[s.slot] = null;
        }
      }
      setSlots(map);
    })();
  });

  return (
    <div className="space-y-1">
      {EQUIP_SLOTS.map(({ slot, label, icon }) => {
        const item = slots[slot];
        return (
          <div key={slot} className="flex items-center gap-2 p-1.5 rounded-lg border border-parchment-dark/20 bg-cosmic-light/30 text-xs">
            <span className="text-sm">{icon}</span>
            <span className="text-parchment-dark/60 text-[10px] w-8">{label}</span>
            {item ? (
              <span className="text-parchment text-[10px] truncate">{item.icon} {item.name}</span>
            ) : (
              <span className="text-parchment-dark/30 text-[10px]">空</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
