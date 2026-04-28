export type ItemType = 
  | 'green_bean' 
  | 'roasted_bean' 
  | 'coffee_powder' 
  | 'coffee_liquid'
  | 'fruit'
  | 'spice'
  | 'milk'
  | 'finished_coffee';

export type FlavorType = 
  | 'fruity'    // 果香
  | 'floral'    // 花香
  | 'sweet'     // 甜感
  | 'nutty'     // 坚果
  | 'chocolate' // 巧克力
  | 'spicy'     // 香料
  | 'sour'      // 酸感（负面）
  | 'bitter'    // 苦味（负面）
  | 'burnt'     // 焦味（负面）
  | 'watery';   // 淡味（负面）

export interface FlavorProfile {
  name: FlavorType;
  value: number;
  isPositive: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  description: string;
  baseValue: number;
  flavors: FlavorProfile[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface InventoryItem {
  item: Item;
  count: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface MapCell {
  position: Position;
  isRevealed: boolean;
  terrain: 'grass' | 'forest' | 'mountain' | 'water' | 'home';
  items: string[];
}

export interface Player {
  position: Position;
  isAtHome: boolean;
}

export interface GameState {
  gold: number;
  reputation: number;
  day: number;
  player: Player;
  inventory: InventoryItem[];
  map: MapCell[][];
  currentCraftingStep: CraftingStep;
  currentCoffee: FinishedCoffee | null;
}

export type CraftingStep = 
  | 'none'
  | 'process_ready'
  | 'roast_ready'
  | 'grind_ready'
  | 'brew_ready'
  | 'blend_ready'
  | 'coffee_ready';

export interface ProcessMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  addedTags: string[];
  tagMultiplier: Record<string, number>;
  removeTags: string[];
  qualityBonus: number;
  flavorModifiers: {
    add: FlavorType[];
    remove: FlavorType[];
    multiply: Record<FlavorType, number>;
  };
}

export interface FinishedCoffee {
  name: string;
  description: string;
  positiveFlavors: FlavorProfile[];
  negativeFlavors: FlavorProfile[];
  totalScore: number;
  basePrice: number;
  ingredients: string[];
}

export interface RoastProfile {
  name: string;
  description: string;
  duration: number;
  temperature: number;
  flavorModifiers: {
    add: FlavorType[];
    remove: FlavorType[];
    multiply: Record<FlavorType, number>;
  };
}

export interface GrindSetting {
  name: string;
  size: 'coarse' | 'medium' | 'fine' | 'extra_fine';
  brewMethods: string[];
  flavorModifiers: {
    add: FlavorType[];
    multiply: Record<FlavorType, number>;
  };
}

export interface BrewingMethod {
  name: string;
  description: string;
  waterRatio: number;
  brewTime: number;
  recommendedGrind: string[];
  flavorModifiers: {
    add: FlavorType[];
    multiply: Record<FlavorType, number>;
  };
}
