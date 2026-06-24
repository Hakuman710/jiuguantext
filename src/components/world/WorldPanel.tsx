import { useWorldStore } from '../../stores/world-store';
import { useChatStore } from '../../stores/chat-store';
import { MapPin, Clock } from 'lucide-react';

function formatGameTime(timestamp: number): string {
  const elapsed = timestamp - Date.now();
  const days = Math.floor(elapsed / 86400000) + 1;
  const d = new Date(timestamp);
  return `第 ${days} 天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function WorldPanel() {
  const allWorlds = useWorldStore((s) => s.worlds);
  const session = useChatStore((s) => s.session);

  if (!session) {
    return (
      <div className="p-3">
        <p className="text-xs text-parchment-dark/60 text-center mt-4">请先导入世界书并开始游戏</p>
      </div>
    );
  }

  // Load all worlds in this session
  const worlds = (session.worldIds || [])
    .map((id) => allWorlds.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w != null);

  if (worlds.length === 0) {
    return (
      <div className="p-3">
        <p className="text-xs text-parchment-dark/60 text-center mt-4">请先导入世界书并开始游戏</p>
      </div>
    );
  }

  // Find current location across all worlds
  let currentLocation = null;
  let currentWorldName = '';
  for (const w of worlds) {
    const loc = w.locations.find((l) => l.id === session.currentLocation);
    if (loc) { currentLocation = loc; currentWorldName = w.name; break; }
  }

  // Merge all locations from all worlds
  const allLocations = worlds.flatMap((w) => w.locations.map((l) => ({ ...l, worldName: w.name })));
  // Merge all NPCs from all worlds
  const allNpcs = worlds.flatMap((w) => w.npcs.map((n) => ({ ...n, worldName: w.name })));

  return (
    <div className="p-3 space-y-3 text-xs text-parchment">
      {/* World books info */}
      <div>
        <h4 className="text-amber-glow font-serif mb-1 text-[10px]">📚 世界书</h4>
        <p className="text-parchment-dark/60 text-[10px]">{worlds.map((w) => w.name).join(' + ')}</p>
      </div>

      <div>
        <h4 className="text-amber-glow font-serif mb-1 flex items-center gap-1">
          <MapPin size={14} /> 当前位置
        </h4>
        <p className="text-parchment">
          {currentLocation?.name || '未知'}
          {currentWorldName ? <span className="text-parchment-dark/50 text-[10px] ml-1">[{currentWorldName}]</span> : null}
        </p>
        <p className="text-parchment-dark/60 mt-0.5">{currentLocation?.description || ''}</p>
      </div>

      <div className="pt-2 border-t border-amber-glow/20">
        <h4 className="text-amber-glow/70 mb-1">可前往</h4>
        {allLocations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => {
              session.currentLocation = loc.id;
              useChatStore.getState().setSession({ ...session });
            }}
            disabled={loc.id === session.currentLocation}
            className={`block w-full text-left px-2 py-1 rounded mb-1 transition-colors ${
              loc.id === session.currentLocation
                ? 'bg-amber-glow/20 text-amber-glow'
                : 'hover:bg-tavern-wood-light text-parchment-dark hover:text-parchment'
            }`}
          >
            <span>{loc.name}</span>
            {worlds.length > 1 && (
              <span className="text-parchment-dark/40 text-[10px] ml-1">[{loc.worldName}]</span>
            )}
          </button>
        ))}
      </div>

      {allNpcs.length > 0 && (
        <div className="pt-2 border-t border-amber-glow/20">
          <h4 className="text-amber-glow/70 mb-1">已知人物</h4>
          {allNpcs
            .filter((n) => !n.location || n.location === session.currentLocation)
            .map((npc) => (
              <div key={`${npc.worldName}-${npc.id}`} className="py-1">
                <span className="text-parchment">{npc.name}</span>
                <span className="text-parchment-dark/40 ml-1">
                  — {npc.description.slice(0, 30)}...
                </span>
                {worlds.length > 1 && (
                  <span className="text-parchment-dark/50 text-[10px] ml-1">[{npc.worldName}]</span>
                )}
              </div>
            ))}
        </div>
      )}

      {worlds.some((w) => w.timeRules?.enabled) && (
        <div className="pt-2 border-t border-amber-glow/20">
          <h4 className="text-amber-glow/70 flex items-center gap-1 mb-1">
            <Clock size={14} /> 游戏时间
          </h4>
          <p className="text-parchment">{formatGameTime(session.gameTime)}</p>
        </div>
      )}
    </div>
  );
}
