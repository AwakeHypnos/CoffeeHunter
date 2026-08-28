import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// 创建满足游戏渲染调用的最小 DOM，保证规则测试不依赖真实浏览器。
function createMockDocument() {
  const elements = new Map();
  const createElement = () => ({
    className: '',
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
    children: [],
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    querySelector() { return createElement(); },
    querySelectorAll() { return []; },
    innerHTML: '',
    textContent: '',
    disabled: false,
    onclick: null,
    scrollTop: 0,
    scrollHeight: 0
  });

  return {
    addEventListener() {},
    querySelectorAll() { return []; },
    createElement,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      return elements.get(id);
    },
    body: {
      appendChild() {},
      removeChild() {}
    }
  };
}

// 创建隔离的本地存储，验证保存与恢复不会污染开发者浏览器。
function createMockStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

// 在独立 VM 中加载浏览器脚本，并固定随机数以获得稳定测试结果。
function loadGame() {
  const source = `${fs.readFileSync(new URL('../src/game-v2.js', import.meta.url), 'utf8')}\n;globalThis.__game = Game;`;
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0.5;
  const context = {
    console,
    Date,
    Set,
    Math: deterministicMath,
    alert() {},
    confirm() { return true; },
    document: createMockDocument(),
    localStorage: createMockStorage()
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return { game: context.__game, context };
}

test('每日订单在选图前生成且同日不重复', () => {
  const { game } = loadGame();
  game.startNewGame();

  assert.equal(game.shopState.customers.length, game.rules.dailyCustomerCount);
  assert.equal(new Set(game.shopState.customers.map(customer => customer.name)).size, game.rules.dailyCustomerCount);
  assert.ok(game.shopState.customers.every(customer => customer.day === 1));
});

test('预处理后的生豆可以进入后续烘焙链路', () => {
  const { game } = loadGame();
  const processed = game.createProcessedBean(game.baseItems.green_colombian, 'washed');

  assert.equal(processed.type, 'green_bean');
  assert.equal(processed.isProcessed, true);
  assert.equal(processed.processMethod, 'washed');
});

test('正确研磨萃取组合比错误组合获得更高品质', () => {
  const { game } = loadGame();
  const processed = game.createProcessedBean(game.baseItems.green_colombian, 'washed');
  const roasted = game.createRoastedBean(processed, 'medium');
  const goodPowder = game.createCoffeePowder(roasted, 'medium');
  const badPowder = game.createCoffeePowder(roasted, 'extra_fine');
  const goodCoffee = game.createFinishedCoffee(game.createCoffeeLiquid(goodPowder, 'pour_over'), []);
  const badCoffee = game.createFinishedCoffee(game.createCoffeeLiquid(badPowder, 'pour_over'), []);

  assert.ok(goodCoffee.score > badCoffee.score);
  assert.equal(goodCoffee.defects.length, 0);
  assert.ok(badCoffee.defects.includes('过萃苦涩'));
  assert.equal(goodCoffee.mainFlavorTags.length, 3);
  assert.ok(Object.keys(goodCoffee.flavorProfile).length === 6);
});

test('三种配料会触发风味过载而不是无条件加分', () => {
  const { game } = loadGame();
  const roasted = game.createRoastedBean(game.baseItems.green_colombian, 'medium');
  const powder = game.createCoffeePowder(roasted, 'medium');
  const liquid = game.createCoffeeLiquid(powder, 'pour_over');
  const additives = [game.baseItems.milk_whole, game.baseItems.fruit_vanilla, game.baseItems.spice_cinnamon];
  const coffee = game.createFinishedCoffee(liquid, additives);

  assert.ok(coffee.defects.includes('风味过载'));
  assert.ok(coffee.scoreBreakdown.some(item => item.label === '配料过载' && item.value < 0));
});

test('顾客匹配同时考虑必需需求、品质、避雷标签和缺陷', () => {
  const { game } = loadGame();
  const customer = game.customerTemplates[0];
  const goodMatch = game.calculateCustomerMatch(customer, { tags: ['果香', '花香'], score: 90, defects: [], rarityInnovation: { score: 20 } });
  const badMatch = game.calculateCustomerMatch(customer, { tags: ['焦味'], sourceTags: ['焦味'], score: 20, defects: ['焦味'], rarityInnovation: { score: 2 } });

  assert.equal(goodMatch.demandScore, 50);
  assert.equal(goodMatch.craftScore, 27);
  assert.equal(goodMatch.rarityInnovationScore, 20);
  assert.equal(goodMatch.matchPercent, 97);
  assert.ok(goodMatch.reputationChange > 0);
  assert.ok(badMatch.matchPercent < 40);
  assert.ok(badMatch.reputationChange < 0);
});

test('探索移动按地形扣除行动力', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  const start = { ...game.exploreState.playerPos };
  const target = game.exploreState.map[start.y][start.x + 1];
  target.terrain = 'forest';
  target.isDanger = false;
  target.isExit = false;

  game.movePlayer('right');

  assert.equal(game.exploreState.actionPoints, game.exploreState.maxActionPoints - 2);
  assert.equal(game.exploreState.playerPos.x, start.x + 1);
  assert.equal(game.exploreState.playerPos.y, start.y);
});

