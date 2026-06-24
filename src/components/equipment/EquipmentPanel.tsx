import { useEffect, useState } from 'react';
import { EQUIP_SLOTS, type Item, type EquipSlot } from '../../types';
import { db } from '../../db/database';
import { useChatStore } from '../../stores/chat-store';
import { useInventoryStore } from '../../stores/inventory-store';
import { EquipmentSlotView } from './EquipmentSlot';

export function EquipmentPanel() {
  const sessionId = useChatStore((s) => s.sessionId);
  const { items, equipItem, unequipItem } = useInventoryStore();
  const [equipment, setEquipment] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!sessionId) return;
    loadEquipment();
  }, [sessionId]);

  const loadEquipment = async () => {
    if (!sessionId) return;
    const all = await db.equipment.where('sessionId').equals(sessionId).toArray();
    const map: Record<string, string | null> = {};
    for (const s of EQUIP_SLOTS) {
      const eq = all.find((e) => e.slot === s.slot);
      map[s.slot] = eq?.itemId || null;
    }
    setEquipment(map);
  };

  const handleUnequip = async (slot: EquipSlot) => {
    await unequipItem(slot);
    await loadEquipment();
  };

  const getItem = (id: string | null): Item | null => {
    if (!id) return null;
    return items.find((i) => i.id === id) || null;
  };

  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusAgi = 0;
  let bonusSpi = 0;
  let bonusMres = 0;
  let bonusHp = 0;
  let bonusMp = 0;
  for (const [, itemId] of Object.entries(equipment)) {
    const item = getItem(itemId);
    if (item?.bonuses) {
      bonusAtk += item.bonuses.atk || 0;
      bonusDef += item.bonuses.def || 0;
      bonusAgi += item.bonuses.agi || 0;
      bonusSpi += item.bonuses.spi || 0;
      bonusMres += item.bonuses.mres || 0;
      bonusHp += item.bonuses.hp || 0;
      bonusMp += item.bonuses.mp || 0;
    }
  }

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-sm font-serif text-amber-glow mb-2">🛡️ 装备栏</h3>

      {EQUIP_SLOTS.map(({ slot }) => (
        <EquipmentSlotView
          key={slot}
          slot={slot}
          item={getItem(equipment[slot] || null)}
          onUnequip={handleUnequip}
        />
      ))}

      <div className="mt-3 pt-3 border-t border-amber-glow/20 text-xs text-parchment-dark space-y-0.5">
        <p>装备加成:</p>
        <p>攻击 +{bonusAtk} | 防御 +{bonusDef}</p>
        <p>敏捷 +{bonusAgi} | 精神 +{bonusSpi} | 魔抗 +{bonusMres}%</p>
        <p>HP +{bonusHp} | MP +{bonusMp}</p>
      </div>
    </div>
  );
}
