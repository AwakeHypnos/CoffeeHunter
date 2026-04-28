import { InventoryItem, Item, ItemType } from '../models/types';
import { gameVM } from './GameViewModel';
import { addItemToInventory, removeItemFromInventory, getItemCount } from '../models/gameState';
import { getItemById } from '../models/itemDatabase';
import { eventBus, GameEvents } from '../utils/eventBus';

export class InventoryViewModel {
  private static instance: InventoryViewModel;

  private constructor() {}

  public static getInstance(): InventoryViewModel {
    if (!InventoryViewModel.instance) {
      InventoryViewModel.instance = new InventoryViewModel();
    }
    return InventoryViewModel.instance;
  }

  public get items(): InventoryItem[] {
    return gameVM.inventory;
  }

  public getItemCount(itemId: string): number {
    return getItemCount(gameVM.state, itemId);
  }

  public hasItem(itemId: string): boolean {
    return this.getItemCount(itemId) > 0;
  }

  public hasItemOfType(type: ItemType): boolean {
    return gameVM.inventory.some(item => item.item.type === type);
  }

  public getItemsByType(type: ItemType): InventoryItem[] {
    return gameVM.inventory.filter(item => item.item.type === type);
  }

  public addItem(itemId: string, count: number = 1): void {
    const item = getItemById(itemId);
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return;
    }

    gameVM.updateState(s => addItemToInventory(s, itemId, count));
    
    const newCount = this.getItemCount(itemId);
    gameVM.logMessage(`📦 添加了 ${item.icon} ${item.name} x${count}（总计: ${newCount}）`);
    eventBus.emit(GameEvents.ITEM_ADDED, { itemId, item, count, newCount });
  }

  public removeItem(itemId: string, count: number = 1): boolean {
    const currentCount = this.getItemCount(itemId);
    if (currentCount < count) {
      gameVM.logMessage(`物品数量不足！需要 ${count}，当前 ${currentCount}`, 'warning');
      return false;
    }

    const item = getItemById(itemId);
    gameVM.updateState(s => removeItemFromInventory(s, itemId, count));
    
    const newCount = this.getItemCount(itemId);
    if (item) {
      gameVM.logMessage(`📦 移除了 ${item.icon} ${item.name} x${count}`);
    }
    eventBus.emit(GameEvents.ITEM_REMOVED, { itemId, count, newCount });
    
    return true;
  }

  public getItemById(itemId: string): Item | null {
    return getItemById(itemId);
  }

  public getTotalItemCount(): number {
    return gameVM.inventory.reduce((sum, item) => sum + item.count, 0);
  }

  public getInventoryValue(): number {
    return gameVM.inventory.reduce((sum, invItem) => {
      return sum + invItem.item.baseValue * invItem.count;
    }, 0);
  }

  public canAfford(price: number): boolean {
    return gameVM.gold >= price;
  }

  public sortInventory(by: 'name' | 'type' | 'value' | 'rarity'): InventoryItem[] {
    const sorted = [...gameVM.inventory];
    
    switch (by) {
      case 'name':
        sorted.sort((a, b) => a.item.name.localeCompare(b.item.name));
        break;
      case 'type':
        sorted.sort((a, b) => a.item.type.localeCompare(b.item.type));
        break;
      case 'value':
        sorted.sort((a, b) => b.item.baseValue - a.item.baseValue);
        break;
      case 'rarity':
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
        sorted.sort((a, b) => (rarityOrder[b.item.rarity] || 0) - (rarityOrder[a.item.rarity] || 0));
        break;
    }
    
    return sorted;
  }
}

export const inventoryVM = InventoryViewModel.getInstance();
