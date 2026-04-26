type EventCallback = (data?: unknown) => void;

interface EventSubscription {
  event: string;
  callback: EventCallback;
  id: number;
}

export class EventBus {
  private static instance: EventBus;
  private subscriptions: EventSubscription[] = [];
  private nextId: number = 0;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: string, callback: EventCallback): number {
    const id = this.nextId++;
    this.subscriptions.push({ event, callback, id });
    return id;
  }

  public off(id: number): void {
    this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
  }

  public emit(event: string, data?: unknown): void {
    this.subscriptions
      .filter(sub => sub.event === event)
      .forEach(sub => {
        try {
          sub.callback(data);
        } catch (error) {
          console.error(`Event callback error for event "${event}":`, error);
        }
      });
  }

  public once(event: string, callback: EventCallback): number {
    const wrapper = (data?: unknown) => {
      callback(data);
      this.off(id);
    };
    const id = this.on(event, wrapper);
    return id;
  }

  public clear(): void {
    this.subscriptions = [];
  }
}

export const eventBus = EventBus.getInstance();

export enum GameEvents {
  STATE_CHANGED = 'state:changed',
  PLAYER_MOVED = 'player:moved',
  ITEM_COLLECTED = 'item:collected',
  ITEM_ADDED = 'item:added',
  ITEM_REMOVED = 'item:removed',
  CRAFTING_STEP_COMPLETED = 'crafting:step',
  COFFEE_CREATED = 'coffee:created',
  COFFEE_SOLD = 'coffee:sold',
  MAP_REVEALED = 'map:revealed',
  MESSAGE = 'game:message',
  DAY_CHANGED = 'day:changed',
}
