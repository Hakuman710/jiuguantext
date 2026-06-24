import { create } from 'zustand';
import type { Item, EquipSlot } from '../types';
import { db } from '../db/database';

interface InventoryState {
  items: Item[];
  sessionId: string | null;
  loadSession: (id: string) => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  removeItem: (id: string, count?: number) => Promise<void>;
  equipItem: (itemId: string, slot: EquipSlot) => Promise<void>;
  unequipItem: (slot: EquipSlot) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  sessionId: null,

  loadSession: async (id: string) => {
    const items = await db.inventory.where('sessionId').equals(id).toArray();
    set({ items, sessionId: id });
  },

  addItem: async (item: Item) => {
    const sid = get().sessionId;
    if (!sid) return;
    item.id = item.id || crypto.randomUUID();
    const existing = await db.inventory.get(item.id);
    if (existing) {
      await db.inventory.update(item.id, { quantity: existing.quantity + item.quantity });
    } else {
      await db.inventory.put({ ...item, sessionId: sid } as Item);
    }
    const items = await db.inventory.where('sessionId').equals(sid).toArray();
    set({ items });
  },

  removeItem: async (id: string, count?: number) => {
    const existing = await db.inventory.get(id);
    if (!existing) return;
    if (count === undefined || existing.quantity <= count) {
      await db.inventory.delete(id);
    } else {
      await db.inventory.update(id, { quantity: existing.quantity - count });
    }
    const sid = get().sessionId;
    if (sid) {
      const items = await db.inventory.where('sessionId').equals(sid).toArray();
      set({ items });
    }
  },

  equipItem: async (itemId: string, slot: EquipSlot) => {
    const sid = get().sessionId;
    if (!sid) return;
    await db.equipment.where({ sessionId: sid, slot }).delete();
    await db.equipment.put({ sessionId: sid, slot, itemId });
    await db.inventory.delete(itemId);
    const items = await db.inventory.where('sessionId').equals(sid).toArray();
    set({ items });
  },

  unequipItem: async (slot: EquipSlot) => {
    const sid = get().sessionId;
    if (!sid) return;
    const record = await db.equipment.where({ sessionId: sid, slot }).first();
    if (record?.itemId) {
      const item = await db.inventory.get(record.itemId);
      if (item) {
        await db.inventory.update(record.itemId, { quantity: item.quantity + 1 });
      }
    }
    await db.equipment.where({ sessionId: sid, slot }).delete();
    const items = await db.inventory.where('sessionId').equals(sid).toArray();
    set({ items });
  },
}));
