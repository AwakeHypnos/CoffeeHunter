import { MapCell, Position } from './types';
import { getRandomItem } from './itemDatabase';

export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 11;
export const HOME_POSITION: Position = { x: 7, y: 5 };

export function generateMap(): MapCell[][] {
  const map: MapCell[][] = [];
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const isHome = x === HOME_POSITION.x && y === HOME_POSITION.y;
      
      let terrain: 'grass' | 'forest' | 'mountain' | 'water' | 'home' = 'grass';
      if (isHome) {
        terrain = 'home';
      } else {
        const rand = Math.random();
        if (rand < 0.5) terrain = 'grass';
        else if (rand < 0.8) terrain = 'forest';
        else if (rand < 0.9) terrain = 'mountain';
        else terrain = 'water';
      }
      
      const items: string[] = [];
      
      if (!isHome && terrain !== 'water') {
        const itemChance = terrain === 'forest' ? 0.4 : 0.25;
        if (Math.random() < itemChance) {
          let itemType: string;
          const typeRand = Math.random();
          
          if (typeRand < 0.5) {
            itemType = 'green_bean';
          } else if (typeRand < 0.75) {
            itemType = 'fruit';
          } else {
            itemType = 'spice';
          }
          
          const randomItem = getRandomItem(itemType);
          items.push(randomItem.id);
          
          if (Math.random() < 0.3) {
            const extraItem = getRandomItem(itemType);
            if (extraItem.id !== randomItem.id) {
              items.push(extraItem.id);
            }
          }
        }
      }
      
      const isNearHome = Math.abs(x - HOME_POSITION.x) <= 1 && Math.abs(y - HOME_POSITION.y) <= 1;
      
      map[y][x] = {
        position: { x, y },
        isRevealed: isHome || isNearHome,
        terrain,
        items
      };
    }
  }
  
  return map;
}

export function getTerrainIcon(terrain: string): string {
  const icons: Record<string, string> = {
    grass: '🌿',
    forest: '🌲',
    mountain: '⛰️',
    water: '💧',
    home: '🏠'
  };
  return icons[terrain] || '?';
}

export function getTerrainName(terrain: string): string {
  const names: Record<string, string> = {
    grass: '草地',
    forest: '森林',
    mountain: '山地',
    water: '水域',
    home: '家中'
  };
  return names[terrain] || '未知';
}