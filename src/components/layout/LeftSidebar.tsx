import { Compass, BookOpen, Users, Globe, Settings, Menu } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

const navItems = [
  { id: 'adventures' as const, label: '开启世界', icon: Compass },
  { id: 'compendium' as const, label: '图鉴', icon: BookOpen },
  { id: 'characters' as const, label: '角色库', icon: Users },
  { id: 'worlds' as const, label: '世界库', icon: Globe },
  { id: 'settings' as const, label: '设置', icon: Settings },
];

export function LeftSidebar() {
  const { activeLeftView, setLeftView, leftOpen, toggleLeft } = useAppStore();

  return (
    <>
      {leftOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/40" onClick={toggleLeft} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-tavern-wood border-r-2 border-amber-glow flex flex-col transition-transform ${
          leftOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-amber-glow/30">
          <h2 className="text-lg font-serif text-amber-glow text-center">AI 酒馆</h2>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setLeftView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeLeftView === id
                  ? 'bg-amber-glow/20 text-amber-glow'
                  : 'text-parchment-dark hover:bg-tavern-wood-light hover:text-parchment'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-amber-glow/30">
          <p className="text-xs text-parchment-dark/60 text-center">单机版 · 数据存于本地</p>
        </div>
      </aside>

      {!leftOpen && (
        <button
          onClick={toggleLeft}
          className="fixed top-3 left-3 z-10 p-2 bg-tavern-wood rounded-lg border border-amber-glow text-parchment"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}