test('探索采集受到八格远征背包限制', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  const position = game.exploreState.playerPos;
  const cell = game.exploreState.map[position.y][position.x];
  cell.items = Array(9).fill('green_arabica');

  game.collectCurrentCell();

  assert.equal(game.exploreState.collectedItems, game.rules.exploration.backpackCapacity);
  assert.equal(cell.items.length, 1);
  assert.equal(game.exploreState.actionPoints, game.exploreState.maxActionPoints - game.rules.exploration.collectCost);
});

test('存档恢复金币、订单与地图发现记录', () => {
  const { game } = loadGame();
  game.startNewGame();
  game.state.gold = 321;
  game.state.explorationSupplies = 5;
  game.state.discovered.ethiopia.items.add('green_yirgacheffe');
  game.saveGame();
  game.state.gold = 0;
  game.state.discovered.ethiopia.items.clear();

  assert.equal(game.loadGame(), true);
  assert.equal(game.state.gold, 321);
  assert.equal(game.state.explorationSupplies, 5);
  assert.ok(game.state.discovered.ethiopia.items.has('green_yirgacheffe'));
  assert.equal(game.shopState.customers.length, game.rules.dailyCustomerCount);
});

test('不同地图难度严格使用16、14、12点行动力', () => {
  const { game } = loadGame();
  for (const [difficulty, expected] of [['easy', 16], ['medium', 14], ['hard', 12]]) {
    game.state.selectedMap = game.maps.find(map => map.difficulty === difficulty);
    game.initializeExploreMap();
    assert.equal(game.exploreState.maxActionPoints, expected);
  }
});

test('危险格提供绕路、工具和冒险三种选择', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  const start = { ...game.exploreState.playerPos };
  const target = game.exploreState.map[start.y][start.x + 1];
  target.isDanger = true;
  target.dangerResolved = false;
  target.terrain = 'forest';
  let dialog;
  game.showOptionsDialog = (title, options, callback, dialogOptions) => {
    dialog = { title, options, callback, dialogOptions };
  };

  game.movePlayer('right');
  assert.equal(dialog.options.length, 3);
  assert.equal(dialog.dialogOptions.allowDismiss, false);
  dialog.callback(1);

  assert.equal(game.state.explorationSupplies, 1);
  assert.equal(game.exploreState.playerPos.x, start.x + 1);
  assert.equal(target.dangerResolved, true);
});

test('行动力耗尽只丢失一半未保护素材', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  game.state.inventory.push({ item: { ...game.baseItems.green_arabica }, count: 6 });
  game.exploreState.collectedItemIds = Array(6).fill('green_arabica');
  game.exploreState.collectedItems = 6;

  game.exitExplore({ unsafe: true, exhausted: true });

  assert.equal(game.exploreState.protectedCapacity, 2);
  assert.equal(game.exploreState.collectedItems, 4);
  assert.equal(game.exploreState.collectedItemIds.length, 4);
});

test('地区委托在安全带回目标素材后发放额外奖励', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  game.state.activeCommission = {
    day: 1,
    mapId: game.maps[0].id,
    itemId: 'green_arabica',
    targetCount: 2,
    rewardGold: 25,
    rewardReputation: 5,
    status: 'active'
  };
  game.exploreState.collectedItemIds = ['green_arabica', 'green_arabica'];
  game.exploreState.collectedItems = 2;
  const goldBefore = game.state.gold;

  game.exitExplore();

  assert.equal(game.state.activeCommission.status, 'completed');
  assert.equal(game.state.gold, goldBefore + 25);
  assert.equal(game.state.completedCommissions, 1);
});

