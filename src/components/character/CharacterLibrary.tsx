import { useCharacterStore } from '../../stores/character-store';
import { CharacterImport } from './CharacterImport';
import { Trash2 } from 'lucide-react';

export function CharacterLibrary() {
  const { characters, selectedId, select, deleteCharacter } = useCharacterStore();

  return (
    <div className="p-3">
      <CharacterImport />

      <div className="mt-3 space-y-1">
        {characters.length === 0 && (
          <p className="text-xs text-parchment-dark/60 text-center mt-4">暂无角色，点击上方导入</p>
        )}
        {characters.map((char) => (
          <div
            key={char.id}
            onClick={() => select(selectedId === char.id ? null : char.id)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
              selectedId === char.id
                ? 'bg-amber-glow/20 border border-amber-glow'
                : 'hover:bg-tavern-wood-light border border-transparent'
            }`}
          >
            {char.avatar ? (
              <img src={char.avatar} alt={char.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-glow/30 flex items-center justify-center text-sm text-parchment">
                {char.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-parchment truncate">{char.name}</p>
              <p className="text-xs text-parchment-dark/60 truncate">{char.tags?.join(', ') || '无标签'}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteCharacter(char.id);
              }}
              className="text-parchment-dark/40 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
