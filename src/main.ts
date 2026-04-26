import { gameVM } from './viewModels/GameViewModel';
import { mapVM } from './viewModels/MapViewModel';
import { craftingVM } from './viewModels/CraftingViewModel';
import { inventoryVM } from './viewModels/InventoryViewModel';
import { uiRenderer } from './views/UIRenderer';
import { inputHandler } from './views/InputHandler';
import { eventBus, GameEvents } from './utils/eventBus';

class CoffeeHunterGame {
  private isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('☕ CoffeeHunter - 咖啡猎人 正在启动...');

    uiRenderer.initialize();
    inputHandler.initialize();

    this.setupDebugTools();

    uiRenderer.showTutorial();

    this.isInitialized = true;
    console.log('✅ CoffeeHunter 初始化完成！');
  }

  private setupDebugTools(): void {
    (window as unknown as Record<string, unknown>).gameVM = gameVM;
    (window as unknown as Record<string, unknown>).mapVM = mapVM;
    (window as unknown as Record<string, unknown>).craftingVM = craftingVM;
    (window as unknown as Record<string, unknown>).inventoryVM = inventoryVM;
    (window as unknown as Record<string, unknown>).eventBus = eventBus;
    (window as unknown as Record<string, unknown>).GameEvents = GameEvents;

    (window as unknown as Record<string, unknown>).addTestItems = () => {
      inventoryVM.addItem('green_ethiopian', 5);
      inventoryVM.addItem('fruit_vanilla', 3);
      inventoryVM.addItem('spice_cinnamon', 2);
      inventoryVM.addItem('milk_whole', 5);
      gameVM.logMessage('🎁 添加了测试物品！', 'success');
    };

    (window as unknown as Record<string, unknown>).addGold = (amount: number = 100) => {
      gameVM.addGold(amount);
      gameVM.logMessage(`💰 获得 ${amount} 金币！`, 'success');
    };

    (window as unknown as Record<string, unknown>).resetGame = () => {
      gameVM.resetGame();
    };
  }
}

const game = new CoffeeHunterGame();

document.addEventListener('DOMContentLoaded', () => {
  game.initialize().catch(error => {
    console.error('游戏初始化失败:', error);
  });
});

export default game;