test('配方笔记、三线专精和第7/14天咖啡节目标可持续推进', () => {
  const { game } = loadGame();
  const [day7Festival, day14Festival] = game.rules.festival.milestones;
  const roasted = game.createRoastedBean(game.baseItems.green_colombian, 'medium');
  const powder = game.createCoffeePowder(roasted, 'medium');
  const coffee = game.createFinishedCoffee(game.createCoffeeLiquid(powder, 'pour_over'), []);
  game.recordRecipe(coffee);
  game.gainSpecializationXp('roasting', 45);
  game.state.day = 7;
  game.state.reputation = 60;
  while (Object.keys(game.state.collection.recipes).length < 5) {
    const copy = { ...coffee, brewMethod: `test_${Object.keys(game.state.collection.recipes).length}` };
    game.recordRecipe(copy);
  }
  const goldBefore = game.state.gold;

  assert.equal(game.evaluateFestival(), 'success');
  assert.equal(game.getSpecializationTier('roasting'), 1);
  assert.equal(game.state.festival.results[day7Festival.id], 'success');
  assert.equal(game.state.gold, goldBefore + day7Festival.rewardGold);

  game.state.day = 14;
  game.state.reputation = 120;
  while (Object.keys(game.state.collection.recipes).length < 10) {
    const copy = { ...coffee, brewMethod: `test_${Object.keys(game.state.collection.recipes).length}` };
    game.recordRecipe(copy);
  }
  const goldBeforeDay14 = game.state.gold;

  assert.equal(game.evaluateFestival(), 'success');
  assert.equal(game.state.festival.results[day14Festival.id], 'success');
  assert.equal(game.state.gold, goldBeforeDay14 + day14Festival.rewardGold);
});

test('成功接待后的顾客会带着历史偏好再次来访', () => {
  const { game } = loadGame();
  game.state.customerHistory['上班族小红'] = {
    visits: 1,
    successfulOrders: 1,
    favoriteTag: '花香',
    lastMatch: 92
  };
  game.shopState.customers = [];
  game.generateCustomers();

  const returningCustomer = game.shopState.customers[0];
  assert.equal(returningCustomer.name, '上班族小红');
  assert.equal(returningCustomer.isReturning, true);
  assert.ok(returningCustomer.demands.some(demand => demand.tag === '花香' && !demand.required));
  assert.ok(returningCustomer.storyText.length > 0);
});

test('冒险通过失败会消耗四点行动力并丢失一件未保护素材', () => {
  const { game, context } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  game.state.inventory.push({ item: { ...game.baseItems.green_arabica }, count: 3 });
  game.exploreState.collectedItemIds = Array(3).fill('green_arabica');
  game.exploreState.collectedItems = 3;
  const start = { ...game.exploreState.playerPos };
  const target = game.exploreState.map[start.y][start.x + 1];
  target.isDanger = true;
  target.dangerResolved = false;
  target.terrain = 'forest';
  context.Math.random = () => 0.1;
  let dialog;
  game.showOptionsDialog = (title, options, callback) => {
    dialog = { title, options, callback };
  };

  game.movePlayer('right');
  dialog.callback(2);

  assert.equal(game.exploreState.actionPoints, game.exploreState.maxActionPoints - game.rules.exploration.dangerCost);
  assert.equal(game.exploreState.collectedItems, 2);
  assert.equal(game.exploreState.collectedItemIds.length, 2);
  assert.equal(target.dangerResolved, true);
});

test('进入下一天会按基础店务和已拥有设备扣除维护费', () => {
  const { game } = loadGame();
  game.startNewGame();
  game.shopState.customers.forEach(customer => {
    customer.served = true;
  });
  game.state.tools.espressoMachine = true;
  const maintenanceCost = game.getMaintenanceCost();
  const goldBefore = game.state.gold;

  game.nextDay();

  assert.equal(maintenanceCost, game.rules.economy.maintenanceBaseCost + game.rules.economy.maintenancePerTool);
  assert.equal(game.state.gold, goldBefore - maintenanceCost);
  assert.equal(game.state.dayHistory[0].maintenance, maintenanceCost);
  assert.equal(game.state.day, 2);
});

test('抵达远端撤离点会发放地图奖励且只结算一次', () => {
  const { game } = loadGame();
  game.state.selectedMap = game.maps[0];
  game.initializeExploreMap();
  const farExit = game.exploreState.exitPoints
    .map(position => game.exploreState.map[position.y][position.x])
    .find(cell => cell.isFarExit);
  game.exploreState.playerPos = { ...farExit.position };
  const goldBefore = game.state.gold;
  const reputationBefore = game.state.reputation;

  game.exitExplore();

  assert.equal(game.state.gold, goldBefore + game.state.selectedMap.rewards.gold);
  assert.equal(game.state.reputation, reputationBefore + game.state.selectedMap.rewards.reputation);
  assert.equal(game.exploreState.reachedFarExit, true);

  const goldAfterReward = game.state.gold;
  const reputationAfterReward = game.state.reputation;
  game.exitExplore();
  assert.equal(game.state.gold, goldAfterReward);
  assert.equal(game.state.reputation, reputationAfterReward);
});
