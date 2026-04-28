import { Item, FinishedCoffee, FlavorProfile, CraftingStep, ProcessMethod } from '../models/types';
import { gameVM } from './GameViewModel';
import { cloneGameState, addItemToInventory, removeItemFromInventory, getFirstItemOfType, hasItemOfType, getItemCount } from '../models/gameState';
import { itemDatabase, roastProfiles, grindSettings, brewingMethods, processMethods, getItemById } from '../models/itemDatabase';
import { eventBus, GameEvents } from '../utils/eventBus';

export class CraftingViewModel {
  private static instance: CraftingViewModel;
  private selectedAdditives: string[] = [];

  private constructor() {}

  public static getInstance(): CraftingViewModel {
    if (!CraftingViewModel.instance) {
      CraftingViewModel.instance = new CraftingViewModel();
    }
    return CraftingViewModel.instance;
  }

  public get currentStep(): CraftingStep {
    return gameVM.currentCraftingStep;
  }

  public get currentCoffee(): FinishedCoffee | null {
    return gameVM.currentCoffee;
  }

  public get canCraft(): boolean {
    return gameVM.isPlayerAtHome;
  }

  public canPerformStep(step: CraftingStep): boolean {
    if (!this.canCraft) return false;

    const state = gameVM.state;
    switch (step) {
      case 'process_ready':
        return hasItemOfType(state, 'green_bean');
      case 'roast_ready':
        return hasItemOfType(state, 'green_bean');
      case 'grind_ready':
        return hasItemOfType(state, 'roasted_bean');
      case 'brew_ready':
        return hasItemOfType(state, 'coffee_powder');
      case 'blend_ready':
        return hasItemOfType(state, 'coffee_liquid');
      case 'coffee_ready':
        return gameVM.currentCoffee !== null;
      default:
        return false;
    }
  }

  public getProcessMethods(): ProcessMethod[] {
    return processMethods;
  }

  public getRoastProfiles() {
    return roastProfiles;
  }

  public getGrindSettings() {
    return grindSettings;
  }

  public getBrewingMethods() {
    return brewingMethods;
  }

  public getAvailableAdditives(): Item[] {
    const state = gameVM.state;
    const additives: Item[] = [];
    
    state.inventory.forEach(invItem => {
      if (invItem.item.type === 'fruit' || invItem.item.type === 'spice' || invItem.item.type === 'milk') {
        additives.push(invItem.item);
      }
    });
    
    return additives;
  }

  public selectAdditive(itemId: string, count: number = 1): boolean {
    const state = gameVM.state;
    const availableCount = getItemCount(state, itemId);
    
    if (availableCount < count) {
      gameVM.logMessage(`数量不足！需要 ${count} 个，但只有 ${availableCount} 个`, 'warning');
      return false;
    }

    const currentCount = this.selectedAdditives.filter(id => id === itemId).length;
    const maxAdditives = 3;
    
    if (currentCount + count > maxAdditives) {
      gameVM.logMessage('最多只能添加3种配料！', 'warning');
      return false;
    }

    for (let i = 0; i < count; i++) {
      this.selectedAdditives.push(itemId);
    }
    return true;
  }

  public removeAdditive(index: number): boolean {
    if (index >= 0 && index < this.selectedAdditives.length) {
      this.selectedAdditives.splice(index, 1);
      return true;
    }
    return false;
  }

  public getSelectedAdditivesWithCount(): Map<string, number> {
    const countMap = new Map<string, number>();
    this.selectedAdditives.forEach(id => {
      countMap.set(id, (countMap.get(id) || 0) + 1);
    });
    return countMap;
  }

  public getSelectedAdditives(): string[] {
    return [...this.selectedAdditives];
  }

  public clearSelectedAdditives(): void {
    this.selectedAdditives = [];
  }

