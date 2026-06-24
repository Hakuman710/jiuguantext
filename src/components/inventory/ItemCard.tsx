import type { Item, EquipSlot } from '../../types';

interface ItemCardProps {
  item: Item;
  onUse?: (id: string) => void;
  onEquip?: (id: string, slot: EquipSlot) => void;
}

export function ItemCard({ item, onUse, onEquip }: ItemCardProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-parchment-dark/30 bg-cosmic-light hover:bg-cosmic-light/70 transition-colors">
      <span className="text-xl">{item.icon || '📦'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-parchment truncate">{item.name}</p>
        <p className="text-xs text-parchment-dark/60 truncate">{item.description.slice(0, 30)}</p>
      </div>
      <span className="text-xs text-parchment-dark">×{item.quantity}</span>
      {item.equippable && item.slot && onEquip && (
        <button
          onClick={() => onEquip(item.id, item.slot!)}
          className="text-xs px-2 py-0.5 bg-amber-glow/30 text-amber-glow rounded hover:bg-amber-glow/50"
        >
          装备
        </button>
      )}
      {item.type === 'consumable' && onUse && (
        <button
          onClick={() => onUse(item.id)}
          className="text-xs px-2 py-0.5 bg-green-800/30 text-green-400 rounded hover:bg-green-800/50"
        >
          使用
        </button>
      )}
    </div>
  );
}
