import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useCharacterStore } from './stores/character-store';
import { useWorldStore } from './stores/world-store';
import { useSettingsStore } from './stores/settings-store';
import { useChatStore } from './stores/chat-store';
import { useAppStore } from './stores/app-store';
import { CharacterLibrary } from './components/character/CharacterLibrary';
import { CharacterPanel } from './components/character/CharacterPanel';
import { WorldImport } from './components/world/WorldImport';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ChatWindow } from './components/chat/ChatWindow';
import { WorldLauncher } from './components/world/WorldLauncher';
import { CompendiumPanel } from './components/compendium/CompendiumPanel';

function App() {
  const { activeLeftView } = useAppStore();
  const {
    loadAll: loadChars,
  } = useCharacterStore();
  const {
    loadAll: loadWorlds,
    worlds,
    selectedId: worldId,
    select: selectWorld,
    deleteWorld,
  } = useWorldStore();
  const { load: loadSettings } = useSettingsStore();
  const session = useChatStore((s) => s.session);

  useEffect(() => {
    loadChars();
    loadWorlds();
    loadSettings();
  }, []);

  return (
    <AppLayout>
      {session && activeLeftView !== 'compendium' ? (
        <ChatWindow />
      ) : activeLeftView === 'compendium' ? (
        <CompendiumPanel />
      ) : (
        <div className="flex-1 overflow-auto">
          {activeLeftView === 'adventures' && <WorldLauncher />}

          {activeLeftView === 'characters' && (
            <div>
              <CharacterLibrary />
              <CharacterPanel />
            </div>
          )}

          {activeLeftView === 'worlds' && (
            <div className="p-3">
              <WorldImport />
              <div className="mt-3 space-y-1">
                {worlds.length === 0 && (
                  <p className="text-xs text-parchment-dark/60 text-center mt-4">
                    暂无世界，点击上方导入
                  </p>
                )}
                {worlds.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => selectWorld(worldId === w.id ? null : w.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      worldId === w.id
                        ? 'bg-amber-glow/20 border border-amber-glow'
                        : 'hover:bg-tavern-wood-light border border-transparent'
                    }`}
                  >
                    <span className="text-lg">🗺️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-parchment truncate">{w.name}</p>
                      <p className="text-xs text-parchment-dark/60 truncate">
                        {w.description.slice(0, 40)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorld(w.id);
                      }}
                      className="text-parchment-dark/40 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLeftView === 'settings' && <SettingsPanel />}
        </div>
      )}
    </AppLayout>
  );
}

export default App;
