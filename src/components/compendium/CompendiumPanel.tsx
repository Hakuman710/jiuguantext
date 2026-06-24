import { useState } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { useCharacterStore } from '../../stores/character-store';
import { useWorldStore } from '../../stores/world-store';
import { CompendiumDetail } from './CompendiumDetail';
import { X } from 'lucide-react';
import type { CharacterCard, WorldBook, Location, NPC, Monster, WorldItem, WorldEquipment } from '../../types';

type Category = 'places' | 'characters' | 'monsters' | 'items' | 'equipment';

export interface CompendiumEntry {
  id: string;
  name: string;
  category: Category;
  sourceWorldName: string;
  place?: Location;
  character?: CharacterCard;
  npc?: NPC;
  monster?: Monster;
  item?: WorldItem;
  equipment?: WorldEquipment;
}

const categoryTabs: { id: Category; label: string; icon: string }[] = [
  { id: 'places', label: '地方', icon: '🏰' },
  { id: 'characters', label: '人物', icon: '👤' },
  { id: 'monsters', label: '怪物', icon: '👹' },
  { id: 'items', label: '道具', icon: '🧪' },
  { id: 'equipment', label: '装备', icon: '⚔️' },
];

export function CompendiumPanel() {
  const session = useChatStore((s) => s.session);
  const allChars = useCharacterStore((s) => s.characters);
  const allWorlds = useWorldStore((s) => s.worlds);
  const [category, setCategory] = useState<Category>('places');
  const [selected, setSelected] = useState<CompendiumEntry | null>(null);

  const worldIds = session?.worldIds;
  const worlds = worldIds
    ? worldIds.map((id) => allWorlds.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => w != null)
    : allWorlds;

  const charIds = session ? [session.primaryCharacterId, ...(session.npcCharacterIds || [])] : allChars.map((c) => c.id);

  // Build entries
  const entries: CompendiumEntry[] = [];
  const seenCharIds = new Set<string>();

  for (const w of worlds) {
    for (const loc of w.locations) {
      entries.push({ id: `place-${w.id}-${loc.id}`, name: loc.name, category: 'places', sourceWorldName: w.name, place: loc });
    }
    for (const npc of w.npcs) {
      entries.push({ id: `npc-${w.id}-${npc.id}`, name: npc.name, category: 'characters', sourceWorldName: w.name, npc });
    }
    for (const m of w.monsters || []) {
      entries.push({ id: `monster-${w.id}-${m.id}`, name: m.name, category: 'monsters', sourceWorldName: w.name, monster: m });
    }
    for (const it of w.items || []) {
      entries.push({ id: `item-${w.id}-${it.id}`, name: it.name, category: 'items', sourceWorldName: it.affiliation || w.name, item: it });
    }
    for (const eq of w.equipment || []) {
      entries.push({ id: `equip-${w.id}-${eq.id}`, name: eq.name, category: 'equipment', sourceWorldName: eq.affiliation || w.name, equipment: eq });
    }
  }

  const charEntries: CompendiumEntry[] = [];
  for (const id of charIds) {
    if (seenCharIds.has(id)) continue;
    seenCharIds.add(id);
    const c = allChars.find((x) => x.id === id);
    if (c) charEntries.push({ id: `char-${c.id}`, name: c.name, category: 'characters', sourceWorldName: '角色卡', character: c });
  }

  const getEntries = (cat: Category): CompendiumEntry[] => {
    switch (cat) {
      case 'places': return entries.filter((e) => e.category === 'places');
      case 'characters': return [...charEntries, ...entries.filter((e) => e.category === 'characters')];
      case 'monsters': return entries.filter((e) => e.category === 'monsters');
      case 'items': return entries.filter((e) => e.category === 'items');
      case 'equipment': return entries.filter((e) => e.category === 'equipment');
    }
  };

  const currentEntries = getEntries(category);

  const monsterTierBadge = (m: Monster) => {
    const label = m.type || '小怪';
    const cls = label === 'Boss' ? 'bg-red-900/40 text-red-400' : label === '精英' || label === '精英怪' ? 'bg-orange-900/30 text-orange-400' : 'bg-gray-800/50 text-gray-400';
    return <span className={`text-[10px] px-1 py-0.5 rounded ${cls}`}>{label}</span>;
  };

  return (
    <div className="flex-1 flex min-h-0">
      {/* Main grid area */}
      <div className={`flex-1 flex flex-col min-h-0 ${selected ? 'lg:pr-0' : ''}`}>
        {/* Category tabs */}
        <div className="flex border-b border-amber-glow/20 bg-tavern-wood shrink-0">
          {categoryTabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setCategory(id); setSelected(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs transition-colors ${
                category === id
                  ? 'text-amber-glow border-b-2 border-amber-glow bg-amber-glow/5'
                  : 'text-parchment-dark/60 hover:text-parchment-dark'
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {currentEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-parchment-dark/40">暂无数据</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {currentEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-2 transition-all text-center ${
                    selected?.id === entry.id
                      ? 'bg-amber-glow/20 border-amber-glow ring-1 ring-amber-glow/50'
                      : 'bg-cosmic-light/50 border-parchment-dark/15 hover:border-amber-glow/30 hover:bg-cosmic-light'
                  }`}
                >
                  <span className="text-xl mb-1">
                    {entry.category === 'places' ? '🏰' :
                     entry.category === 'characters' ? (entry.character ? '⭐' : '👤') :
                     entry.category === 'monsters' ? '👹' :
                     entry.category === 'items' ? '🧪' : '⚔️'}
                  </span>
                  <p className="text-[10px] text-parchment leading-tight line-clamp-2">{entry.name}</p>
                  {entry.category === 'monsters' && entry.monster && (
                    <div className="mt-0.5">{monsterTierBadge(entry.monster)}</div>
                  )}
                  {entry.category === 'characters' && entry.character && (
                    <span className="text-[9px] text-amber-glow/50 mt-0.5">角色卡</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel — slides in from right, same width as right sidebar */}
      {selected && (
        <div className="w-64 flex-shrink-0 border-l-2 border-amber-glow bg-tavern-wood flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-amber-glow/20">
            <span className="text-sm font-serif text-amber-glow">📖 详情</span>
            <button
              onClick={() => setSelected(null)}
              className="p-1 text-parchment-dark/50 hover:text-parchment rounded hover:bg-cosmic-light/50"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CompendiumDetail entry={selected} />
          </div>
        </div>
      )}
    </div>
  );
}
