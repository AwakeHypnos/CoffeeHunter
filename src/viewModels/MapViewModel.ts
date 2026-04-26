import { Position } from '../models/types';
import { gameVM } from './GameViewModel';
import { cloneGameState, isPositionValid, getMapCell, updateMapCell, addItemToInventory } from '../models/gameState';
import { HOME_POSITION, getTerrainName, getTerrainIcon } from '../models/mapGenerator';
import { eventBus, GameEvents } from '../utils/eventBus';
import { getItemById } from '../models/itemDatabase';

export class MapViewModel {
  private static instance: MapViewModel;

  private constructor() {}

  public static getInstance(): MapViewModel {
    if (!MapViewModel.instance) {
      MapViewModel.instance = new MapViewModel();
    }
    return MapViewModel.instance;
  }

  public get map() {
    return gameVM.map;
  }

  public get playerPosition(): Position {
    return gameVM.player.position;
  }

  public get isPlayerAtHome(): boolean {
    return gameVM.player.isAtHome;
  }

  public movePlayer(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const currentPos = this.playerPosition;
    let newPos: Position;

    switch (direction) {
      case 'up':
        newPos = { x: currentPos.x, y: currentPos.y - 1 };
        break;
      case 'down':
        newPos = { x: currentPos.x, y: currentPos.y + 1 };
        break;
      case 'left':
        newPos = { x: currentPos.x - 1, y: currentPos.y };
        break;
      case 'right':
        newPos = { x: currentPos.x + 1, y: currentPos.y };
        break;
      default:
        return false;
    }

    const state = gameVM.state;
    if (!isPositionValid(state, newPos)) {
      gameVM.logMessage('无法移动到该位置！', 'warning');
      return false;
    }

    const cell = getMapCell(state, newPos);
    if (!cell) {
      return false;
    }

    gameVM.updateState(s => {
      const newState = cloneGameState(s);
      newState.player.position = newPos;
      newState.player.isAtHome = newPos.x === HOME_POSITION.x && newPos.y === HOME_POSITION.y;
      
      if (!cell.isRevealed) {
        newState.map[newPos.y][newPos.x].isRevealed = true;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
            if (isPositionValid(newState, revealPos)) {
              newState.map[revealPos.y][revealPos.x].isRevealed = true;
            }
          }
        }
      }
      
      return newState;
    });

    const terrainName = getTerrainName(cell.terrain);
    const terrainIcon = getTerrainIcon(cell.terrain);
    const wasAtHome = newPos.x === HOME_POSITION.x && newPos.y === HOME_POSITION.y;
    
    if (wasAtHome) {
      gameVM.logMessage(`${terrainIcon} 你回到了家中。可以在这里制作咖啡了！`, 'success');
    } else {
      gameVM.logMessage(`移动到了 ${terrainIcon} ${terrainName}`);
    }

    eventBus.emit(GameEvents.PLAYER_MOVED, newPos);
    return true;
  }

  public goHome(): boolean {
    const currentPos = this.playerPosition;
    if (currentPos.x === HOME_POSITION.x && currentPos.y === HOME_POSITION.y) {
      gameVM.logMessage('你已经在家中了！', 'warning');
      return true;
    }

    gameVM.updateState(s => {
      const newState = cloneGameState(s);
      newState.player.position = { ...HOME_POSITION };
      newState.player.isAtHome = true;
      return newState;
    });

    gameVM.logMessage('🏠 你使用传送回家了！', 'info');
    eventBus.emit(GameEvents.PLAYER_MOVED, HOME_POSITION);
    return true;
  }

  public collectItems(): string[] {
    const state = gameVM.state;
    const currentPos = this.playerPosition;
    const cell = getMapCell(state, currentPos);

    if (!cell || cell.items.length === 0) {
      gameVM.logMessage('这里没有可采集的物品。', 'warning');
      return [];
    }

    const collectedItems: string[] = [];
    
    cell.items.forEach(itemId => {
      const item = getItemById(itemId);
      if (item) {
        gameVM.updateState(s => addItemToInventory(s, itemId, 1));
        collectedItems.push(itemId);
        gameVM.logMessage(`✨ 采集到了 ${item.icon} ${item.name}！`, 'success');
        eventBus.emit(GameEvents.ITEM_COLLECTED, { itemId, item });
      }
    });

    gameVM.updateState(s => {
      return updateMapCell(s, currentPos, { items: [] });
    });

    return collectedItems;
  }

  public hasItemsAtCurrentPosition(): boolean {
    const state = gameVM.state;
    const currentPos = this.playerPosition;
    const cell = getMapCell(state, currentPos);
    return cell !== null && cell.items.length > 0;
  }

  public getItemsAtCurrentPosition(): string[] {
    const state = gameVM.state;
    const currentPos = this.playerPosition;
    const cell = getMapCell(state, currentPos);
    return cell ? cell.items : [];
  }

  public isCellRevealed(x: number, y: number): boolean {
    const state = gameVM.state;
    if (x < 0 || x >= state.map[0].length || y < 0 || y >= state.map.length) {
      return false;
    }
    return state.map[y][x].isRevealed;
  }

  public isPlayerAt(x: number, y: number): boolean {
    const pos = this.playerPosition;
    return pos.x === x && pos.y === y;
  }
}

export const mapVM = MapViewModel.getInstance();
