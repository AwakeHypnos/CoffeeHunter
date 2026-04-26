import { GameState } from '../models/types';
import { createInitialGameState, cloneGameState } from '../models/gameState';
import { eventBus, GameEvents } from '../utils/eventBus';

export class GameViewModel {
  private static instance: GameViewModel;
  private _state: GameState;

  private constructor() {
    this._state = createInitialGameState();
  }

  public static getInstance(): GameViewModel {
    if (!GameViewModel.instance) {
      GameViewModel.instance = new GameViewModel();
    }
    return GameViewModel.instance;
  }

  public get state(): GameState {
    return this._state;
  }

  public setState(newState: GameState): void {
    this._state = newState;
    eventBus.emit(GameEvents.STATE_CHANGED, cloneGameState(newState));
  }

  public updateState(updater: (state: GameState) => GameState): void {
    const newState = updater(this._state);
    this.setState(newState);
  }

  public get gold(): number {
    return this._state.gold;
  }

  public get reputation(): number {
    return this._state.reputation;
  }

  public get day(): number {
    return this._state.day;
  }

  public get inventory(): typeof this._state.inventory {
    return this._state.inventory;
  }

  public get map(): typeof this._state.map {
    return this._state.map;
  }

  public get player(): typeof this._state.player {
    return this._state.player;
  }

  public get currentCraftingStep(): typeof this._state.currentCraftingStep {
    return this._state.currentCraftingStep;
  }

  public get currentCoffee(): typeof this._state.currentCoffee {
    return this._state.currentCoffee;
  }

  public addGold(amount: number): void {
    this.updateState(state => {
      const newState = cloneGameState(state);
      newState.gold += amount;
      return newState;
    });
  }

  public addReputation(amount: number): void {
    this.updateState(state => {
      const newState = cloneGameState(state);
      newState.reputation += amount;
      return newState;
    });
  }

  public advanceDay(): void {
    this.updateState(state => {
      const newState = cloneGameState(state);
      newState.day += 1;
      return newState;
    });
    eventBus.emit(GameEvents.DAY_CHANGED, this.day);
  }

  public logMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    eventBus.emit(GameEvents.MESSAGE, { message, type, timestamp: Date.now() });
  }

  public resetGame(): void {
    this._state = createInitialGameState();
    eventBus.emit(GameEvents.STATE_CHANGED, cloneGameState(this._state));
    this.logMessage('游戏已重置！', 'info');
  }
}

export const gameVM = GameViewModel.getInstance();
