import { gameVM } from '../viewModels/GameViewModel';
import { mapVM } from '../viewModels/MapViewModel';
import { inventoryVM } from '../viewModels/InventoryViewModel';
import { craftingVM } from '../viewModels/CraftingViewModel';
import { eventBus, GameEvents } from '../utils/eventBus';
import { getTerrainIcon } from '../models/mapGenerator';
import { getItemById } from '../models/itemDatabase';

export class UIRenderer {
  private static instance: UIRenderer;
  private messageLog: HTMLElement | null = null;
  private messageHistory: { message: string; type: string; timestamp: number }[] = [];
  private maxMessages: number = 50;

  private constructor() {}

  public static getInstance(): UIRenderer {
    if (!UIRenderer.instance) {
      UIRenderer.instance = new UIRenderer();
    }
    return UIRenderer.instance;
  }

  public initialize(): void {
    this.messageLog = document.getElementById('message-log');
    this.setupEventListeners();
    this.renderAll();
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvents.STATE_CHANGED, () => {
      this.renderAll();
    });

    eventBus.on(GameEvents.MESSAGE, (data: unknown) => {
      const msg = data as { message: string; type: string; timestamp: number };
      this.addMessage(msg.message, msg.type as 'info' | 'success' | 'warning' | 'error');
    });

    eventBus.on(GameEvents.PLAYER_MOVED, () => {
      this.renderMap();
      this.renderLocation();
    });

    eventBus.on(GameEvents.ITEM_ADDED, () => {
      this.renderInventory();
    });

    eventBus.on(GameEvents.ITEM_REMOVED, () => {
      this.renderInventory();
    });

    eventBus.on(GameEvents.ITEM_COLLECTED, () => {
      this.renderMap();
    });

    eventBus.on(GameEvents.COFFEE_CREATED, () => {
      this.renderCraftingPanel();
      this.renderCoffeeResult();
    });