  public processGreenBean(processMethodIndex: number = 0, count: number = 1): boolean {
    if (!this.canCraft) {
      gameVM.logMessage('需要回家才能预处理！', 'warning');
      return false;
    }

    const state = gameVM.state;
    const greenBeanItem = getFirstItemOfType(state, 'green_bean');
    
    if (!greenBeanItem) {
      gameVM.logMessage('没有生豆可以预处理！', 'warning');
      return false;
    }

    const availableCount = greenBeanItem.count;
    const actualCount = Math.min(count, availableCount);

    if (actualCount <= 0) {
      gameVM.logMessage('没有足够的生豆！', 'warning');
      return false;
    }

    const processMethod = processMethods[Math.min(processMethodIndex, processMethods.length - 1)];
    
    gameVM.updateState(s => {
      let newState = removeItemFromInventory(s, greenBeanItem.item.id, actualCount);
      newState = addItemToInventory(newState, greenBeanItem.item.id, actualCount);
      return newState;
    });

    gameVM.logMessage(`🔬 预处理完成！使用${processMethod.name}处理了 ${actualCount} 个 ${greenBeanItem.item.name}`, 'success');
    gameVM.logMessage(`   效果: ${processMethod.description}`, 'info');
    eventBus.emit(GameEvents.CRAFTING_STEP_COMPLETED, { step: 'process_ready', result: greenBeanItem.item.id, count: actualCount });
    
    return true;
  }

  public roastGreenBean(roastProfileIndex: number = 1, count: number = 1): boolean {
    if (!this.canCraft) {
      gameVM.logMessage('需要回家才能烘焙！', 'warning');
      return false;
    }

    const state = gameVM.state;
    const greenBeanItem = getFirstItemOfType(state, 'green_bean');
    
    if (!greenBeanItem) {
      gameVM.logMessage('没有生豆可以烘焙！', 'warning');
      return false;
    }

    const availableCount = greenBeanItem.count;
    const actualCount = Math.min(count, availableCount);

    if (actualCount <= 0) {
      gameVM.logMessage('没有足够的生豆！', 'warning');
      return false;
    }

    const roastProfile = roastProfiles[Math.min(roastProfileIndex, roastProfiles.length - 1)];
    
    let roastedBeanId: string;
    switch (roastProfileIndex) {
      case 0:
        roastedBeanId = 'roasted_light';
        break;
      case 2:
        roastedBeanId = 'roasted_dark';
        break;
      default:
        roastedBeanId = 'roasted_medium';
    }

    gameVM.updateState(s => {
      let newState = removeItemFromInventory(s, greenBeanItem.item.id, actualCount);
      newState = addItemToInventory(newState, roastedBeanId, actualCount);
      return newState;
    });

    const roastedBean = getItemById(roastedBeanId);
    
    gameVM.logMessage(`🔥 烘焙完成！使用${roastProfile.name}烘焙了 ${actualCount} 个 ${greenBeanItem.item.name} → ${roastedBean?.icon} ${roastedBean?.name}`, 'success');
    eventBus.emit(GameEvents.CRAFTING_STEP_COMPLETED, { step: 'roast_ready', result: roastedBean?.id, count: actualCount });
    
    return true;
  }

  public grindRoastedBean(grindSettingIndex: number = 1, count: number = 1): boolean {
    if (!this.canCraft) {
      gameVM.logMessage('需要回家才能研磨！', 'warning');
      return false;
    }

    const state = gameVM.state;
    const roastedBeanItem = getFirstItemOfType(state, 'roasted_bean');
    
    if (!roastedBeanItem) {
      gameVM.logMessage('没有熟豆可以研磨！', 'warning');
      return false;
    }

    const availableCount = roastedBeanItem.count;
    const actualCount = Math.min(count, availableCount);

    if (actualCount <= 0) {
      gameVM.logMessage('没有足够的熟豆！', 'warning');
      return false;
    }

    const grindSetting = grindSettings[Math.min(grindSettingIndex, grindSettings.length - 1)];
    
    let powderId: string;
    if (grindSettingIndex === 0) {
      powderId = 'coffee_powder_medium';
    } else {
      powderId = 'coffee_powder_fine';
    }

    gameVM.updateState(s => {
      let newState = removeItemFromInventory(s, roastedBeanItem.item.id, actualCount);
      newState = addItemToInventory(newState, powderId, actualCount);
      return newState;
    });

    const powder = getItemById(powderId);
    
    gameVM.logMessage(`⚙️ 研磨完成！使用${grindSetting.name}研磨了 ${actualCount} 个 ${roastedBeanItem.item.name} → ${powder?.icon} ${powder?.name}`, 'success');
    eventBus.emit(GameEvents.CRAFTING_STEP_COMPLETED, { step: 'grind_ready', result: powder?.id, count: actualCount });
    
    return true;
  }

