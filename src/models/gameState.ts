import { GameState, Player, InventoryItem, CraftingStep, Position, MapCell } from './types';
import { generateMap, HOME_POSITION } from './mapGenerator';
import { itemDatabase, getItemById } from './itemDatabase';

export function createInitialGameState(): GameState {
  const initialInventory: InventoryItem[] = [
    {
      item: itemDatabase.green_colombian,
      count: 3
    },
    {
      item: itemDatabase.milk_whole,
      count: 2
    },
    {
      item: itemDatabase.spice_cinnamon,
      count: 1
    }
  ];

  const initialPlayer: Player = {
    position: { ...HOME_POSITION },
    isAtHome: true
  };

  return {
    gold: 100,
    reputation: 0,
    day: 1,
    player: initialPlayer,
    inventory: initialInventory,
    map: generateMap(),
    currentCraftingStep: 'none',
    currentCoffee: null
  };
}

export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function isPositionValid(state: GameState, position: Position): boolean {
  const map = state.map;
  if (position.x < 0 || position.x >= map[0].length) return false;
  if (position.y < 0 || position.y >= map.length) return false;
  
  const cell = map[position.y][position.x];
  return cell.terrain !== 'water';
}

export function getMapCell(state: GameState, position: Position): MapCell | null {
  if (!isPositionValid(state, position)) return null;
  return state.map[position.y][position.x];
}

export function updateMapCell(
  state: GameState,
  position: Position,
  updates: Partial<MapCell>
): GameState {
  const newState = cloneGameState(state);
  const cell = newState.map[position.y][position.x];
  newState.map[position.y][position.x] = { ...cell, ...updates };
  return newState;
}

export function canCraftAtStep(state: GameState, step: CraftingStep): boolean {
  if (!state.player.isAtHome) return false;
  
  switch (step) {
    case 'roast_ready':
      return hasItemOfType(state, 'green_bean');
    case 'grind_ready':
      return hasItemOfType(state, 'roasted_bean');
    case 'brew_ready':
      return hasItemOfType(state, 'coffee_powder');
    case 'blend_ready':
      return hasItemOfType(state, 'coffee_liquid');
    case 'coffee_ready':
      return state.currentCoffee !== null;
    default:
      return false;
  }
}

export function hasItemOfType(state: GameState, type: string): boolean {
  return state.inventory.some(item => item.item.type === type);
}

export function getItemCount(state: GameState, itemId: string): number {
  const inventoryItem = state.inventory.find(i => i.item.id === itemId);
  return inventoryItem ? inventoryItem.count : 0;
}

export function addItemToInventory(
  state: GameState,
  itemId: string,
  count: number
): GameState {
  const newState = cloneGameState(state);
  const existingIndex = newState.inventory.findIndex(i => i.item.id === itemId);
  
  if (existingIndex >= 0) {
    newState.inventory[existingIndex].count += count;
  } else {
    const item = getItemById(itemId);
    if (item) {
      newState.inventory.push({ item, count });
    }
  }
  
  return newState;
}

export function removeItemFromInventory(
  state: GameState,
  itemId: string,
  count: number
): GameState {
  const newState = cloneGameState(state);
  const existingIndex = newState.inventory.findIndex(i => i.item.id === itemId);
  
  if (existingIndex >= 0) {
    newState.inventory[existingIndex].count -= count;
    if (newState.inventory[existingIndex].count <= 0) {
      newState.inventory.splice(existingIndex, 1);
    }
  }
  
  return newState;
}

export function getFirstItemOfType(state: GameState, type: string): InventoryItem | null {
  const item = state.inventory.find(i => i.item.type === type);
  return item || null;
}
