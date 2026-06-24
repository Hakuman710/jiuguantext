import { useInventoryStore } from '../../stores/inventory-store';
import type { EquipSlot } from '../../types';
import { ItemCard } from './ItemCard';

export function InventoryPanel() {
  const items = useInventoryStore((s) => s.items);
  const { equipItem, removeItem } = useInventoryStore();

  const handleEquip = async (itemId: string, slot: EquipSlot) => {
    await equipItem(itemId, slot);
  };

  const handleUse = async (itemId: string) => {
    await removeItem(itemId, 1);
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-serif text-amber-glow mb-2">🎒 背包</h3>

      {items.length === 0 ? (
        <p className="text-xs text-parchment-dark/60 text-center mt-8">背包空空如也</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onEquip={handleEquip} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  );
}
