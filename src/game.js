// ============================================
// CoffeeHunter 游戏主逻辑
// ============================================

const Game = {
  state: {
    gold: 100,
    reputation: 0,
    day: 1,
    inventory: [],
    coffeeStock: [],
    selectedMap: null,
    currentScene: 'main-menu'
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
    grindItem: null,
    brewItem: null,
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

  items: {
    green_colombian: { id: 'green_colombian', name: '哥伦比亚生豆', type: 'green_bean', icon: '🫘', description: '哥伦比亚产的平衡生豆', tags: ['甜感', '坚果', '巧克力'], rarity: 'common' },
    green_ethiopian: { id: 'green_ethiopian', name: '埃塞俄比亚生豆', type: 'green_bean', icon: '🫘', description: '果香花香丰富的生豆', tags: ['果香', '花香'], rarity: 'uncommon' },
    green_kenyan: { id: 'green_kenyan', name: '肯尼亚生豆', type: 'green_bean', icon: '🫘', description: '明亮酸感的特色生豆', tags: ['果香', '酸感'], rarity: 'rare' },
    green_brazilian: { id: 'green_brazilian', name: '巴西生豆', type: 'green_bean', icon: '🫘', description: '基础拼配生豆', tags: ['坚果', '巧克力'], rarity: 'common' },
    
    roasted_light: { id: 'roasted_light', name: '浅烘焙豆', type: 'roasted_bean', icon: '🟤', description: '保留原始风味', tags: ['果香', '花香'], rarity: 'common' },
    roasted_medium: { id: 'roasted_medium', name: '中烘焙豆', type: 'roasted_bean', icon: '🟫', description: '平衡的酸苦感', tags: ['甜感', '坚果'], rarity: 'common' },
    roasted_dark: { id: 'roasted_dark', name: '深烘焙豆', type: 'roasted_bean', icon: '⬛', description: '浓郁苦味焦香', tags: ['巧克力', '苦味'], rarity: 'common' },
    
    powder_fine: { id: 'powder_fine', name: '细磨咖啡粉', type: 'coffee_powder', icon: '🥣', description: '适合意式浓缩', tags: ['巧克力', '苦味'], rarity: 'common' },
    powder_medium: { id: 'powder_medium', name: '中磨咖啡粉', type: 'coffee_powder', icon: '🥣', description: '适合手冲滴滤', tags: ['果香', '甜感'], rarity: 'common' },
    
    liquid_espresso: { id: 'liquid_espresso', name: '意式浓缩', type: 'coffee_liquid', icon: '☕', description: '浓郁醇厚', tags: ['巧克力', '坚果'], rarity: 'common' },
    liquid_pour_over: { id: 'liquid_pour_over', name: '手冲咖啡', type: 'coffee_liquid', icon: '☕', description: '风味清晰', tags: ['果香', '花香', '甜感'], rarity: 'common' },
    
    milk_whole: { id: 'milk_whole', name: '全脂牛奶', type: 'additive', icon: '🥛', description: '增添丝滑口感', tags: ['奶香', '顺滑'], rarity: 'common' },
    milk_oat: { id: 'milk_oat', name: '燕麦奶', type: 'additive', icon: '🌾', description: '植物基底', tags: ['谷物', '健康'], rarity: 'uncommon' },
    fruit_vanilla: { id: 'fruit_vanilla', name: '香草荚', type: 'additive', icon: '🌿', description: '甜美香气', tags: ['香草', '甜感'], rarity: 'uncommon' },
    fruit_orange: { id: 'fruit_orange', name: '橙皮', type: 'additive', icon: '🍊', description: '柑橘风味', tags: ['果香', '柑橘'], rarity: 'common' },
    fruit_berry: { id: 'fruit_berry', name: '混合浆果', type: 'additive', icon: '🫐', description: '酸甜果香', tags: ['果香', '酸甜'], rarity: 'uncommon' },
    spice_cinnamon: { id: 'spice_cinnamon', name: '肉桂棒', type: 'additive', icon: '🌰', description: '温暖辛香', tags: ['香料', '温暖'], rarity: 'common' },
    spice_cardamom: { id: 'spice_cardamom', name: '小豆蔻', type: 'additive', icon: '🫛', description: '独特香料', tags: ['香料', '特色'], rarity: 'rare' }
  },

  maps: [
    {
      id: 'forest',
      name: '神秘森林',
      icon: '🌲',
      difficulty: 'easy',
      description: '一片宁静的森林，适合新手探索。这里生长着各种优质咖啡豆。',
      tags: ['新手友好', '咖啡豆丰富', '危险低'],
      rewards: { gold: 50, reputation: 10 },
      itemWeights: { green_colombian: 30, green_ethiopian: 20, green_brazilian: 30, fruit_orange: 10, spice_cinnamon: 10 },
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
      itemWeights: { green_ethiopian: 30, green_kenyan: 25, green_colombian: 20, fruit_berry: 15, fruit_vanilla: 10 },
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
      itemWeights: { green_kenyan: 35, green_ethiopian: 25, spice_cardamom: 20, fruit_vanilla: 10, milk_oat: 10 },
      dangerLevel: 3
    }
  ],

  customerTemplates: [
    { name: '咖啡爱好者小明', avatar: '👨', type: '爱好者', demands: [{ tag: '果香', required: true }, { tag: '花香', required: false }], basePrice: 50 },
    { name: '上班族小红', avatar: '👩', type: '上班族', demands: [{ tag: '巧克力', required: true }, { tag: '坚果', required: true }], basePrice: 60 },
    { name: '退休老王', avatar: '👴', type: '传统派', demands: [{ tag: '巧克力', required: true }, { tag: '苦味', required: false }], basePrice: 45 },
    { name: '时尚博主', avatar: '👱‍♀️', type: '潮流派', demands: [{ tag: '果香', required: true }, { tag: '花香', required: true }, { tag: '特色', required: false }], basePrice: 80 },
    { name: '健身教练', avatar: '💪', type: '健康派', demands: [{ tag: '健康', required: true }, { tag: '谷物', required: false }], basePrice: 55 },
    { name: '甜品控', avatar: '🧁', type: '甜党', demands: [{ tag: '甜感', required: true }, { tag: '香草', required: true }, { tag: '奶香', required: false }], basePrice: 70 },
    { name: '探险家', avatar: '🧭', type: '冒险家', demands: [{ tag: '特色', required: true }, { tag: '香料', required: true }], basePrice: 75 }
  ],

  addMessage(text, type = 'info') {
    this.messages.push({ text, type, time: Date.now() });
    if (this.messages.length > 100) this.messages.shift();
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
      if (random <= 0) return this.items[itemId];
    }
    const firstId = Object.keys(weights)[0];
    return this.items[firstId];
  },

  showScene(sceneId) {
    const scenes = ['main-menu', 'map-select-scene', 'explore-scene', 'workshop-scene', 'shop-scene'];
    scenes.forEach(id => document.getElementById(id).classList.add('hidden'));
    
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

  startNewGame() {
    this.state = {
      gold: 100,
      reputation: 0,
      day: 1,
      inventory: [
        { item: this.items.green_colombian, count: 3 },
        { item: this.items.milk_whole, count: 2 },
        { item: this.items.spice_cinnamon, count: 1 }
      ],
      coffeeStock: [],
      selectedMap: null,
      currentScene: 'main-menu'
    };
    
    this.shopState = { customers: [], selectedCustomer: null, selectedCoffee: null, soldToday: 0, incomeToday: 0 };
    this.messages = [];
    this.addMessage('🎮 欢迎来到 CoffeeHunter！', 'success');
    this.addMessage('选择一个地区开始你的咖啡探索之旅！');
    this.showScene('map-select-scene');
  },

  showHelp() {
    alert(`CoffeeHunter 游戏说明\n\n1. 地图选择：选择不同难度的地区探索\n2. 探索：使用方向键或WASD移动，采集咖啡豆和材料\n3. 制作：在工坊烘焙、研磨、萃取、调和咖啡\n4. 售卖：在商店卖给客人，匹配需求获得更多金币\n\n操作：\n↑↓←→ / WASD：移动\n空格键：采集\n点击物品放入制作装置`);
  },

  renderMapCards() {
    const container = document.getElementById('map-cards');
    if (!container) return;
    container.innerHTML = '';
    
    this.maps.forEach(map => {
      const card = document.createElement('div');
      card.className = `map-card ${this.state.selectedMap?.id === map.id ? 'selected' : ''}`;
      
      const difficultyClass = map.difficulty === 'easy' ? 'easy' : map.difficulty === 'medium' ? 'medium' : 'hard';
      const difficultyText = map.difficulty === 'easy' ? '简单' : map.difficulty === 'medium' ? '中等' : '困难';
      
      card.innerHTML = `
        <div class="map-card-header">
          <div class="map-card-name">${map.icon} ${map.name}</div>
          <div class="map-card-difficulty ${difficultyClass}">${difficultyText}</div>
        </div>
        <div class="map-card-desc">${map.description}</div>
        <div class="map-card-tags">
          ${map.tags.map(tag => `<span class="map-tag">${tag}</span>`).join('')}
        </div>
        <div class="map-card-rewards">
          <span>💰 ${map.rewards.gold}</span>
          <span>⭐ ${map.rewards.reputation}</span>
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

  startExploration() {
    if (!this.state.selectedMap) {
      this.addMessage('请先选择一个探索地区！', 'warning');
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
            const item = this.items[cell.items[0]];
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
    
    cell.items.forEach(itemId => {
      const item = this.items[itemId];
      if (item) {
        const existing = this.state.inventory.find(i => i.item.id === itemId);
        if (existing) {
          existing.count++;
        } else {
          this.state.inventory.push({ item, count: 1 });
        }
        this.exploreState.collectedItems++;
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
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n数量: ${invItem.count}`;
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
    const mapData = this.state.selectedMap;
    this.state.gold += mapData.rewards.gold;
    this.state.reputation += mapData.rewards.reputation;
    
    this.addMessage(`🎉 探索完成！获得 ${mapData.rewards.gold} 金币，${mapData.rewards.reputation} 声望`, 'success');
    this.addMessage(`本次采集了 ${this.exploreState.collectedItems} 个物品`);
    this.addMessage('前往工坊制作咖啡吧！');
    
    this.showScene('workshop-scene');
  },

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
      this.addMessage(`📦 选中: ${this.state.inventory[index].item.icon} ${this.state.inventory[index].item.name}`);
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
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰`;
      container.appendChild(slot);
    });
  },

  putInSlot(slotType) {
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
        document.getElementById('roast-btn').disabled = false;
        this.updateSlotDisplay('roast-slot', item);
        this.addMessage(`🔥 将 ${item.icon} ${item.name} 放入烘焙装置`);
        break;
        
      case 'grind':
        if (item.type !== 'roasted_bean') {
          this.addMessage('研磨需要熟咖啡豆！', 'warning');
          return;
        }
        this.craftState.grindItem = item;
        document.getElementById('grind-btn').disabled = false;
        this.updateSlotDisplay('grind-slot', item);
        this.addMessage(`⚙️ 将 ${item.icon} ${item.name} 放入研磨装置`);
        break;
        
      case 'brew':
        if (item.type !== 'coffee_powder') {
          this.addMessage('萃取需要咖啡粉！', 'warning');
          return;
        }
        this.craftState.brewItem = item;
        document.getElementById('brew-btn').disabled = false;
        this.updateSlotDisplay('brew-slot', item);
        this.addMessage(`💧 将 ${item.icon} ${item.name} 放入萃取装置`);
        break;
        
      case 'blend':
        if (item.type === 'coffee_liquid') {
          this.craftState.blendItem = item;
          this.updateSlotDisplay('blend-slot', item);
          this.addMessage(`🥛 将 ${item.icon} ${item.name} 放入调和装置`);
        } else if (item.type === 'additive') {
          if (this.craftState.additives.length >= 3) {
            this.addMessage('最多只能添加3种配料！', 'warning');
            return;
          }
          this.craftState.additives.push(item);
          this.updateAdditivesDisplay();
          this.addMessage(`➕ 添加配料: ${item.icon} ${item.name}`);
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
        <div class="workstation-item">
          <span class="workstation-item-icon">${item.icon}</span>
          <span class="workstation-item-name">${item.name}</span>
        </div>
      `;
    }
  },

  updateAdditivesDisplay() {
    const display = document.getElementById('additives-display');
    if (display) {
      if (this.craftState.additives.length > 0) {
        display.textContent = this.craftState.additives.map(a => a.icon).join(' ');
      } else {
        display.textContent = '无';
      }
    }
  },

  performRoast() {
    if (!this.craftState.roastItem) {
      this.addMessage('请先放入生豆！', 'warning');
      return;
    }
    
    const roastedTypes = ['roasted_light', 'roasted_medium', 'roasted_dark'];
    const roastedType = roastedTypes[Math.floor(Math.random() * roastedTypes.length)];
    const roastedItem = this.items[roastedType];
    
    const existing = this.state.inventory.find(i => i.item.id === roastedType);
    if (existing) {
      existing.count++;
    } else {
      this.state.inventory.push({ item: roastedItem, count: 1 });
    }
    
    this.craftState.roastItem = null;
    document.getElementById('roast-btn').disabled = true;
    this.resetSlot('roast-slot', '拖放生豆');
    
    this.addMessage(`🔥 烘焙完成！获得 ${roastedItem.icon} ${roastedItem.name}`, 'success');
    this.updateCraftProgress(1);
    this.renderWorkshopInventory();
  },

  performGrind() {
    if (!this.craftState.grindItem) {
      this.addMessage('请先放入熟豆！', 'warning');
      return;
    }
    
    const powderTypes = ['powder_fine', 'powder_medium'];
    const powderType = powderTypes[Math.floor(Math.random() * powderTypes.length)];
    const powderItem = this.items[powderType];
    
    const existing = this.state.inventory.find(i => i.item.id === powderType);
    if (existing) {
      existing.count++;
    } else {
      this.state.inventory.push({ item: powderItem, count: 1 });
    }
    
    this.craftState.grindItem = null;
    document.getElementById('grind-btn').disabled = true;
    this.resetSlot('grind-slot', '拖放熟豆');
    
    this.addMessage(`⚙️ 研磨完成！获得 ${powderItem.icon} ${powderItem.name}`, 'success');
    this.updateCraftProgress(2);
    this.renderWorkshopInventory();
  },

  performBrew() {
    if (!this.craftState.brewItem) {
      this.addMessage('请先放入咖啡粉！', 'warning');
      return;
    }
    
    const liquidTypes = ['liquid_espresso', 'liquid_pour_over'];
    const liquidType = liquidTypes[Math.floor(Math.random() * liquidTypes.length)];
    const liquidItem = this.items[liquidType];
    
    const existing = this.state.inventory.find(i => i.item.id === liquidType);
    if (existing) {
      existing.count++;
    } else {
      this.state.inventory.push({ item: liquidItem, count: 1 });
    }
    
    this.craftState.brewItem = null;
    document.getElementById('brew-btn').disabled = true;
    this.resetSlot('brew-slot', '拖放咖啡粉');
    
    this.addMessage(`💧 萃取完成！获得 ${liquidItem.icon} ${liquidItem.name}`, 'success');
    this.updateCraftProgress(3);
    this.renderWorkshopInventory();
  },

  performBlend() {
    if (!this.craftState.blendItem) {
      this.addMessage('请先放入咖啡液！', 'warning');
      return;
    }
    
    const allTags = [...this.craftState.blendItem.tags];
    this.craftState.additives.forEach(a => {
      a.tags.forEach(t => {
        if (!allTags.includes(t)) allTags.push(t);
      });
    });
    
    const score = 5 + Math.floor(Math.random() * 10) + this.craftState.additives.length * 2;
    const basePrice = 30 + score * 5;
    
    const coffeeNames = ['浓缩咖啡', '拿铁', '卡布奇诺', '美式', '手冲精品', '特调咖啡'];
    const coffeeName = coffeeNames[Math.floor(Math.random() * coffeeNames.length)];
    
    const coffee = {
      id: `coffee_${Date.now()}`,
      name: coffeeName,
      tags: allTags,
      score: score,
      price: basePrice,
      baseItem: this.craftState.blendItem,
      additives: [...this.craftState.additives]
    };
    
    this.craftState.finishedCoffee = coffee;
    this.showFinishedCoffee(coffee);
    
    this.craftState.blendItem = null;
    this.craftState.additives = [];
    document.getElementById('blend-btn').disabled = true;
    this.resetSlot('blend-slot', '拖放咖啡液');
    this.updateAdditivesDisplay();
    
    this.addMessage(`☕ 咖啡制作完成！${coffeeName} - 评分: ${score}`, 'success');
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
    document.getElementById('finished-coffee-desc').textContent = `使用 ${coffee.baseItem.name} 制作，添加了 ${coffee.additives.length} 种配料`;
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
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰`;
      
      slot.onclick = () => this.selectCoffeeForSale(coffee, index);
      container.appendChild(slot);
    });
  },

  selectCoffeeForSale(coffee, index) {
    this.shopState.selectedCoffee = coffee;
    this.renderShopCoffeeInventory();
    this.updateMatchInfo();
    this.addMessage(`☕ 选中咖啡: ${coffee.name} (评分: ${coffee.score})`);
  },

  updateMatchInfo() {
    const matchArea = document.getElementById('match-area');
    const matchInfo = document.getElementById('match-info');
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
    const finalPrice = Math.floor(customer.basePrice * (1 + matchScore * 0.2) + coffee.score * 2);
    
    matchInfo.innerHTML = `
      <div class="match-item">
        <span class="match-label">必需需求匹配:</span>
        <span class="match-value ${allRequiredMet ? 'success' : 'danger'}">${requiredMatch}/${totalRequired}</span>
      </div>
      <div class="match-item">
        <span class="match-label">可选需求匹配:</span>
        <span class="match-value">${optionalMatch}</span>
      </div>
      <div class="match-item">
        <span class="match-label">最终售价:</span>
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
    
    if (this.allRequiredMet) {
      this.state.reputation += 5;
    }
    
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
    
    console.log('☕ CoffeeHunter 游戏初始化完成！');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
