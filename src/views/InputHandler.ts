import { mapVM } from '../viewModels/MapViewModel';
import { craftingVM } from '../viewModels/CraftingViewModel';
import { gameVM } from '../viewModels/GameViewModel';

export class InputHandler {
  private static instance: InputHandler;
  private keyRepeatDelay: number = 150;
  private keyRepeatInterval: number = 50;
  private keyStates: Map<string, { isPressed: boolean; lastPressTime: number; isRepeating: boolean }> = new Map();
  private lastFrameTime: number = 0;

  private constructor() {}

  public static getInstance(): InputHandler {
    if (!InputHandler.instance) {
      InputHandler.instance = new InputHandler();
    }
    return InputHandler.instance;
  }

  public initialize(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    this.lastFrameTime = performance.now();
    this.startInputLoop();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    
    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, {
        isPressed: false,
        lastPressTime: 0,
        isRepeating: false
      });
    }

    const state = this.keyStates.get(key)!;
    
    if (!state.isPressed) {
      state.isPressed = true;
      state.lastPressTime = performance.now();
      state.isRepeating = false;
      this.executeKeyAction(key);
    }

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key) ||
        ['w', 'a', 's', 'd'].includes(key)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const state = this.keyStates.get(key);
    
    if (state) {
      state.isPressed = false;
      state.isRepeating = false;
    }
  }

  private startInputLoop(): void {
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      this.keyStates.forEach((state, key) => {
        if (state.isPressed) {
          const timeSinceLastPress = currentTime - state.lastPressTime;
          
          if (!state.isRepeating && timeSinceLastPress >= this.keyRepeatDelay) {
            state.isRepeating = true;
            state.lastPressTime = currentTime;
          }
          
          if (state.isRepeating && timeSinceLastPress >= this.keyRepeatInterval) {
            state.lastPressTime = currentTime;
            this.executeRepeatableAction(key);
          }
        }
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private executeKeyAction(key: string): void {
    switch (key) {
      case 'arrowup':
      case 'w':
        mapVM.movePlayer('up');
        break;
      case 'arrowdown':
      case 's':
        mapVM.movePlayer('down');
        break;
      case 'arrowleft':
      case 'a':
        mapVM.movePlayer('left');
        break;
      case 'arrowright':
      case 'd':
        mapVM.movePlayer('right');
        break;
      case ' ':
        if (mapVM.hasItemsAtCurrentPosition()) {
          mapVM.collectItems();
        } else {
          gameVM.logMessage('这里没有可采集的物品。', 'warning');
        }
        break;
      case 'h':
        mapVM.goHome();
        break;
      case '1':
        if (mapVM.isPlayerAtHome) {
          craftingVM.roastGreenBean(1);
        }
        break;
      case '2':
        if (mapVM.isPlayerAtHome) {
          craftingVM.grindRoastedBean(1);
        }
        break;
      case '3':
        if (mapVM.isPlayerAtHome) {
          craftingVM.brewCoffee(0);
        }
        break;
      case '4':
        if (mapVM.isPlayerAtHome) {
          craftingVM.createFinishedCoffee();
        }
        break;
      case 'enter':
      case 'e':
        if (craftingVM.currentCoffee) {
          craftingVM.sellCurrentCoffee();
        }
        break;
      case 'r':
        if (mapVM.isPlayerAtHome) {
          gameVM.logMessage('📍 快捷操作: 1=烘焙, 2=研磨, 3=萃取, 4=调和, E=售卖');
        }
        break;
    }
  }

  private executeRepeatableAction(key: string): void {
    switch (key) {
      case 'arrowup':
      case 'w':
        mapVM.movePlayer('up');
        break;
      case 'arrowdown':
      case 's':
        mapVM.movePlayer('down');
        break;
      case 'arrowleft':
      case 'a':
        mapVM.movePlayer('left');
        break;
      case 'arrowright':
      case 'd':
        mapVM.movePlayer('right');
        break;
    }
  }
}

export const inputHandler = InputHandler.getInstance();
