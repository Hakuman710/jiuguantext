import type { EquipSlot, Item } from '../../types';
import { EQUIP_SLOTS } from '../../types';

interface EquipmentSlotProps {
  slot: EquipSlot;
  item: Item | null;
  onUnequip: (slot: EquipSlot) => void;
}

export function EquipmentSlotView({ slot, item, onUnequip }: EquipmentSlotProps) {
  const meta = EQUIP_SLOTS.find((s) => s.slot === slot)!;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-parchment-dark/30 bg-cosmic-light">
      <span className="text-lg">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-parchment-dark">{meta.label}</p>
        {item ? (
          <div className="flex items-center gap-1">
            <span className="text-sm text-parchment">
              {item.icon} {item.name}
            </span>
            <button
              onClick={() => onUnequip(slot)}
              className="text-xs text-red-400 hover:text-red-300 ml-auto"
            >
              卸下
            </button>
          </div>
        ) : (
          <p className="text-xs text-parchment-dark/60">空</p>
        )}
      </div>
    </div>
  );
}