    eventBus.on(GameEvents.COFFEE_SOLD, () => {
      this.renderStats();
      this.renderCraftingPanel();
    });
  }

  public renderAll(): void {
    this.renderStats();
    this.renderMap();
    this.renderInventory();
    this.renderCraftingPanel();
    this.renderCoffeeResult();
    this.renderLocation();
  }

  private renderStats(): void {
    const goldDisplay = document.getElementById('gold-display');
    const reputationDisplay = document.getElementById('reputation-display');
    const dayDisplay = document.getElementById('day-display');

    if (goldDisplay) goldDisplay.textContent = gameVM.gold.toString();
    if (reputationDisplay) reputationDisplay.textContent = gameVM.reputation.toString();
    if (dayDisplay) dayDisplay.textContent = gameVM.day.toString();
  }

  private renderLocation(): void {
    const locationDisplay = document.getElementById('location-display');
    const craftStatus = document.getElementById('craft-status');

    if (mapVM.isPlayerAtHome) {
      if (locationDisplay) locationDisplay.textContent = '🏠 家中';
      if (craftStatus) {
        craftStatus.textContent = '可以制作咖啡了！';
        craftStatus.style.color = '#4ade80';
      }
    } else {
      if (locationDisplay) locationDisplay.textContent = '🗺️ 探索中';
      if (craftStatus) {
        craftStatus.textContent = '需要回家才能制作';
        craftStatus.style.color = '#888';
      }
    }
  }

  private renderMap(): void {
    const mapGrid = document.getElementById('map-grid');
    if (!mapGrid) return;

    mapGrid.innerHTML = '';
    mapGrid.style.gridTemplateColumns = `repeat(${gameVM.map[0].length}, 40px)`;

    const itemsAtPlayer = mapVM.getItemsAtCurrentPosition();
    const hasItems = itemsAtPlayer.length > 0;

    for (let y = 0; y < gameVM.map.length; y++) {
      for (let x = 0; x < gameVM.map[y].length; x++) {
        const cell = gameVM.map[y][x];
        const cellEl = document.createElement('div');
        cellEl.className = 'map-cell';
        
        const isPlayer = mapVM.isPlayerAt(x, y);
        const isHome = cell.terrain === 'home';
        
        if (isPlayer) {
          cellEl.classList.add('player');
        } else if (!cell.isRevealed) {
          cellEl.classList.add('fog');
        } else if (isHome) {
          cellEl.classList.add('home');
        } else {
          cellEl.classList.add('revealed');
        }

        if (cell.isRevealed) {
          if (isPlayer && hasItems) {
            const firstItem = getItemById(itemsAtPlayer[0]);
            cellEl.textContent = firstItem?.icon || '✨';
          } else if (isPlayer) {
            cellEl.textContent = '🧙';
          } else if (isHome) {
            cellEl.textContent = '🏠';
          } else if (cell.items.length > 0) {
            const firstItem = getItemById(cell.items[0]);
            cellEl.textContent = firstItem?.icon || '✨';
          } else {
            cellEl.textContent = getTerrainIcon(cell.terrain);
          }
        } else {
          cellEl.textContent = '?';
        }

        cellEl.addEventListener('click', () => {
          this.handleMapCellClick(x, y);
        });

        mapGrid.appendChild(cellEl);
      }
    }
  }

  private handleMapCellClick(x: number, y: number): void {
    const playerPos = mapVM.playerPosition;
    const dx = x - playerPos.x;
    const dy = y - playerPos.y;

    if (Math.abs(dx) + Math.abs(dy) === 1) {
      if (dx === 1) mapVM.movePlayer('right');
      else if (dx === -1) mapVM.movePlayer('left');
      else if (dy === 1) mapVM.movePlayer('down');
      else if (dy === -1) mapVM.movePlayer('up');
    } else if (dx === 0 && dy === 0) {
      if (mapVM.hasItemsAtCurrentPosition()) {
        mapVM.collectItems();
      }
    }
  }

  private renderInventory(): void {
    const inventoryEl = document.getElementById('inventory');
    if (!inventoryEl) return;

    inventoryEl.innerHTML = '';

    const items = inventoryVM.items;
    const maxSlots = 16;

    for (let i = 0; i < Math.max(items.length, maxSlots); i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'inventory-slot';

      if (i < items.length) {
        const invItem = items[i];
        slotEl.innerHTML = `
          <span class="item-icon">${invItem.item.icon}</span>
          ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
        `;
        slotEl.title = `${invItem.item.name}: ${invItem.item.description}\n数量: ${invItem.count}\n价值: ${invItem.item.baseValue}`;
        
        slotEl.addEventListener('click', () => {
          gameVM.logMessage(`📦 ${invItem.item.icon} ${invItem.item.name}: ${invItem.item.description} (x${invItem.count})`);
        });

        if (!mapVM.isPlayerAtHome) {
          const type = invItem.item.type;
          if (type === 'fruit' || type === 'spice' || type === 'milk') {
            slotEl.style.opacity = '0.7';
          }
        }
      }

      inventoryEl.appendChild(slotEl);
    }
  }

  private renderCraftingPanel(): void {
    const canCraft = craftingVM.canCraft;
    
    const steps = [
      { id: 'step-process', step: 'process_ready' as const, action: () => craftingVM.processGreenBean(0, 1) },
      { id: 'step-roast', step: 'roast_ready' as const, action: () => craftingVM.roastGreenBean(1, 1) },
      { id: 'step-grind', step: 'grind_ready' as const, action: () => craftingVM.grindRoastedBean(1, 1) },
      { id: 'step-brew', step: 'brew_ready' as const, action: () => craftingVM.brewCoffee(0, 1) },
      { id: 'step-blend', step: 'blend_ready' as const, action: () => craftingVM.createFinishedCoffee() },
    ];

    steps.forEach(({ id, step, action }) => {
      const stepEl = document.getElementById(id);
      if (!stepEl) return;

      stepEl.classList.toggle('disabled', !canCraft || !craftingVM.canPerformStep(step));
      
      stepEl.onclick = () => {
        if (canCraft && craftingVM.canPerformStep(step)) {
          action();
        }
      };
    });

    this.renderAdditivesPanel();
    this.renderBatchControls();

    const btnCraft = document.getElementById('btn-craft-coffee') as HTMLButtonElement;
    const btnSell = document.getElementById('btn-sell-coffee') as HTMLButtonElement;

    if (btnCraft) {
      btnCraft.disabled = !canCraft || !craftingVM.canPerformStep('blend_ready');
      btnCraft.onclick = () => {
        if (canCraft && craftingVM.canPerformStep('blend_ready')) {
          craftingVM.createFinishedCoffee();
        }
      };
    }

    if (btnSell) {
      btnSell.disabled = !canCraft || !craftingVM.currentCoffee;
      btnSell.onclick = () => {
        if (craftingVM.currentCoffee) {
          craftingVM.sellCurrentCoffee();
        }
      };
    }
  }

  private renderAdditivesPanel(): void {
    const additivesContainer = document.getElementById('additives-panel');
    if (!additivesContainer) return;

    const availableAdditives = craftingVM.getAvailableAdditives();
    const selectedAdditives = craftingVM.getSelectedAdditives();

    additivesContainer.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #e94560;">🧪 配料选择（最多3种）</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
        ${availableAdditives.map((additive, index) => {
          const isSelected = selectedAdditives.includes(additive.id);
          const selectedCount = selectedAdditives.filter(id => id === additive.id).length;
          return `
            <button 
              class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'}" 
              style="padding: 8px 12px; font-size: 0.85rem;"
              onclick="uiRenderer_selectAdditive('${additive.id}')"
              title="${additive.description}"
            >
              ${additive.icon} ${additive.name} ${selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 0.85rem; color: #888;">已选择:</span>
        ${selectedAdditives.length > 0 ? 
          selectedAdditives.map((id, index) => {
            const item = availableAdditives.find(a => a.id === id);
            return `
              <span style="background: rgba(233, 69, 96, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;"
                    onclick="uiRenderer_removeAdditive(${index})" title="点击移除">
                ${item?.icon || '❓'} ${item?.name || id} ✕
              </span>
            `;
          }).join('') :
          '<span style="font-size: 0.85rem; color: #555;">无</span>'
        }
        ${selectedAdditives.length > 0 ? `
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="uiRenderer_clearAdditives()">
            清空
          </button>
        ` : ''}
      </div>
    `;

    (window as unknown as Record<string, unknown>).uiRenderer_selectAdditive = (itemId: string) => {
      craftingVM.selectAdditive(itemId, 1);
      this.renderCraftingPanel();
    };

    (window as unknown as Record<string, unknown>).uiRenderer_removeAdditive = (index: number) => {
      craftingVM.removeAdditive(index);
      this.renderCraftingPanel();
    };

    (window as unknown as Record<string, unknown>).uiRenderer_clearAdditives = () => {
      craftingVM.clearSelectedAdditives();
      this.renderCraftingPanel();
    };
  }

  private renderBatchControls(): void {
    const batchContainer = document.getElementById('batch-controls');
    if (!batchContainer) return;

    const canCraft = craftingVM.canCraft;
    const hasGreenBean = craftingVM.canPerformStep('roast_ready');
    const hasRoastedBean = craftingVM.canPerformStep('grind_ready');
    const hasPowder = craftingVM.canPerformStep('brew_ready');

    batchContainer.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #e94560;">📦 批量制作</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.8rem;" 
                ${!canCraft || !hasGreenBean ? 'disabled' : ''}
                onclick="uiRenderer_batchProcess('process', 0, 3)">
          🔬 预处理x3
        </button>
        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.8rem;" 
                ${!canCraft || !hasGreenBean ? 'disabled' : ''}
                onclick="uiRenderer_batchProcess('roast', 1, 3)">
          🔥 烘焙x3
        </button>
        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.8rem;" 
                ${!canCraft || !hasRoastedBean ? 'disabled' : ''}
                onclick="uiRenderer_batchProcess('grind', 1, 3)">
          ⚙️ 研磨x3
        </button>
        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.8rem;" 
                ${!canCraft || !hasPowder ? 'disabled' : ''}
                onclick="uiRenderer_batchProcess('brew', 0, 3)">
          💧 萃取x3
        </button>
        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.8rem;" 
                ${!canCraft || !hasGreenBean ? 'disabled' : ''}
                onclick="uiRenderer_batchProcess('roast', 1, 5)">
          🔥 烘焙x5
        </button>
      </div>
    `;

    (window as unknown as Record<string, unknown>).uiRenderer_batchProcess = (
      step: string, 
      optionIndex: number, 
      count: number
    ) => {
      switch (step) {
        case 'process':
          craftingVM.processGreenBean(optionIndex, count);
          break;
        case 'roast':
          craftingVM.roastGreenBean(optionIndex, count);
          break;
        case 'grind':
          craftingVM.grindRoastedBean(optionIndex, count);
          break;
        case 'brew':
          craftingVM.brewCoffee(optionIndex, count);
          break;
      }
      this.renderCraftingPanel();
    };
  }

  private renderCoffeeResult(): void {
    const resultEl = document.getElementById('coffee-result');
    const coffee = craftingVM.currentCoffee;

    if (!resultEl) return;

    if (!coffee) {
      resultEl.style.display = 'none';
      return;
    }

    resultEl.style.display = 'block';

    const nameEl = document.getElementById('coffee-name');
    const descEl = document.getElementById('coffee-description');
    const positiveEl = document.getElementById('coffee-positive');
    const negativeEl = document.getElementById('coffee-negative');
    const scoreEl = document.getElementById('coffee-score');

    if (nameEl) nameEl.textContent = `☕ ${coffee.name}`;
    if (descEl) descEl.textContent = coffee.description;
    
    const positiveScore = coffee.positiveFlavors.reduce((sum, f) => sum + f.value, 0);
    const negativeScore = coffee.negativeFlavors.reduce((sum, f) => sum + f.value, 0);
    
    if (positiveEl) {
      positiveEl.textContent = `+${positiveScore}`;
      positiveEl.className = 'coffee-stat-value positive';
    }
    
    if (negativeEl) {
      negativeEl.textContent = `-${negativeScore}`;
      negativeEl.className = 'coffee-stat-value negative';
    }
    
    if (scoreEl) {
      scoreEl.textContent = `${coffee.totalScore} (💰${coffee.basePrice})`;
      scoreEl.className = coffee.totalScore >= 10 ? 'coffee-stat-value gold' : 
                          coffee.totalScore >= 0 ? 'coffee-stat-value positive' : 
                          'coffee-stat-value negative';
    }
  }

  private addMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.messageHistory.push({ message, type, timestamp: Date.now() });
    
    if (this.messageHistory.length > this.maxMessages) {
      this.messageHistory = this.messageHistory.slice(-this.maxMessages);
    }

    this.renderMessageLog();
  }

  private renderMessageLog(): void {
    if (!this.messageLog) return;

    this.messageLog.innerHTML = '';

    this.messageHistory.slice(-20).forEach(({ message, type }) => {
      const msgEl = document.createElement('div');
      msgEl.className = `message ${type}`;
      msgEl.textContent = message;
      this.messageLog?.appendChild(msgEl);
    });

    this.messageLog.scrollTop = this.messageLog.scrollHeight;
  }

  public showTutorial(): void {
    gameVM.logMessage('🎮 欢迎来到 CoffeeHunter！', 'success');
    gameVM.logMessage('使用 ↑↓←→ 或 WASD 移动角色');
    gameVM.logMessage('使用 空格键 采集物品');
    gameVM.logMessage('按 H 键快速回家');
    gameVM.logMessage('在家中可以制作咖啡并售卖！');
  }
}

export const uiRenderer = UIRenderer.getInstance();
