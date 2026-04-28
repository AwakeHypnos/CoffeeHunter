// ============================================
// CoffeeHunter 游戏主逻辑 v2
// 改进：保留每道工序的标签，不同原料产生不同产物
// ============================================

const Game = {
  state: {
    gold: 100,
    reputation: 0,
    day: 1,
    inventory: [],
    coffeeStock: [],
    selectedMap: null,
    currentScene: 'main-menu',
    tools: {
      highTempRoaster: false,
      espressoMachine: false,
      fineGrinder: false,
      advancedGrinder: false
    },
    exploredToday: false,
    discovered: {
      forest: { items: new Set(), dangers: new Set() },
      mountain: { items: new Set(), dangers: new Set() },
      volcano: { items: new Set(), dangers: new Set() }
    }
  },
  
  exploreState: {
    map: [],
    playerPos: { x: 0, y: 0 },
    mapWidth: 17,
    mapHeight: 13,
    exitPoints: [],
    dangerPoints: [],
    revealedCells: new Set(),
    collectedItems: 0
  },
  
  craftState: {
    roastItem: null,
    roastLevel: null,
    grindItem: null,
    grindLevel: null,
    brewItem: null,
    brewMethod: null,
    blendItem: null,
    additives: [],
    currentStep: 0,
    finishedCoffee: null
  },
  
  shopState: {
    customers: [],
    selectedCustomer: null,
    selectedCoffee: null,
    soldToday: 0,
    incomeToday: 0
  },
  
  messages: [],
  selectedWorkshopItem: null,

  // ============================================
  // 物品定义（原料）
  // ============================================
  
  baseItems: {
    green_colombian: {
      id: 'green_colombian',
      name: '哥伦比亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '哥伦比亚产的平衡生豆，甜感和坚果味突出',
      origin: '哥伦比亚',
      tags: ['甜感', '坚果', '巧克力', '哥伦比亚'],
      rarity: 'common'
    },
    green_ethiopian: {
      id: 'green_ethiopian',
      name: '埃塞俄比亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '来自埃塞俄比亚的优质生豆，带有明显的果香和花香',
      origin: '埃塞俄比亚',
      tags: ['果香', '花香', '埃塞俄比亚'],
      rarity: 'uncommon'
    },
    green_kenyan: {
      id: 'green_kenyan',
      name: '肯尼亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '肯尼亚产的特色生豆，明亮的酸感和黑醋栗风味',
      origin: '肯尼亚',
      tags: ['果香', '酸感', '肯尼亚', '特色'],
      rarity: 'rare'
    },
    green_brazilian: {
      id: 'green_brazilian',
      name: '巴西生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '巴西产的基础生豆，适合做意式拼配',
      origin: '巴西',
      tags: ['坚果', '巧克力', '巴西', '苦味'],
      rarity: 'common'
    },
    
    milk_whole: {
      id: 'milk_whole',
      name: '全脂牛奶',
      type: 'additive',
      icon: '🥛',
      description: '新鲜全脂牛奶，增添丝滑口感',
      tags: ['奶香', '顺滑', '甜感'],
      rarity: 'common'
    },
    milk_oat: {
      id: 'milk_oat',
      name: '燕麦奶',
      type: 'additive',
      icon: '🌾',
      description: '顺滑燕麦奶，咖啡的完美搭档',
      tags: ['谷物', '健康', '甜感'],
      rarity: 'uncommon'
    },
    fruit_vanilla: {
      id: 'fruit_vanilla',
      name: '香草荚',
      type: 'additive',
      icon: '🌿',
      description: '马达加斯加香草荚，增添甜美香气',
      tags: ['香草', '甜感', '花香'],
      rarity: 'uncommon'
    },
    fruit_orange: {
      id: 'fruit_orange',
      name: '橙皮',
      type: 'additive',
      icon: '🍊',
      description: '新鲜橙皮，增添明亮的柑橘风味',
      tags: ['果香', '柑橘', '酸甜'],
      rarity: 'common'
    },
    fruit_berry: {
      id: 'fruit_berry',
      name: '混合浆果',
      type: 'additive',
      icon: '🫐',
      description: '新鲜蓝莓和覆盆子的混合物',
      tags: ['果香', '酸甜', '花香'],
      rarity: 'uncommon'
    },
    spice_cinnamon: {
      id: 'spice_cinnamon',
      name: '肉桂棒',
      type: 'additive',
      icon: '🌰',
      description: '锡兰肉桂棒，温暖的辛香料',
      tags: ['香料', '温暖', '甜感'],
      rarity: 'common'
    },
    spice_cardamom: {
      id: 'spice_cardamom',
      name: '小豆蔻',
      type: 'additive',
      icon: '🫛',
      description: '印度小豆蔻，独特的香料风味',
      tags: ['香料', '特色', '花香'],
      rarity: 'rare'
    }
  },

  // ============================================
  // 烘焙程度定义
  // ============================================
  
  roastLevels: [
    {
      id: 'light',
      name: '浅度烘焙',
      icon: '🟤',
      description: '保留更多原始风味，酸感明显',
      tags: ['浅烘', '酸感', '花香'],
      removeTags: ['苦味', '焦味'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2, '酸感': 1.1 }
    },
    {
      id: 'medium',
      name: '中度烘焙',
      icon: '🟫',
      description: '平衡的酸苦感，适合大多数人',
      tags: ['中烘', '甜感', '平衡'],
      removeTags: [],
      tagMultiplier: { '甜感': 1.2, '坚果': 1.1 }
    },
    {
      id: 'dark',
      name: '深度烘焙',
      icon: '⬛',
      description: '浓郁的苦味和焦香，适合意式',
      tags: ['深烘', '苦味', '焦味'],
      removeTags: ['果香', '花香', '酸感'],
      tagMultiplier: { '巧克力': 1.4, '坚果': 1.2, '苦味': 1.5 },
      requiredTool: 'highTempRoaster'
    }
  ],

  // ============================================
  // 研磨粗细定义
  // ============================================
  
  grindLevels: [
    {
      id: 'extra_coarse',
      name: '极粗研磨',
      icon: '🫘',
      description: '适合冷萃、法压壶',
      tags: ['极粗磨', '果香', '花香'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2 },
      requiredTool: 'advancedGrinder'
    },
    {
      id: 'coarse',
      name: '粗研磨',
      icon: '🫘',
      description: '适合法式压滤壶、冷萃',
      tags: ['粗磨', '果香', '花香'],
      tagMultiplier: { '果香': 1.2, '花香': 1.1 }
    },
    {
      id: 'medium',
      name: '中研磨',
      icon: '🥣',
      description: '适合手冲、滴滤、爱乐压',
      tags: ['中磨', '甜感', '平衡'],
      tagMultiplier: { '甜感': 1.1 }
    },
    {
      id: 'fine',
      name: '细研磨',
      icon: '⚪',
      description: '适合意式浓缩、摩卡壶',
      tags: ['细磨', '巧克力', '苦味'],
      tagMultiplier: { '巧克力': 1.3, '苦味': 1.3 },
      requiredTool: 'fineGrinder'
    },
    {
      id: 'extra_fine',
      name: '极细研磨',
      icon: '⚪',
      description: '适合土耳其咖啡',
      tags: ['极细磨', '浓郁', '苦味'],
      tagMultiplier: { '巧克力': 1.5, '苦味': 1.5 },
      requiredTool: 'advancedGrinder'
    }
  ],

  // ============================================
  // 萃取方式定义
  // ============================================
  
  brewMethods: [
    {
      id: 'espresso',
      name: '意式浓缩',
      icon: '☕',
      description: '高压快速萃取，浓郁醇厚',
      tags: ['意式', '浓郁', '巧克力', '坚果'],
      tagMultiplier: { '巧克力': 1.3, '坚果': 1.2, '苦味': 1.2 },
      requiredTool: 'espressoMachine'
    },
    {
      id: 'pour_over',
      name: '手冲',
      icon: '☕',
      description: '逐层注水，风味清晰',
      tags: ['手冲', '清晰', '果香', '花香'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2, '酸感': 1.1 }
    },
    {
      id: 'cold_brew',
      name: '冷萃',
      icon: '🧊',
      description: '低温长时间浸泡，低酸顺滑',
      tags: ['冷萃', '顺滑', '甜感', '低酸'],
      tagMultiplier: { '甜感': 1.3, '顺滑': 1.2, '酸感': 0.5 }
    }
  ],

  // ============================================
  // 地图数据
  // ============================================
  
  maps: [
    {
      id: 'forest',
      name: '神秘森林',
      icon: '🌲',
      difficulty: 'easy',
      description: '一片宁静的森林，适合新手探索。这里生长着各种优质咖啡豆。',
      tags: ['新手友好', '咖啡豆丰富', '危险低'],
      rewards: { gold: 50, reputation: 10 },
      itemWeights: {
        green_colombian: 35,
        green_ethiopian: 20,
        green_brazilian: 25,
        fruit_orange: 10,
        spice_cinnamon: 10
      },
      dangerLevel: 1
    },
    {
      id: 'mountain',
      name: '云雾山脉',
      icon: '⛰️',
      difficulty: 'medium',
      description: '高海拔地区，孕育着精品咖啡豆。但山路崎岖，需要小心野生动物。',
      tags: ['高海拔', '精品豆', '中等危险'],
      rewards: { gold: 100, reputation: 25 },
      itemWeights: {
        green_ethiopian: 30,
        green_kenyan: 25,
        green_colombian: 20,
        fruit_berry: 15,
        fruit_vanilla: 10
      },
      dangerLevel: 2
    },
    {
      id: 'volcano',
      name: '火山地带',
      icon: '🌋',
      difficulty: 'hard',
      description: '火山灰土壤孕育着传说中的极品咖啡豆。但危险四伏，野生动物出没频繁。',
      tags: ['极品豆', '高风险高回报', '危险高'],
      rewards: { gold: 200, reputation: 50 },
      itemWeights: {
        green_kenyan: 35,
        green_ethiopian: 25,
        spice_cardamom: 20,
        fruit_vanilla: 10,
        milk_oat: 10
      },
      dangerLevel: 3
    }
  ],

  // ============================================
  // 工具商店数据
  // ============================================
  
  toolsShop: {
    highTempRoaster: {
      id: 'highTempRoaster',
      name: '高温烘焙机',
      icon: '🔥',
      description: '可进行深度烘焙，释放咖啡豆的浓郁风味',
      price: 200,
      unlocks: ['深度烘焙'],
      unlocked: false
    },
    espressoMachine: {
      id: 'espressoMachine',
      name: '意式浓缩机',
      icon: '☕',
      description: '高压快速萃取，制作浓郁的意式浓缩',
      price: 300,
      unlocks: ['意式浓缩'],
      unlocked: false
    },
    fineGrinder: {
      id: 'fineGrinder',
      name: '细研磨机',
      icon: '⚙️',
      description: '可进行细研磨，适合意式浓缩和摩卡壶',
      price: 150,
      unlocks: ['细研磨'],
      unlocked: false
    },
    advancedGrinder: {
      id: 'advancedGrinder',
      name: '高级研磨机',
      icon: '🔧',
      description: '专业级研磨机，支持极细和极粗研磨',
      price: 400,
      unlocks: ['极细研磨', '极粗研磨'],
      unlocked: false
    }
  },

  // ============================================
  // 客人数据
  // ============================================
  
  customerTemplates: [
    {
      name: '咖啡爱好者小明',
      avatar: '👨',
      type: '爱好者',
      demands: [
        { tag: '果香', required: true },
        { tag: '花香', required: false }
      ],
      basePrice: 50,
      reputation: 10
    },
    {
      name: '上班族小红',
      avatar: '👩',
      type: '上班族',
      demands: [
        { tag: '巧克力', required: true },
        { tag: '坚果', required: true }
      ],
      basePrice: 60,
      reputation: 15
    },
    {
      name: '退休老王',
      avatar: '👴',
      type: '传统派',
      demands: [
        { tag: '巧克力', required: true },
        { tag: '苦味', required: false }
      ],
      basePrice: 45,
      reputation: 8
    },
    {
      name: '时尚博主',
      avatar: '👱‍♀️',
      type: '潮流派',
      demands: [
        { tag: '果香', required: true },
        { tag: '花香', required: true },
        { tag: '特色', required: false }
      ],
      basePrice: 80,
      reputation: 20
    },
    {
      name: '健身教练',
      avatar: '💪',
      type: '健康派',
      demands: [
        { tag: '健康', required: true },
        { tag: '谷物', required: false }
      ],
      basePrice: 55,
      reputation: 12
    },
    {
      name: '甜品控',
      avatar: '🧁',
      type: '甜党',
      demands: [
        { tag: '甜感', required: true },
        { tag: '香草', required: true },
        { tag: '奶香', required: false }
      ],
      basePrice: 70,
      reputation: 18
    },
    {
      name: '探险家',
      avatar: '🧭',
      type: '冒险家',
      demands: [
        { tag: '特色', required: true },
        { tag: '香料', required: true }
      ],
      basePrice: 75,
      reputation: 25
    },
    {
      name: '意式迷',
      avatar: '🇮🇹',
      type: '意式爱好者',
      demands: [
        { tag: '意式', required: true },
        { tag: '浓郁', required: false }
      ],
      basePrice: 65,
      reputation: 16
    },
    {
      name: '手冲达人',
      avatar: '☕',
      type: '手冲爱好者',
      demands: [
        { tag: '手冲', required: true },
        { tag: '清晰', required: false }
      ],
      basePrice: 70,
      reputation: 14
    }
  ],

  // ============================================
  // 动态物品创建函数
  // ============================================
  
  createRoastedBean(greenBean, roastLevel) {
    const roast = this.roastLevels.find(r => r.id === roastLevel) || this.roastLevels[1];
    
    let tags = [...greenBean.tags];
    
    roast.removeTags.forEach(rt => {
      tags = tags.filter(t => t !== rt);
    });
    
    roast.tags.forEach(rt => {
      if (!tags.includes(rt)) {
        tags.push(rt);
      }
    });
    
    if (greenBean.origin && !tags.includes(greenBean.origin)) {
      tags.push(greenBean.origin);
    }
    
    return {
      id: `roasted_${greenBean.id}_${roastLevel}_${Date.now()}`,
      baseId: greenBean.id,
      name: `${roast.name} ${greenBean.name.replace('生豆', '')}`,
      type: 'roasted_bean',
      icon: roast.icon,
      description: `使用${roast.name}烘焙的${greenBean.name}`,
      origin: greenBean.origin,
      roastLevel: roastLevel,
      tags: tags,
      baseGreenBean: greenBean,
      roastInfo: roast
    };
  },

  createCoffeePowder(roastedBean, grindLevel) {
    const grind = this.grindLevels.find(g => g.id === grindLevel) || this.grindLevels[1];
    
    let tags = [...roastedBean.tags];
    
    grind.tags.forEach(gt => {
      if (!tags.includes(gt)) {
        tags.push(gt);
      }
    });
    
    return {
      id: `powder_${roastedBean.id}_${grindLevel}_${Date.now()}`,
      baseId: roastedBean.id,
      name: `${grind.name} ${roastedBean.name.replace('烘焙', '')}粉`,
      type: 'coffee_powder',
      icon: grind.icon,
      description: `使用${grind.name}研磨的${roastedBean.name}`,
      origin: roastedBean.origin,
      roastLevel: roastedBean.roastLevel,
      grindLevel: grindLevel,
      tags: tags,
      baseRoastedBean: roastedBean,
      grindInfo: grind
    };
  },

  createCoffeeLiquid(powder, brewMethod) {
    const brew = this.brewMethods.find(b => b.id === brewMethod) || this.brewMethods[1];
    
    let tags = [...powder.tags];
    
    brew.tags.forEach(bt => {
      if (!tags.includes(bt)) {
        tags.push(bt);
      }
    });
    
    return {
      id: `liquid_${powder.id}_${brewMethod}_${Date.now()}`,
      baseId: powder.id,
      name: `${brew.name} ${powder.name.replace('粉', '')}`,
      type: 'coffee_liquid',
      icon: brew.icon,
      description: `使用${brew.name}方式萃取的咖啡液`,
      origin: powder.origin,
      roastLevel: powder.roastLevel,
      grindLevel: powder.grindLevel,
      brewMethod: brewMethod,
      tags: tags,
      basePowder: powder,
      brewInfo: brew
    };
  },

  createFinishedCoffee(coffeeLiquid, additives) {
    const allTags = [...coffeeLiquid.tags];
    
    additives.forEach(additive => {
      additive.tags.forEach(t => {
        if (!allTags.includes(t)) {
          allTags.push(t);
        }
      });
    });
    
    const name = this.generateCoffeeName(coffeeLiquid, additives, allTags);
    
    const baseScore = 5;
    const roastBonus = coffeeLiquid.roastLevel === 'medium' ? 2 : 0;
    const additiveBonus = additives.length * 2;
    const originBonus = coffeeLiquid.origin ? 1 : 0;
    const specialTagBonus = allTags.includes('特色') ? 3 : 0;
    
    const score = baseScore + roastBonus + additiveBonus + originBonus + specialTagBonus + Math.floor(Math.random() * 5);
    
    const basePrice = 30 + score * 5;
    
    return {
      id: `coffee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      tags: allTags,
      score: score,
      price: basePrice,
      origin: coffeeLiquid.origin,
      roastLevel: coffeeLiquid.roastLevel,
      grindLevel: coffeeLiquid.grindLevel,
      brewMethod: coffeeLiquid.brewMethod,
      baseLiquid: coffeeLiquid,
      additives: [...additives],
      description: this.generateCoffeeDescription(coffeeLiquid, additives, allTags)
    };
  },

  generateCoffeeName(coffeeLiquid, additives, tags) {
    let prefix = '';
    let middle = '';
    let suffix = '';
    
    if (tags.includes('浅烘')) {
      prefix = '浅烘';
    } else if (tags.includes('深烘')) {
      prefix = '深烘';
    } else {
      prefix = '中烘';
    }
    
    if (coffeeLiquid.origin) {
      middle = coffeeLiquid.origin;
    }
    
    if (additives.length > 0) {
      const firstAdditive = additives[0];
      if (firstAdditive.tags.includes('香草')) {
        suffix = '香草';
      } else if (firstAdditive.tags.includes('奶香')) {
        suffix = '拿铁';
      } else if (firstAdditive.tags.includes('谷物')) {
        suffix = '燕麦特调';
      } else if (firstAdditive.tags.includes('香料')) {
        suffix = '香料特调';
      } else if (firstAdditive.tags.includes('果香')) {
        suffix = '果味特调';
      }
    }
    
    if (tags.includes('意式')) {
      if (!suffix) suffix = '浓缩';
    } else if (tags.includes('手冲')) {
      if (!suffix) suffix = '手冲';
    } else if (tags.includes('冷萃')) {
      if (!suffix) suffix = '冷萃';
    }
    
    if (!suffix) {
      const defaultNames = ['黑咖啡', '美式', '特调'];
      suffix = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    }
    
    if (middle) {
      return `${prefix}${middle}${suffix}`;
    }
    return `${prefix}${suffix}`;
  },

  generateCoffeeDescription(coffeeLiquid, additives, tags) {
    const parts = [];
    
    if (coffeeLiquid.origin) {
      parts.push(`源自${coffeeLiquid.origin}`);
    }
    
    if (coffeeLiquid.roastLevel === 'light') {
      parts.push('浅度烘焙');
    } else if (coffeeLiquid.roastLevel === 'dark') {
      parts.push('深度烘焙');
    } else {
      parts.push('中度烘焙');
    }
    
    if (coffeeLiquid.brewMethod === 'espresso') {
      parts.push('意式萃取');
    } else if (coffeeLiquid.brewMethod === 'cold_brew') {
      parts.push('冷萃工艺');
    } else {
      parts.push('手冲萃取');
    }
    
    if (additives.length > 0) {
      parts.push(`添加了${additives.length}种配料`);
    }
    
    const positiveTags = tags.filter(t => 
      ['果香', '花香', '甜感', '坚果', '巧克力', '香草', '奶香', '特色', '平衡', '清晰', '浓郁'].includes(t)
    );
    if (positiveTags.length > 0) {
      parts.push(`带有${positiveTags.slice(0, 3).join('、')}风味`);
    }
    
    return parts.join('，') + '。';
  },

  // ============================================
  // 工具函数
  // ============================================
  
  addMessage(text, type = 'info') {
    this.messages.push({ text, type, time: Date.now() });
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.renderMessages();
  },
  
  renderMessages() {
    const containers = ['explore-messages', 'workshop-messages'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '';
      this.messages.slice(-15).forEach(msg => {
        const el = document.createElement('div');
        el.className = `message ${msg.type}`;
        el.textContent = msg.text;
        container.appendChild(el);
      });
      container.scrollTop = container.scrollHeight;
    });
  },
  
  getRandomItem(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [itemId, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return this.baseItems[itemId];
      }
    }
    
    const firstId = Object.keys(weights)[0];
    return this.baseItems[firstId];
  },

  // ============================================
  // 场景管理
  // ============================================
  
  showScene(sceneId) {
    const scenes = ['main-menu', 'map-select-scene', 'explore-scene', 'workshop-scene', 'shop-scene'];
    scenes.forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    
    const targetScene = document.getElementById(sceneId);
    if (targetScene) {
      targetScene.classList.remove('hidden');
      targetScene.classList.add('fade-in');
    }
    
    this.state.currentScene = sceneId;
    this.updateSceneUI(sceneId);
  },
  
  updateSceneUI(sceneId) {
    switch (sceneId) {
      case 'map-select-scene':
        this.renderMapCards();
        this.updateMenuStats();
        break;
      case 'explore-scene':
        this.renderExploreMap();
        this.renderExploreInventory();
        break;
      case 'workshop-scene':
        this.renderWorkshopInventory();
        this.renderCoffeeInventory();
        this.updateWorkshopStats();
        break;
      case 'shop-scene':
        this.generateCustomers();
        this.renderShopCoffeeInventory();
        this.updateShopStats();
        break;
    }
  },

  // ============================================
  // 主菜单
  // ============================================
  
  startNewGame() {
    this.state = {
      gold: 100,
      reputation: 0,
      day: 1,
      inventory: [
        { item: { ...this.baseItems.green_colombian }, count: 3 },
        { item: { ...this.baseItems.milk_whole }, count: 2 },
        { item: { ...this.baseItems.spice_cinnamon }, count: 1 }
      ],
      coffeeStock: [],
      selectedMap: null,
      currentScene: 'main-menu',
      tools: {
        highTempRoaster: false,
        espressoMachine: false,
        fineGrinder: false,
        advancedGrinder: false
      },
      exploredToday: false,
      discovered: {
        forest: { items: new Set(), dangers: new Set() },
        mountain: { items: new Set(), dangers: new Set() },
        volcano: { items: new Set(), dangers: new Set() }
      }
    };
    
    this.craftState = {
      roastItem: null,
      roastLevel: null,
      grindItem: null,
      grindLevel: null,
      brewItem: null,
      brewMethod: null,
      blendItem: null,
      additives: [],
      currentStep: 0,
      finishedCoffee: null
    };
    
    this.shopState = { customers: [], selectedCustomer: null, selectedCoffee: null, soldToday: 0, incomeToday: 0 };
    this.messages = [];
    
    this.addMessage('🎮 欢迎来到 CoffeeHunter！', 'success');
    this.addMessage('选择一个地区开始你的咖啡探索之旅！');
    
    this.showScene('map-select-scene');
  },
  
  showHelp() {
    alert(`CoffeeHunter 游戏说明 v2.0\n\n` +
          `【游戏流程】\n` +
          `1. 地图选择：选择不同难度的地区探索\n` +
          `2. 探索：使用方向键或WASD移动，采集咖啡豆和材料\n` +
          `3. 制作：在工坊烘焙→研磨→萃取→调和咖啡\n` +
          `4. 售卖：在商店卖给客人，匹配需求获得更多金币\n\n` +
          `【制作系统改进】\n` +
          `• 不同生豆烘焙后保留原有标签（哥伦比亚/埃塞俄比亚等）\n` +
          `• 烘焙程度影响标签（浅烘/中烘/深烘）\n` +
          `• 研磨粗细影响标签（粗磨/中磨/细磨）\n` +
          `• 萃取方式影响标签（意式/手冲/冷萃）\n` +
          `• 最终咖啡名称根据原料和工艺动态生成\n\n` +
          `【操作】\n` +
          `↑↓←→ / WASD：移动\n` +
          `空格键：采集\n` +
          `点击物品选择，点击装置槽位放入`);
  },

  // ============================================
  // 地图选择
  // ============================================
  
  renderMapCards() {
    const container = document.getElementById('map-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.maps.forEach(map => {
      const card = document.createElement('div');
      card.className = `map-card ${this.state.selectedMap?.id === map.id ? 'selected' : ''}`;
      
      const difficultyClass = map.difficulty === 'easy' ? 'easy' : 
                              map.difficulty === 'medium' ? 'medium' : 'hard';
      const difficultyText = map.difficulty === 'easy' ? '简单' : 
                             map.difficulty === 'medium' ? '中等' : '困难';
      
      const knownItems = [];
      const unknownItems = [];
      const mapDiscovered = this.state.discovered[map.id] || { items: new Set(), dangers: new Set() };
      Object.keys(map.itemWeights).forEach(itemId => {
        const item = this.baseItems[itemId];
        if (item) {
          if (mapDiscovered.items.has(itemId)) {
            knownItems.push(item);
          } else {
            unknownItems.push(item);
          }
        }
      });
      
      const dangerTypes = [];
      if (map.dangerLevel >= 1) dangerTypes.push('野生动物出没');
      if (map.dangerLevel >= 2) dangerTypes.push('地形复杂');
      if (map.dangerLevel >= 3) dangerTypes.push('恶劣天气');
      
      const knownDangers = dangerTypes.filter(d => mapDiscovered.dangers.has(d));
      const unknownDangerCount = dangerTypes.length - knownDangers.length;
      
      card.innerHTML = `
        <div class="map-card-header">
          <div class="map-card-name">${map.icon} ${map.name}</div>
          <div class="map-card-difficulty ${difficultyClass}">${difficultyText}</div>
        </div>
        <div class="map-card-desc">${map.description}</div>
        <div class="map-card-tags">
          ${map.tags.map(tag => `<span class="map-tag">${tag}</span>`).join('')}
        </div>
        <div class="map-card-discoveries">
          <div class="discovery-section">
            <div class="discovery-label">🎒 已知素材:</div>
            <div class="discovery-items">
              ${knownItems.length > 0 ? 
                knownItems.map(item => `<span class="discovery-item known" title="${item.name}">${item.icon}</span>`).join('') :
                '<span class="discovery-none">暂未发现</span>'
              }
              ${unknownItems.length > 0 ? `<span class="discovery-unknown">+${unknownItems.length}种未知</span>` : ''}
            </div>
          </div>
          ${dangerTypes.length > 0 ? `
          <div class="discovery-section">
            <div class="discovery-label">⚠️ 已知危险:</div>
            <div class="discovery-items">
              ${knownDangers.length > 0 ? 
                knownDangers.map(d => `<span class="discovery-item danger">${d}</span>`).join('') :
                '<span class="discovery-none">暂未发现</span>'
              }
              ${unknownDangerCount > 0 ? `<span class="discovery-unknown">+${unknownDangerCount}种未知</span>` : ''}
            </div>
          </div>
          ` : ''}
        </div>
      `;
      
      card.onclick = () => this.selectMap(map);
      container.appendChild(card);
    });
  },
  
  selectMap(map) {
    this.state.selectedMap = map;
    this.renderMapCards();
    
    const btn = document.getElementById('start-explore-btn');
    if (btn) btn.disabled = false;
    
    this.addMessage(`📋 选择了探索地区: ${map.icon} ${map.name}`);
  },
  
  updateMenuStats() {
    const goldEl = document.getElementById('menu-gold');
    const repEl = document.getElementById('menu-reputation');
    const dayEl = document.getElementById('menu-day');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
    if (dayEl) dayEl.textContent = this.state.day;
  },

  skipExploration() {
    this.state.exploredToday = true;
    this.addMessage('⏭️ 跳过今天的探索，直接进入工坊。');
    this.addMessage('使用背包中已有的材料制作咖啡吧！');
    this.showScene('workshop-scene');
  },

  // ============================================
  // 工具商店系统
  // ============================================
  
  showToolShop() {
    this.renderToolShop();
    const toolShopModal = document.getElementById('tool-shop-modal');
    if (toolShopModal) {
      toolShopModal.classList.remove('hidden');
    }
  },
  
  hideToolShop() {
    const toolShopModal = document.getElementById('tool-shop-modal');
    if (toolShopModal) {
      toolShopModal.classList.add('hidden');
    }
  },
  
  renderToolShop() {
    const container = document.getElementById('tool-shop-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(this.toolsShop).forEach(tool => {
      const isUnlocked = this.state.tools[tool.id];
      const canAfford = this.state.gold >= tool.price;
      
      const toolCard = document.createElement('div');
      toolCard.className = `tool-card ${isUnlocked ? 'unlocked' : ''}`;
      
      toolCard.innerHTML = `
        <div class="tool-card-header">
          <div class="tool-card-icon">${tool.icon}</div>
          <div class="tool-card-info">
            <div class="tool-card-name">${tool.name}</div>
            <div class="tool-card-price">
              ${isUnlocked ? '<span class="unlocked-text">✓ 已解锁</span>' : `<span class="price-text">💰 ${tool.price}</span>`}
            </div>
          </div>
        </div>
        <div class="tool-card-desc">${tool.description}</div>
        <div class="tool-card-unlocks">
          <span>解锁功能: </span>
          ${tool.unlocks.map(u => `<span class="unlock-tag">${u}</span>`).join(' ')}
        </div>
        ${!isUnlocked ? `
          <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'} tool-buy-btn" 
                  onclick="Game.buyTool('${tool.id}')" 
                  ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '🛒 购买' : '💰 金币不足'}
          </button>
        ` : ''}
      `;
      
      container.appendChild(toolCard);
    });
    
    const goldEl = document.getElementById('tool-shop-gold');
    if (goldEl) goldEl.textContent = this.state.gold;
  },
  
  buyTool(toolId) {
    const tool = this.toolsShop[toolId];
    if (!tool) {
      this.addMessage('工具不存在！', 'warning');
      return;
    }
    
    if (this.state.tools[toolId]) {
      this.addMessage('该工具已经解锁！', 'warning');
      return;
    }
    
    if (this.state.gold < tool.price) {
      this.addMessage(`金币不足！需要 ${tool.price} 金币`, 'warning');
      return;
    }
    
    this.state.gold -= tool.price;
    this.state.tools[toolId] = true;
    this.toolsShop[toolId].unlocked = true;
    
    this.addMessage(`🎉 成功购买 ${tool.icon} ${tool.name}！`, 'success');
    this.addMessage(`   解锁功能: ${tool.unlocks.join(', ')}`);
    
    this.renderToolShop();
    this.updateMenuStats();
    this.updateWorkshopStats();
  },

  // ============================================
  // 探索系统
  // ============================================
  
  startExploration() {
    if (!this.state.selectedMap) {
      this.addMessage('请先选择一个探索地区！', 'warning');
      return;
    }
    
    if (this.state.exploredToday) {
      this.addMessage('今天已经探索过了！每天只能探索一次。', 'warning');
      return;
    }
    
    this.initializeExploreMap();
    this.showScene('explore-scene');
    this.addMessage(`🚀 开始探索 ${this.state.selectedMap.icon} ${this.state.selectedMap.name}！`, 'success');
    this.addMessage('使用方向键移动，空格键采集物品。');
  },

  initializeExploreMap() {
    const map = [];
    const mapData = this.state.selectedMap;
    const width = this.exploreState.mapWidth;
    const height = this.exploreState.mapHeight;
    
    const startX = Math.floor(Math.random() * 3) + 1;
    const startY = Math.floor(height / 2);
    this.exploreState.playerPos = { x: startX, y: startY };
    this.exploreState.revealedCells = new Set();
    this.exploreState.collectedItems = 0;
    this.exploreState.exitPoints = [];
    this.exploreState.dangerPoints = [];
    
    for (let y = 0; y < height; y++) {
      map[y] = [];
      for (let x = 0; x < width; x++) {
        const isStart = x === startX && y === startY;
        const distFromStart = Math.abs(x - startX) + Math.abs(y - startY);
        const isRevealed = distFromStart <= 2;
        
        if (isRevealed) {
          this.exploreState.revealedCells.add(`${x},${y}`);
        }
        
        let terrain = 'grass';
        const rand = Math.random();
        if (rand < 0.6) terrain = 'grass';
        else if (rand < 0.85) terrain = 'forest';
        else terrain = 'mountain';
        
        const items = [];
        if (!isStart && Math.random() < 0.35) {
          const item = this.getRandomItem(mapData.itemWeights);
          if (item) items.push(item.id);
        }
        
        map[y][x] = { position: { x, y }, isRevealed, terrain, items, isExit: false, isDanger: false };
      }
    }
    
    map[startY][startX].isExit = true;
    map[startY][startX].terrain = 'exit';
    this.exploreState.exitPoints.push({ x: startX, y: startY });
    
    const exit2X = width - 2 - Math.floor(Math.random() * 3);
    const exit2Y = Math.floor(Math.random() * (height - 2)) + 1;
    if (exit2Y !== startY || exit2X !== startX) {
      map[exit2Y][exit2X].isExit = true;
      map[exit2Y][exit2X].terrain = 'exit';
      this.exploreState.exitPoints.push({ x: exit2X, y: exit2Y });
    }
    
    const dangerCount = mapData.dangerLevel * 2;
    for (let i = 0; i < dangerCount; i++) {
      const dx = Math.floor(Math.random() * (width - 4)) + 2;
      const dy = Math.floor(Math.random() * (height - 2)) + 1;
      if (!map[dy][dx].isExit) {
        map[dy][dx].isDanger = true;
        this.exploreState.dangerPoints.push({ x: dx, y: dy });
      }
    }
    
    this.exploreState.map = map;
    
    const areaEl = document.getElementById('explore-area');
    if (areaEl) areaEl.textContent = mapData.name;
  },

  renderExploreMap() {
    const container = document.getElementById('explore-map-grid');
    if (!container) return;
    
    const map = this.exploreState.map;
    const playerPos = this.exploreState.playerPos;
    
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${this.exploreState.mapWidth}, 45px)`;
    
    for (let y = 0; y < this.exploreState.mapHeight; y++) {
      for (let x = 0; x < this.exploreState.mapWidth; x++) {
        const cell = map[y][x];
        const cellEl = document.createElement('div');
        cellEl.className = 'map-cell';
        
        const isPlayer = x === playerPos.x && y === playerPos.y;
        const isRevealed = this.exploreState.revealedCells.has(`${x},${y}`);
        
        if (isPlayer) {
          cellEl.classList.add('player');
        } else if (!isRevealed) {
          cellEl.classList.add('fog');
        } else if (cell.isExit) {
          cellEl.classList.add('exit-point');
        } else if (cell.isDanger) {
          cellEl.classList.add('danger');
        } else {
          cellEl.classList.add('revealed');
        }
        
        if (isPlayer) {
          cellEl.textContent = '🧙';
        } else if (isRevealed) {
          if (cell.isExit) {
            cellEl.textContent = '🚪';
          } else if (cell.isDanger) {
            cellEl.textContent = '🐻';
          } else if (cell.items.length > 0) {
            const item = this.baseItems[cell.items[0]];
            cellEl.textContent = item?.icon || '✨';
          } else {
            const terrainIcons = { grass: '🌿', forest: '🌲', mountain: '⛰️' };
            cellEl.textContent = terrainIcons[cell.terrain] || '🌿';
          }
        } else {
          cellEl.textContent = '?';
        }
        
        cellEl.onclick = () => this.onMapCellClick(x, y);
        container.appendChild(cellEl);
      }
    }
    
    this.updateExploreProgress();
  },

  onMapCellClick(x, y) {
    const playerPos = this.exploreState.playerPos;
    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      if (dx === 1) this.movePlayer('right');
      else if (dx === -1) this.movePlayer('left');
      else if (dy === 1) this.movePlayer('down');
      else if (dy === -1) this.movePlayer('up');
    } else if (dx === 0 && dy === 0) {
      const cell = this.exploreState.map[y][x];
      if (cell.isExit) {
        this.tryExitExplore();
      } else if (cell.items.length > 0) {
        this.collectCurrentCell();
      }
    }
  },

  movePlayer(direction) {
    const pos = this.exploreState.playerPos;
    let newX = pos.x;
    let newY = pos.y;
    
    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    
    if (newX < 0 || newX >= this.exploreState.mapWidth || newY < 0 || newY >= this.exploreState.mapHeight) {
      return;
    }
    
    const cell = this.exploreState.map[newY][newX];
    
    if (cell.isDanger) {
      const dangerType = '野生动物出没';
      const currentMapId = this.state.selectedMap?.id;
      const mapDiscovered = currentMapId ? this.state.discovered[currentMapId] : null;
      
      if (mapDiscovered && !mapDiscovered.dangers.has(dangerType)) {
        mapDiscovered.dangers.add(dangerType);
        this.addMessage(`📖 在本地区发现新危险: ${dangerType}！`, 'danger');
      }
      this.addMessage('⚠️ 遇到野生动物！无法前往该位置。', 'danger');
      return;
    }
    
    this.exploreState.playerPos = { x: newX, y: newY };
    
    const revealRange = 2;
    for (let dy = -revealRange; dy <= revealRange; dy++) {
      for (let dx = -revealRange; dx <= revealRange; dx++) {
        const rx = newX + dx;
        const ry = newY + dy;
        if (rx >= 0 && rx < this.exploreState.mapWidth && ry >= 0 && ry < this.exploreState.mapHeight) {
          this.exploreState.revealedCells.add(`${rx},${ry}`);
          this.exploreState.map[ry][rx].isRevealed = true;
        }
      }
    }
    
    if (cell.isExit) {
      this.addMessage('🚪 到达逃离点！点击此处或按ESC结束探索。', 'success');
    }
    
    this.renderExploreMap();
  },

  collectCurrentCell() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (!cell || cell.items.length === 0) {
      this.addMessage('这里没有可采集的物品。', 'warning');
      return;
    }
    
    const currentMapId = this.state.selectedMap?.id;
    const mapDiscovered = currentMapId ? this.state.discovered[currentMapId] : null;
    
    cell.items.forEach(itemId => {
      const item = this.baseItems[itemId];
      if (item) {
        const existing = this.state.inventory.find(i => i.item.id === itemId);
        if (existing) {
          existing.count++;
        } else {
          this.state.inventory.push({ item: { ...item }, count: 1 });
        }
        this.exploreState.collectedItems++;
        
        if (mapDiscovered && !mapDiscovered.items.has(itemId)) {
          mapDiscovered.items.add(itemId);
          this.addMessage(`📖 在本地区发现新素材: ${item.icon} ${item.name}！`, 'success');
        }
        
        this.addMessage(`✨ 采集到了 ${item.icon} ${item.name}！`, 'success');
      }
    });
    
    cell.items = [];
    this.renderExploreMap();
    this.renderExploreInventory();
  },

  updateExploreProgress() {
    const total = this.exploreState.mapWidth * this.exploreState.mapHeight;
    const revealed = this.exploreState.revealedCells.size;
    const progress = Math.floor((revealed / total) * 100);
    
    const progressEl = document.getElementById('explore-progress');
    const foundEl = document.getElementById('explore-found');
    const exitEl = document.getElementById('exit-count');
    const itemsEl = document.getElementById('explore-items');
    
    if (progressEl) progressEl.textContent = `${progress}%`;
    if (foundEl) foundEl.textContent = this.exploreState.collectedItems;
    if (exitEl) exitEl.textContent = `${this.exploreState.exitPoints.length}/2`;
    if (itemsEl) itemsEl.textContent = this.state.inventory.reduce((sum, i) => sum + i.count, 0);
  },

  renderExploreInventory() {
    const container = document.getElementById('explore-inventory');
    const countEl = document.getElementById('inventory-count');
    if (!container) return;
    
    container.innerHTML = '';
    
    const totalCount = this.state.inventory.reduce((sum, i) => sum + i.count, 0);
    if (countEl) countEl.textContent = `${totalCount}件`;
    
    this.state.inventory.forEach(invItem => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="item-icon">${invItem.item.icon}</span>
        ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
      `;
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n数量: ${invItem.count}\n标签: ${invItem.item.tags.join(', ')}`;
      container.appendChild(slot);
    });
  },

  tryExitExplore() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (cell.isExit) {
      this.exitExplore();
    } else {
      const confirmed = confirm('确定要结束探索吗？将返回咖啡制作工坊。');
      if (confirmed) {
        this.exitExplore();
      }
    }
  },

  exitExplore() {
    this.addMessage(`🎉 探索完成！`, 'success');
    this.addMessage(`本次采集了 ${this.exploreState.collectedItems} 个物品`);
    this.addMessage('前往工坊制作咖啡，然后卖给客人获取金币和声望！');
    
    this.state.exploredToday = true;
    this.showScene('workshop-scene');
  },

  // ============================================
  // 制作工坊系统（改进版）
  // ============================================
  
  updateWorkshopStats() {
    const goldEl = document.getElementById('workshop-gold');
    const repEl = document.getElementById('workshop-reputation');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
  },

  renderWorkshopInventory() {
    const container = document.getElementById('workshop-inventory');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.state.inventory.forEach((invItem, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      if (this.selectedWorkshopItem === index) {
        slot.style.borderColor = '#e94560';
        slot.style.boxShadow = '0 0 10px rgba(233, 69, 96, 0.5)';
      }
      
      slot.innerHTML = `
        <span class="item-icon">${invItem.item.icon}</span>
        ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
      `;
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n类型: ${invItem.item.type}\n标签: ${invItem.item.tags.join(', ')}`;
      
      slot.onclick = () => this.selectWorkshopItem(index);
      container.appendChild(slot);
    });
  },

  selectWorkshopItem(index) {
    if (this.selectedWorkshopItem === index) {
      this.selectedWorkshopItem = null;
    } else {
      this.selectedWorkshopItem = index;
      const item = this.state.inventory[index].item;
      this.addMessage(`📦 选中: ${item.icon} ${item.name} [${item.tags.join(', ')}]`);
    }
    this.renderWorkshopInventory();
  },

  renderCoffeeInventory() {
    const container = document.getElementById('coffee-inventory');
    const countEl = document.getElementById('coffee-stock-count');
    if (!container) return;
    
    container.innerHTML = '';
    if (countEl) countEl.textContent = `${this.state.coffeeStock.length}杯`;
    
    this.state.coffeeStock.forEach((coffee, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="item-icon">☕</span>
      `;
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰\n${coffee.description}`;
      container.appendChild(slot);
    });
  },

  putInSlot(slotType) {
    let hasItemInSlot = false;
    switch (slotType) {
      case 'roast':
        hasItemInSlot = !!this.craftState.roastItem;
        break;
      case 'grind':
        hasItemInSlot = !!this.craftState.grindItem;
        break;
      case 'brew':
        hasItemInSlot = !!this.craftState.brewItem;
        break;
      case 'blend':
        hasItemInSlot = !!this.craftState.blendItem;
        break;
    }
    
    if (hasItemInSlot) {
      this.removeFromSlot(slotType);
      return;
    }
    
    if (this.selectedWorkshopItem === null) {
      this.addMessage('请先从背包中选择一个物品', 'warning');
      return;
    }
    
    const invItem = this.state.inventory[this.selectedWorkshopItem];
    const item = invItem.item;
    
    switch (slotType) {
      case 'roast':
        if (item.type !== 'green_bean') {
          this.addMessage('烘焙需要生咖啡豆！', 'warning');
          return;
        }
        this.craftState.roastItem = item;
        this.craftState.roastLevel = null;
        this.updateSlotDisplay('roast-slot', item);
        this.renderRoastOptions();
        this.addMessage(`🔥 将 ${item.icon} ${item.name} 放入烘焙装置`);
        this.addMessage(`   标签: ${item.tags.join(', ')}`);
        break;
        
      case 'grind':
        if (item.type !== 'roasted_bean') {
          this.addMessage('研磨需要熟咖啡豆！', 'warning');
          return;
        }
        this.craftState.grindItem = item;
        this.craftState.grindLevel = null;
        this.updateSlotDisplay('grind-slot', item);
        this.renderGrindOptions();
        this.addMessage(`⚙️ 将 ${item.icon} ${item.name} 放入研磨装置`);
        this.addMessage(`   标签: ${item.tags.join(', ')}`);
        break;
        
      case 'brew':
        if (item.type !== 'coffee_powder') {
          this.addMessage('萃取需要咖啡粉！', 'warning');
          return;
        }
        this.craftState.brewItem = item;
        this.craftState.brewMethod = null;
        this.updateSlotDisplay('brew-slot', item);
        this.renderBrewOptions();
        this.addMessage(`💧 将 ${item.icon} ${item.name} 放入萃取装置`);
        this.addMessage(`   标签: ${item.tags.join(', ')}`);
        break;
        
      case 'blend':
        if (item.type === 'coffee_liquid') {
          this.craftState.blendItem = item;
          this.updateSlotDisplay('blend-slot', item);
          this.addMessage(`🥛 将 ${item.icon} ${item.name} 放入调和装置`);
          this.addMessage(`   标签: ${item.tags.join(', ')}`);
        } else if (item.type === 'additive') {
          if (this.craftState.additives.length >= 3) {
            this.addMessage('最多只能添加3种配料！', 'warning');
            return;
          }
          this.craftState.additives.push(item);
          this.updateAdditivesDisplay();
          this.addMessage(`➕ 添加配料: ${item.icon} ${item.name}`);
          this.addMessage(`   标签: ${item.tags.join(', ')}`);
        } else {
          this.addMessage('调和需要咖啡液或配料！', 'warning');
          return;
        }
        if (this.craftState.blendItem) {
          document.getElementById('blend-btn').disabled = false;
        }
        break;
    }
    
    invItem.count--;
    if (invItem.count <= 0) {
      this.state.inventory.splice(this.selectedWorkshopItem, 1);
      this.selectedWorkshopItem = null;
    }
    
    this.renderWorkshopInventory();
  },

  updateSlotDisplay(slotId, item) {
    const slot = document.getElementById(slotId);
    if (slot) {
      slot.classList.add('has-item');
      slot.innerHTML = `
        <div class="workstation-item" title="点击取出物品">
          <span class="workstation-item-icon">${item.icon}</span>
          <span class="workstation-item-name">${item.name}</span>
        </div>
      `;
    }
  },

  removeFromSlot(slotType) {
    let item = null;
    
    switch (slotType) {
      case 'roast':
        if (!this.craftState.roastItem) return;
        item = this.craftState.roastItem;
        this.craftState.roastItem = null;
        this.craftState.roastLevel = null;
        this.resetSlot('roast-slot', '点击放入生豆');
        const roastContainer = document.getElementById('roast-options');
        if (roastContainer) {
          roastContainer.innerHTML = '<div class="options-placeholder">放入生豆后选择烘焙程度</div>';
        }
        break;
        
      case 'grind':
        if (!this.craftState.grindItem) return;
        item = this.craftState.grindItem;
        this.craftState.grindItem = null;
        this.craftState.grindLevel = null;
        this.resetSlot('grind-slot', '点击放入熟豆');
        const grindContainer = document.getElementById('grind-options');
        if (grindContainer) {
          grindContainer.innerHTML = '<div class="options-placeholder">放入熟豆后选择研磨粗细</div>';
        }
        break;
        
      case 'brew':
        if (!this.craftState.brewItem) return;
        item = this.craftState.brewItem;
        this.craftState.brewItem = null;
        this.craftState.brewMethod = null;
        this.resetSlot('brew-slot', '点击放入咖啡粉');
        const brewContainer = document.getElementById('brew-options');
        if (brewContainer) {
          brewContainer.innerHTML = '<div class="options-placeholder">放入咖啡粉后选择萃取方式</div>';
        }
        break;
        
      case 'blend':
        if (!this.craftState.blendItem) return;
        item = this.craftState.blendItem;
        this.craftState.blendItem = null;
        this.resetSlot('blend-slot', '点击放入咖啡液');
        document.getElementById('blend-btn').disabled = true;
        break;
    }
    
    if (item) {
      const existing = this.state.inventory.find(i => i.item.id === item.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: { ...item }, count: 1 });
      }
      
      this.addMessage(`➖ 取出物品: ${item.icon} ${item.name}`);
      this.renderWorkshopInventory();
    }
  },

  updateAdditivesDisplay() {
    const display = document.getElementById('additives-display');
    if (display) {
      if (this.craftState.additives.length > 0) {
        display.innerHTML = this.craftState.additives.map((a, index) => `
          <span class="additive-item" onclick="Game.removeAdditive(${index})" title="点击移除 ${a.name}">
            ${a.icon} ${a.name}
          </span>
        `).join(' ');
      } else {
        display.textContent = '无';
      }
    }
  },

  removeAdditive(index) {
    if (index >= 0 && index < this.craftState.additives.length) {
      const removedAdditive = this.craftState.additives[index];
      this.craftState.additives.splice(index, 1);
      this.updateAdditivesDisplay();
      
      const existing = this.state.inventory.find(i => i.item.id === removedAdditive.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: { ...removedAdditive }, count: 1 });
      }
      
      this.addMessage(`➖ 移除配料: ${removedAdditive.icon} ${removedAdditive.name}`);
      this.renderWorkshopInventory();
    }
  },

  // 显示操作选项弹窗
  showOptionsDialog(title, options, callback) {
    const dialog = document.createElement('div');
    dialog.className = 'options-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>${title}</h3>
        <div class="options-container">
          ${options.map((option, index) => `
            <button class="option-btn ${option.disabled ? 'disabled' : ''}" data-index="${index}" ${option.disabled ? 'disabled' : ''}>
              ${option.icon || ''} ${option.name}
              ${option.description ? `<small>${option.description}</small>` : ''}
              ${option.disabled ? `<small class="disabled-reason">${option.disabledReason}</small>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelectorAll('.option-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        callback(index);
        document.body.removeChild(dialog);
      });
    });
    
    dialog.querySelector('.dialog-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    dialog.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  },

  calculatePreviewTags(baseItem, processType, processOption) {
    let tags = [...baseItem.tags];
    let addedTags = [];
    let removedTags = [];
    let enhancedTags = [];
    let reducedTags = [];
    
    switch (processType) {
      case 'roast':
        const roast = this.roastLevels.find(r => r.id === processOption);
        if (roast) {
          if (roast.removeTags) {
            roast.removeTags.forEach(rt => {
              if (tags.includes(rt)) {
                removedTags.push(rt);
                tags = tags.filter(t => t !== rt);
              }
            });
          }
          
          roast.tags.forEach(rt => {
            if (!tags.includes(rt)) {
              addedTags.push(rt);
              tags.push(rt);
            }
          });
          
          if (roast.tagMultiplier) {
            Object.entries(roast.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
        
      case 'grind':
        const grind = this.grindLevels.find(g => g.id === processOption);
        if (grind) {
          grind.tags.forEach(gt => {
            if (!tags.includes(gt)) {
              addedTags.push(gt);
              tags.push(gt);
            }
          });
          
          if (grind.tagMultiplier) {
            Object.entries(grind.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
        
      case 'brew':
        const brew = this.brewMethods.find(b => b.id === processOption);
        if (brew) {
          brew.tags.forEach(bt => {
            if (!tags.includes(bt)) {
              addedTags.push(bt);
              tags.push(bt);
            }
          });
          
          if (brew.tagMultiplier) {
            Object.entries(brew.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
    }
    
    return {
      finalTags: tags,
      addedTags: addedTags,
      removedTags: removedTags,
      enhancedTags: enhancedTags,
      reducedTags: reducedTags
    };
  },

  showConfirmDialog(title, content, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-content">
        <h3>${title}</h3>
        <div class="confirm-body">
          ${content}
        </div>
        <div class="confirm-buttons">
          <button class="btn btn-secondary confirm-cancel">取消</button>
          <button class="btn btn-primary confirm-ok">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('.confirm-cancel').onclick = () => {
      document.body.removeChild(dialog);
      if (onCancel) onCancel();
    };
    
    dialog.querySelector('.confirm-ok').onclick = () => {
      document.body.removeChild(dialog);
      if (onConfirm) onConfirm();
    };
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
        if (onCancel) onCancel();
      }
    });
  },

  renderRoastOptions() {
    const container = document.getElementById('roast-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.roastLevels.forEach(roast => {
      const isLocked = roast.requiredTool && !this.state.tools[roast.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && this.craftState.roastItem) {
        const preview = this.calculatePreviewTags(this.craftState.roastItem, 'roast', roast.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.removedTags.length > 0) {
          previewHtml += `<div class="preview-removed">移除: ${preview.removedTags.map(t => `<span class="tag-removed">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${roast.icon} ${roast.name}
        </div>
        <div class="option-desc">${roast.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          const preview = this.calculatePreviewTags(this.craftState.roastItem, 'roast', roast.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${this.craftState.roastItem.icon} ${this.craftState.roastItem.name}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${this.craftState.roastItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${roast.icon} ${roast.name}</span>
              </div>
          `;
          
          if (preview.removedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label remove">移除标签:</span>
              <span class="tag-list">${preview.removedTags.map(t => `<span class="preview-tag tag-removed">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            '确认烘焙',
            confirmContent,
            () => this.performRoast(roast.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  renderGrindOptions() {
    const container = document.getElementById('grind-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.grindLevels.forEach(grind => {
      const isLocked = grind.requiredTool && !this.state.tools[grind.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && this.craftState.grindItem) {
        const preview = this.calculatePreviewTags(this.craftState.grindItem, 'grind', grind.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${grind.icon} ${grind.name}
        </div>
        <div class="option-desc">${grind.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          const preview = this.calculatePreviewTags(this.craftState.grindItem, 'grind', grind.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${this.craftState.grindItem.icon} ${this.craftState.grindItem.name}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${this.craftState.grindItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${grind.icon} ${grind.name}</span>
              </div>
          `;
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            '确认研磨',
            confirmContent,
            () => this.performGrind(grind.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  renderBrewOptions() {
    const container = document.getElementById('brew-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.brewMethods.forEach(brew => {
      const isLocked = brew.requiredTool && !this.state.tools[brew.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && this.craftState.brewItem) {
        const preview = this.calculatePreviewTags(this.craftState.brewItem, 'brew', brew.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.reducedTags.length > 0) {
          previewHtml += `<div class="preview-reduced">减弱: ${preview.reducedTags.map(t => `<span class="tag-reduced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${brew.icon} ${brew.name}
        </div>
        <div class="option-desc">${brew.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          const preview = this.calculatePreviewTags(this.craftState.brewItem, 'brew', brew.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${this.craftState.brewItem.icon} ${this.craftState.brewItem.name}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${this.craftState.brewItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${brew.icon} ${brew.name}</span>
              </div>
          `;
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.reducedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label reduce">减弱效果:</span>
              <span class="tag-list">${preview.reducedTags.map(t => `<span class="preview-tag tag-reduced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            '确认萃取',
            confirmContent,
            () => this.performBrew(brew.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  performRoast(roastLevelId) {
    if (!this.craftState.roastItem) {
      this.addMessage('请先放入生豆！', 'warning');
      return;
    }
    
    const roast = this.roastLevels.find(r => r.id === roastLevelId);
    if (!roast) {
      this.addMessage('无效的烘焙程度！', 'warning');
      return;
    }
    
    if (roast.requiredTool && !this.state.tools[roast.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const roastedBean = this.createRoastedBean(this.craftState.roastItem, roastLevelId);
    this.state.inventory.push({ item: roastedBean, count: 1 });
    
    this.addMessage(`🔥 烘焙完成！`, 'success');
    this.addMessage(`   ${this.craftState.roastItem.icon} ${this.craftState.roastItem.name} → ${roastedBean.icon} ${roastedBean.name}`);
    this.addMessage(`   烘焙程度: ${roast.name}`);
    this.addMessage(`   最终标签: ${roastedBean.tags.join(', ')}`);
    
    this.craftState.roastItem = null;
    this.craftState.roastLevel = roastLevelId;
    this.resetSlot('roast-slot', '点击放入生豆');
    
    const roastContainer = document.getElementById('roast-options');
    if (roastContainer) {
      roastContainer.innerHTML = '<div class="options-placeholder">放入生豆后选择烘焙程度</div>';
    }
    
    this.updateCraftProgress(1);
    this.renderWorkshopInventory();
  },

  performGrind(grindLevelId) {
    if (!this.craftState.grindItem) {
      this.addMessage('请先放入熟豆！', 'warning');
      return;
    }
    
    const grind = this.grindLevels.find(g => g.id === grindLevelId);
    if (!grind) {
      this.addMessage('无效的研磨粗细！', 'warning');
      return;
    }
    
    if (grind.requiredTool && !this.state.tools[grind.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const powder = this.createCoffeePowder(this.craftState.grindItem, grindLevelId);
    this.state.inventory.push({ item: powder, count: 1 });
    
    this.addMessage(`⚙️ 研磨完成！`, 'success');
    this.addMessage(`   ${this.craftState.grindItem.icon} ${this.craftState.grindItem.name} → ${powder.icon} ${powder.name}`);
    this.addMessage(`   研磨粗细: ${grind.name}`);
    this.addMessage(`   最终标签: ${powder.tags.join(', ')}`);
    
    this.craftState.grindItem = null;
    this.craftState.grindLevel = grindLevelId;
    this.resetSlot('grind-slot', '点击放入熟豆');
    
    const grindContainer = document.getElementById('grind-options');
    if (grindContainer) {
      grindContainer.innerHTML = '<div class="options-placeholder">放入熟豆后选择研磨粗细</div>';
    }
    
    this.updateCraftProgress(2);
    this.renderWorkshopInventory();
  },

  performBrew(brewMethodId) {
    if (!this.craftState.brewItem) {
      this.addMessage('请先放入咖啡粉！', 'warning');
      return;
    }
    
    const brew = this.brewMethods.find(b => b.id === brewMethodId);
    if (!brew) {
      this.addMessage('无效的萃取方式！', 'warning');
      return;
    }
    
    if (brew.requiredTool && !this.state.tools[brew.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const liquid = this.createCoffeeLiquid(this.craftState.brewItem, brewMethodId);
    this.state.inventory.push({ item: liquid, count: 1 });
    
    this.addMessage(`💧 萃取完成！`, 'success');
    this.addMessage(`   ${this.craftState.brewItem.icon} ${this.craftState.brewItem.name} → ${liquid.icon} ${liquid.name}`);
    this.addMessage(`   萃取方式: ${brew.name}`);
    this.addMessage(`   最终标签: ${liquid.tags.join(', ')}`);
    
    this.craftState.brewItem = null;
    this.craftState.brewMethod = brewMethodId;
    this.resetSlot('brew-slot', '点击放入咖啡粉');
    
    const brewContainer = document.getElementById('brew-options');
    if (brewContainer) {
      brewContainer.innerHTML = '<div class="options-placeholder">放入咖啡粉后选择萃取方式</div>';
    }
    
    this.updateCraftProgress(3);
    this.renderWorkshopInventory();
  },

  // 改进的调和系统：根据所有原料和工艺动态生成咖啡
  performBlend() {
    if (!this.craftState.blendItem) {
      this.addMessage('请先放入咖啡液！', 'warning');
      return;
    }
    
    const coffee = this.createFinishedCoffee(this.craftState.blendItem, this.craftState.additives);
    
    this.craftState.finishedCoffee = coffee;
    this.showFinishedCoffee(coffee);
    
    this.addMessage(`☕ 咖啡制作完成！`, 'success');
    this.addMessage(`   名称: ${coffee.name}`);
    this.addMessage(`   评分: ${coffee.score}`);
    this.addMessage(`   标签: ${coffee.tags.join(', ')}`);
    this.addMessage(`   描述: ${coffee.description}`);
    this.addMessage(`   建议售价: ${coffee.price} 金币`);
    
    this.craftState.blendItem = null;
    this.craftState.additives = [];
    document.getElementById('blend-btn').disabled = true;
    this.resetSlot('blend-slot', '点击放入咖啡液');
    this.updateAdditivesDisplay();
    
    this.updateCraftProgress(4);
    this.renderWorkshopInventory();
  },

  resetSlot(slotId, placeholder) {
    const slot = document.getElementById(slotId);
    if (slot) {
      slot.classList.remove('has-item');
      slot.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.8rem;">${placeholder}</span>`;
    }
  },

  updateCraftProgress(step) {
    const steps = document.querySelectorAll('#craft-progress .progress-step');
    steps.forEach((el, index) => {
      const icon = el.querySelector('.progress-step-icon');
      if (index < step) {
        el.classList.add('completed');
        if (icon) {
          icon.classList.remove('pending');
          icon.classList.add('completed');
          icon.textContent = '✓';
        }
      }
    });
  },

  showFinishedCoffee(coffee) {
    const container = document.getElementById('finished-coffee-container');
    if (!container) return;
    
    container.classList.remove('hidden');
    
    document.getElementById('finished-coffee-name').textContent = coffee.name;
    document.getElementById('finished-coffee-desc').textContent = coffee.description;
    document.getElementById('finished-coffee-positive').textContent = `+${coffee.score}`;
    document.getElementById('finished-coffee-negative').textContent = '0';
    document.getElementById('finished-coffee-score').textContent = `${coffee.score} (💰${coffee.price})`;
    
    const tagsContainer = document.getElementById('finished-coffee-tags');
    tagsContainer.innerHTML = coffee.tags.map(t => `<span class="coffee-tag">${t}</span>`).join('');
  },

  storeCoffee() {
    if (!this.craftState.finishedCoffee) {
      this.addMessage('没有可存储的咖啡！', 'warning');
      return;
    }
    
    this.state.coffeeStock.push(this.craftState.finishedCoffee);
    this.addMessage(`📦 咖啡已存入库存: ${this.craftState.finishedCoffee.name}`, 'success');
    
    document.getElementById('finished-coffee-container').classList.add('hidden');
    this.craftState.finishedCoffee = null;
    
    this.renderCoffeeInventory();
  },

  // ============================================
  // 商店系统
  // ============================================
  
  updateShopStats() {
    const goldEl = document.getElementById('shop-gold');
    const repEl = document.getElementById('shop-reputation');
    const dayEl = document.getElementById('shop-day');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
    if (dayEl) dayEl.textContent = this.state.day;
    
    document.getElementById('sold-count').textContent = this.shopState.soldToday;
    document.getElementById('today-income').textContent = `${this.shopState.incomeToday}💰`;
    
    const totalCustomers = this.shopState.customers.length;
    const remaining = totalCustomers - this.shopState.customers.filter(c => c.served).length;
    document.getElementById('customer-count').textContent = remaining;
  },

  generateCustomers() {
    if (this.shopState.customers.length > 0 && this.shopState.customers[0].day === this.state.day) {
      this.renderCustomers();
      return;
    }
    
    const count = 5 + Math.floor(Math.random() * 3);
    const customers = [];
    
    for (let i = 0; i < count; i++) {
      const template = this.customerTemplates[Math.floor(Math.random() * this.customerTemplates.length)];
      customers.push({
        ...template,
        id: `customer_${i}`,
        day: this.state.day,
        served: false
      });
    }
    
    this.shopState.customers = customers;
    this.renderCustomers();
    this.addMessage(`🏪 今天有 ${count} 位客人来到店里！`, 'info');
  },

  renderCustomers() {
    const container = document.getElementById('customers-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.shopState.customers.forEach((customer, index) => {
      if (customer.served) return;
      
      const card = document.createElement('div');
      card.className = `customer-card ${this.shopState.selectedCustomer?.id === customer.id ? 'selected' : ''}`;
      
      card.innerHTML = `
        <div class="customer-header">
          <div class="customer-avatar">${customer.avatar}</div>
          <div class="customer-info">
            <div class="customer-name">${customer.name}</div>
            <div class="customer-type">${customer.type}</div>
          </div>
        </div>
        <div class="customer-demands">
          <div class="demands-title">需求:</div>
          <div class="demand-tags">
            ${customer.demands.map(d => `
              <span class="demand-tag ${d.required ? '' : 'optional'}">
                ${d.required ? '⭐' : '○'} ${d.tag}
              </span>
            `).join('')}
          </div>
        </div>
        <div class="customer-reward">
          <div class="reward-info">
            <div class="reward-item"><span>💰</span> ${customer.basePrice}起</div>
            <div class="reward-item"><span>⭐</span> ${customer.reputation}</div>
          </div>
        </div>
      `;
      
      card.onclick = () => this.selectCustomer(customer);
      container.appendChild(card);
    });
  },

  selectCustomer(customer) {
    this.shopState.selectedCustomer = customer;
    this.renderCustomers();
    this.updateMatchInfo();
    
    const area = document.getElementById('selected-customer-area');
    if (area) {
      area.innerHTML = `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">${customer.avatar}</div>
          <div style="font-weight: bold;">${customer.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
            需求: ${customer.demands.map(d => d.tag).join(', ')}
          </div>
        </div>
      `;
    }
    
    this.addMessage(`👋 选中客人: ${customer.name}`);
  },

  renderShopCoffeeInventory() {
    const container = document.getElementById('shop-coffee-inventory');
    const countEl = document.getElementById('shop-coffee-count');
    if (!container) return;
    
    container.innerHTML = '';
    if (countEl) countEl.textContent = `${this.state.coffeeStock.length}杯`;
    
    this.state.coffeeStock.forEach((coffee, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      if (this.shopState.selectedCoffee?.id === coffee.id) {
        slot.style.borderColor = '#e94560';
        slot.style.boxShadow = '0 0 10px rgba(233, 69, 96, 0.5)';
      }
      
      slot.innerHTML = `
        <span class="item-icon">☕</span>
      `;
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰\n${coffee.description}`;
      
      slot.onclick = () => this.selectCoffeeForSale(coffee, index);
      container.appendChild(slot);
    });
  },

  selectCoffeeForSale(coffee, index) {
    this.shopState.selectedCoffee = coffee;
    this.renderShopCoffeeInventory();
    this.updateMatchInfo();
    this.addMessage(`☕ 选中咖啡: ${coffee.name} (评分: ${coffee.score}, 标签: ${coffee.tags.join(', ')})`);
  },

  updateMatchInfo() {
    const matchArea = document.getElementById('match-area');
    const matchInfoEl = document.getElementById('match-info');
    const sellBtn = document.getElementById('sell-coffee-btn');
    
    if (!this.shopState.selectedCustomer || !this.shopState.selectedCoffee) {
      matchArea.classList.add('hidden');
      if (sellBtn) sellBtn.disabled = true;
      return;
    }
    
    matchArea.classList.remove('hidden');
    
    const customer = this.shopState.selectedCustomer;
    const coffee = this.shopState.selectedCoffee;
    
    let requiredMatch = 0;
    let optionalMatch = 0;
    let totalRequired = 0;
    
    customer.demands.forEach(demand => {
      const matches = coffee.tags.includes(demand.tag);
      if (demand.required) {
        totalRequired++;
        if (matches) requiredMatch++;
      } else {
        if (matches) optionalMatch++;
      }
    });
    
    const allRequiredMet = requiredMatch === totalRequired;
    const matchScore = requiredMatch * 2 + optionalMatch;
    
    let finalPrice;
    if (allRequiredMet) {
      finalPrice = Math.floor(customer.basePrice * (1 + matchScore * 0.2) + coffee.score * 2);
    } else {
      finalPrice = Math.floor(coffee.price * 0.5);
    }
    
    matchInfoEl.innerHTML = `
      <div class="match-item">
        <span class="match-label">必需需求匹配:</span>
        <span class="match-value ${allRequiredMet ? 'success' : 'danger'}">${requiredMatch}/${totalRequired}</span>
      </div>
      <div class="match-item">
        <span class="match-label">可选需求匹配:</span>
        <span class="match-value">${optionalMatch}</span>
      </div>
      <div class="match-item">
        <span class="match-label">客人需求标签:</span>
        <span class="match-value">${customer.demands.map(d => d.tag).join(', ')}</span>
      </div>
      <div class="match-item">
        <span class="match-label">咖啡标签:</span>
        <span class="match-value">${coffee.tags.join(', ')}</span>
      </div>
      <div class="match-item" style="padding-top: 10px; border-top: 1px solid var(--border-color); font-weight: bold;">
        <span class="match-label">${allRequiredMet ? '✅ 完美匹配' : '⚠️ 需求不满足，仅能售出半价'}:</span>
        <span class="match-value gold">${finalPrice}💰</span>
      </div>
    `;
    
    if (sellBtn) {
      sellBtn.disabled = false;
      sellBtn.textContent = `💰 售卖 (${finalPrice}金币)`;
    }
    
    this.calculatedPrice = finalPrice;
    this.allRequiredMet = allRequiredMet;
  },

  sellToCustomer() {
    if (!this.shopState.selectedCustomer || !this.shopState.selectedCoffee) {
      this.addMessage('请先选择客人和咖啡！', 'warning');
      return;
    }
    
    if (!this.allRequiredMet) {
      const confirmed = confirm('该咖啡不满足客人的全部必需需求！确定要售卖吗？客人可能会不满意。');
      if (!confirmed) return;
    }
    
    const customer = this.shopState.selectedCustomer;
    const coffee = this.shopState.selectedCoffee;
    const price = this.calculatedPrice || coffee.price;
    
    this.state.gold += price;
    this.shopState.incomeToday += price;
    this.shopState.soldToday++;
    
    let reputationGain = 0;
    if (this.allRequiredMet) {
      // 完美匹配，获得全部声望
      reputationGain = customer.reputation;
      this.addMessage(`⭐ 完美匹配！获得 ${reputationGain} 声望值`, 'success');
    } else {
      // 不完美匹配，根据匹配程度计算声望
      let requiredMatch = 0;
      let optionalMatch = 0;
      let totalRequired = 0;
      
      customer.demands.forEach(demand => {
        const matches = coffee.tags.includes(demand.tag);
        if (demand.required) {
          totalRequired++;
          if (matches) requiredMatch++;
        } else {
          if (matches) optionalMatch++;
        }
      });
      
      // 计算声望值：必需需求匹配权重更高
      reputationGain = Math.floor((requiredMatch / totalRequired) * customer.reputation * 0.6 + 
                                (optionalMatch / (customer.demands.length - totalRequired || 1)) * customer.reputation * 0.4);
      if (reputationGain > 0) {
        this.addMessage(`⭐ 部分匹配！获得 ${reputationGain} 声望值`, 'info');
      } else {
        this.addMessage(`⚠️ 匹配度太低，未获得声望值`, 'warning');
      }
    }
    
    this.state.reputation += reputationGain;
    
    const coffeeIndex = this.state.coffeeStock.findIndex(c => c.id === coffee.id);
    if (coffeeIndex >= 0) {
      this.state.coffeeStock.splice(coffeeIndex, 1);
    }
    
    const customerIndex = this.shopState.customers.findIndex(c => c.id === customer.id);
    if (customerIndex >= 0) {
      this.shopState.customers[customerIndex].served = true;
    }
    
    this.addMessage(`💰 售出 ${coffee.name} 给 ${customer.name}，获得 ${price} 金币！`, 'success');
    
    this.shopState.selectedCustomer = null;
    this.shopState.selectedCoffee = null;
    
    this.renderCustomers();
    this.renderShopCoffeeInventory();
    this.updateShopStats();
    this.updateMatchInfo();
    
    document.getElementById('selected-customer-area').innerHTML = `
      <div class="no-selection">选择一位客人进行售卖</div>
    `;
  },

  clearShopSelection() {
    this.shopState.selectedCustomer = null;
    this.shopState.selectedCoffee = null;
    this.renderCustomers();
    this.renderShopCoffeeInventory();
    this.updateMatchInfo();
    document.getElementById('selected-customer-area').innerHTML = `
      <div class="no-selection">选择一位客人进行售卖</div>
    `;
  },

  nextDay() {
    const remainingCustomers = this.shopState.customers.filter(c => !c.served);
    
    if (remainingCustomers.length > 0) {
      const confirmed = confirm(`还有 ${remainingCustomers.length} 位客人没有接待。确定要结束今天吗？`);
      if (!confirmed) return;
    }
    
    this.state.day++;
    this.state.exploredToday = false;
    this.shopState.soldToday = 0;
    this.shopState.incomeToday = 0;
    this.shopState.customers = [];
    
    this.addMessage(`🌅 新的一天开始了！第 ${this.state.day} 天`, 'success');
    
    this.showScene('map-select-scene');
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (this.state.currentScene === 'explore-scene') {
        switch (key) {
          case 'arrowup':
          case 'w':
            this.movePlayer('up');
            e.preventDefault();
            break;
          case 'arrowdown':
          case 's':
            this.movePlayer('down');
            e.preventDefault();
            break;
          case 'arrowleft':
          case 'a':
            this.movePlayer('left');
            e.preventDefault();
            break;
          case 'arrowright':
          case 'd':
            this.movePlayer('right');
            e.preventDefault();
            break;
          case ' ':
            this.collectCurrentCell();
            e.preventDefault();
            break;
          case 'escape':
            this.tryExitExplore();
            break;
        }
      }
    });
    
    document.getElementById('roast-slot')?.addEventListener('click', () => this.putInSlot('roast'));
    document.getElementById('grind-slot')?.addEventListener('click', () => this.putInSlot('grind'));
    document.getElementById('brew-slot')?.addEventListener('click', () => this.putInSlot('brew'));
    document.getElementById('blend-slot')?.addEventListener('click', () => this.putInSlot('blend'));
  },

  init() {
    this.setupEventListeners();
    
    document.querySelectorAll('.workstation-slot').forEach(slot => {
      slot.style.cursor = 'pointer';
    });
    
    console.log('☕ CoffeeHunter 游戏 v2.0 初始化完成！');
    console.log('📝 改进内容：');
    console.log('   - 每道工序保留前序工序的标签');
    console.log('   - 烘焙/研磨/萃取可选择参数');
    console.log('   - 咖啡名称根据原料和工艺动态生成');
    console.log('   - 保留产地信息（哥伦比亚/埃塞俄比亚/肯尼亚/巴西）');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});