  public brewCoffee(brewMethodIndex: number = 0, count: number = 1): boolean {
    if (!this.canCraft) {
      gameVM.logMessage('需要回家才能萃取！', 'warning');
      return false;
    }

    const state = gameVM.state;
    const powderItem = getFirstItemOfType(state, 'coffee_powder');
    
    if (!powderItem) {
      gameVM.logMessage('没有咖啡粉可以萃取！', 'warning');
      return false;
    }

    const availableCount = powderItem.count;
    const actualCount = Math.min(count, availableCount);

    if (actualCount <= 0) {
      gameVM.logMessage('没有足够的咖啡粉！', 'warning');
      return false;
    }

    const brewMethod = brewingMethods[Math.min(brewMethodIndex, brewingMethods.length - 1)];
    
    let liquidId: string;
    if (brewMethodIndex === 1) {
      liquidId = 'coffee_liquid_pour_over';
    } else {
      liquidId = 'coffee_liquid_espresso';
    }

    gameVM.updateState(s => {
      let newState = removeItemFromInventory(s, powderItem.item.id, actualCount);
      newState = addItemToInventory(newState, liquidId, actualCount);
      return newState;
    });

    const liquid = getItemById(liquidId);
    
    gameVM.logMessage(`💧 萃取完成！使用${brewMethod.name}萃取了 ${actualCount} 个 ${powderItem.item.name} → ${liquid?.icon} ${liquid?.name}`, 'success');
    eventBus.emit(GameEvents.CRAFTING_STEP_COMPLETED, { step: 'brew_ready', result: liquid?.id, count: actualCount });
    
    return true;
  }

  public createFinishedCoffee(): boolean {
    if (!this.canCraft) {
      gameVM.logMessage('需要回家才能制作咖啡！', 'warning');
      return false;
    }

    const state = gameVM.state;
    const liquidItem = getFirstItemOfType(state, 'coffee_liquid');
    
    if (!liquidItem) {
      gameVM.logMessage('没有咖啡液可以调和！', 'warning');
      return false;
    }

    const ingredients: Item[] = [liquidItem.item];
    const usedAdditives: Item[] = [];

    for (const additiveId of this.selectedAdditives) {
      const additive = getItemById(additiveId);
      if (additive) {
        const count = state.inventory.find(i => i.item.id === additiveId)?.count || 0;
        if (count > 0) {
          usedAdditives.push(additive);
          ingredients.push(additive);
        }
      }
    }

    const allFlavors: FlavorProfile[] = [];
    ingredients.forEach(item => {
      item.flavors.forEach(flavor => {
        const existing = allFlavors.find(f => f.name === flavor.name);
        if (existing) {
          existing.value += flavor.value;
        } else {
          allFlavors.push({ ...flavor });
        }
      });
    });

    const positiveFlavors = allFlavors.filter(f => f.isPositive);
    const negativeFlavors = allFlavors.filter(f => !f.isPositive);

    const positiveScore = positiveFlavors.reduce((sum, f) => sum + f.value, 0);
    const negativeScore = negativeFlavors.reduce((sum, f) => sum + f.value, 0);
    const totalScore = positiveScore - negativeScore;

    const basePrice = Math.max(10, liquidItem.item.baseValue + ingredients.slice(1).reduce((sum, i) => sum + i.baseValue * 0.5, 0));
    const finalPrice = Math.floor(basePrice * (1 + totalScore * 0.1));

    const coffeeName = this.generateCoffeeName(ingredients, totalScore);
    const coffeeDesc = this.generateCoffeeDescription(positiveFlavors, negativeFlavors);

    const finishedCoffee: FinishedCoffee = {
      name: coffeeName,
      description: coffeeDesc,
      positiveFlavors,
      negativeFlavors,
      totalScore,
      basePrice: finalPrice,
      ingredients: ingredients.map(i => i.id)
    };

    gameVM.updateState(s => {
      let newState = removeItemFromInventory(s, liquidItem.item.id, 1);
      
      for (const additive of usedAdditives) {
        newState = removeItemFromInventory(newState, additive.id, 1);
      }
      
      const newStateCopy = cloneGameState(newState);
      newStateCopy.currentCoffee = finishedCoffee;
      return newStateCopy;
    });

    this.clearSelectedAdditives();
    
    gameVM.logMessage(`☕ 咖啡制作完成！${finishedCoffee.name} - 评分: ${totalScore}`, 'success');
    eventBus.emit(GameEvents.COFFEE_CREATED, finishedCoffee);
    
    return true;
  }

  private generateCoffeeName(ingredients: Item[], score: number): string {
    const baseNames = ['浓缩', '拿铁', '美式', '卡布奇诺', '摩卡', '玛奇朵', '冷萃'];
    const qualityPrefix = score >= 15 ? '精品' : score >= 10 ? '优质' : score >= 5 ? '普通' : '家常';
    
    const additives = ingredients.filter(i => i.type !== 'coffee_liquid');
    let additiveName = '';
    
    if (additives.length > 0) {
      const firstAdditive = additives[0];
      if (firstAdditive.type === 'milk') {
        additiveName = firstAdditive.name.includes('燕麦') ? '燕麦' : 
                       firstAdditive.name.includes('豆浆') ? '豆香' : '奶香';
      } else if (firstAdditive.type === 'fruit') {
        if (firstAdditive.name.includes('香草')) additiveName = '香草';
        else if (firstAdditive.name.includes('橙')) additiveName = '香橙';
        else if (firstAdditive.name.includes('莓')) additiveName = '莓果';
        else if (firstAdditive.name.includes('椰子')) additiveName = '椰香';
      } else if (firstAdditive.type === 'spice') {
        if (firstAdditive.name.includes('肉桂')) additiveName = '肉桂';
        else if (firstAdditive.name.includes('豆蔻')) additiveName = '香料';
        else if (firstAdditive.name.includes('丁香')) additiveName = '辛香';
      }
    }

    const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
    
    if (additiveName) {
      return `${qualityPrefix}${additiveName}${baseName}`;
    }
    return `${qualityPrefix}${baseName}`;
  }

  private generateCoffeeDescription(positive: FlavorProfile[], negative: FlavorProfile[]): string {
    const flavorNames: Record<string, string> = {
      fruity: '果香',
      floral: '花香',
      sweet: '甜感',
      nutty: '坚果',
      chocolate: '巧克力',
      spicy: '香料',
      sour: '酸感',
      bitter: '苦味',
      burnt: '焦味',
      watery: '淡味'
    };

    const positiveDesc = positive
      .filter(f => f.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(f => `${flavorNames[f.name]}(${f.value})`)
      .join('、');

    const negativeDesc = negative
      .filter(f => f.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(f => `${flavorNames[f.name]}(${f.value})`)
      .join('、');

    let desc = '这是一杯';
    if (positiveDesc) {
      desc += `带有${positiveDesc}的咖啡`;
    } else {
      desc += '风味平淡的咖啡';
    }
    
    if (negativeDesc) {
      desc += `，但也有${negativeDesc}等缺点`;
    }
    
    return desc + '。';
  }

  public sellCurrentCoffee(): boolean {
    if (!gameVM.currentCoffee) {
      gameVM.logMessage('没有可售卖的咖啡！', 'warning');
      return false;
    }

    const coffee = gameVM.currentCoffee;
    const reputationGain = Math.floor(coffee.totalScore / 2);
    const reputationLoss = coffee.totalScore < 0 ? Math.abs(coffee.totalScore) : 0;

    let feedback = '';
    if (coffee.totalScore >= 15) {
      feedback = '客人非常满意！';
    } else if (coffee.totalScore >= 10) {
      feedback = '客人评价不错！';
    } else if (coffee.totalScore >= 5) {
      feedback = '客人觉得一般。';
    } else if (coffee.totalScore >= 0) {
      feedback = '客人不太喜欢...';
    } else {
      feedback = '客人非常不满！';
    }

    gameVM.updateState(s => {
      const newState = cloneGameState(s);
      newState.gold += coffee.basePrice;
      newState.reputation += Math.max(0, reputationGain - reputationLoss);
      newState.currentCoffee = null;
      return newState;
    });

    gameVM.logMessage(`💰 售出 ${coffee.name}！获得 ${coffee.basePrice} 金币，${feedback}`, 'success');
    eventBus.emit(GameEvents.COFFEE_SOLD, { coffee, price: coffee.basePrice });

    return true;
  }

  public clearCurrentCoffee(): void {
    gameVM.updateState(s => {
      const newState = cloneGameState(s);
      newState.currentCoffee = null;
      return newState;
    });
    this.clearSelectedAdditives();
  }
}

export const craftingVM = CraftingViewModel.getInstance();
