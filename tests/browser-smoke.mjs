import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// 从显式依赖目录加载 Playwright，避免给业务仓库安装仅用于本地验收的浏览器依赖。
async function loadPlaywright() {
  const dependencyRoot = process.env.CODEX_WORKSPACE_NODE_MODULES;
  if (!dependencyRoot) throw new Error('缺少 CODEX_WORKSPACE_NODE_MODULES');
  return import(pathToFileURL(path.join(dependencyRoot, 'playwright', 'index.mjs')).href);
}

// 执行主要玩法页面的浏览器冒烟测试，并输出截图与结构化结果供测试报告引用。
async function runBrowserSmoke() {
  const targetUrl = process.argv[2] || 'http://127.0.0.1:4173/game.html';
  const outputDir = path.resolve(process.argv[3] || 'browser-test-output');
  await fs.mkdir(outputDir, { recursive: true });

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  const results = [];
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    assert.ok((await page.locator('body').innerText()).includes('CoffeeHunter'));
    results.push({ id: 'B01', item: '主页面加载', result: '通过' });

    await page.getByRole('button', { name: /开始游戏/ }).click();
    await page.waitForSelector('#daily-orders .daily-order-card');
    assert.equal(await page.locator('#daily-orders .daily-order-card').count(), 4);
    assert.equal(await page.locator('#map-cards .map-card').count(), 13);
    assert.ok((await page.locator('#progress-summary').innerText()).includes('咖啡节'));
    assert.ok((await page.locator('#map-cards').innerText()).includes('旅行费'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, '01-daily-orders.png'), fullPage: true });
    results.push({ id: 'B02', item: '订单前置与地图选择', result: '通过' });

    await page.locator('#map-cards .map-card:not(.locked)').first().click();
    const goldBeforeTravel = await page.evaluate(() => Game.state.gold);
    await page.locator('#start-explore-btn').click();
    assert.equal(await page.locator('#explore-action-points').innerText(), '16/16');
    assert.equal(await page.locator('#explore-items').innerText(), '0/8');
    assert.equal(await page.locator('#explore-protected').innerText(), '0/2');
    assert.equal(await page.locator('#explore-supplies').innerText(), '2');
    assert.equal(await page.evaluate(() => Game.state.gold), goldBeforeTravel - 10);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, '02-exploration-budget.png'), fullPage: true });
    results.push({ id: 'B03', item: '探索行动力与背包约束', result: '通过' });

    await page.evaluate(() => {
      const position = Game.exploreState.playerPos;
      const target = Game.exploreState.map[position.y][position.x + 1];
      target.isDanger = true;
      target.dangerResolved = false;
      target.terrain = 'forest';
      target.items = [];
    });
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector('.options-dialog');
    assert.equal(await page.locator('.options-dialog .option-btn').count(), 3);
    assert.ok((await page.locator('.options-dialog').innerText()).includes('绕路'));
    assert.ok((await page.locator('.options-dialog').innerText()).includes('消耗工具'));
    assert.ok((await page.locator('.options-dialog').innerText()).includes('冒险通过'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, '03-danger-choice.png'), fullPage: true });
    await page.getByRole('button', { name: /绕路/ }).click();
    assert.equal(await page.locator('#explore-action-points').innerText(), '15/16');
    results.push({ id: 'B04', item: '危险事件三选一', result: '通过' });

    await page.evaluate(() => {
      const processed = Game.createProcessedBean(Game.baseItems.green_colombian, 'washed');
      const roasted = Game.createRoastedBean(processed, 'medium');
      const powder = Game.createCoffeePowder(roasted, 'medium');
      const liquid = Game.createCoffeeLiquid(powder, 'pour_over');
      const coffee = Game.createFinishedCoffee(liquid, [Game.baseItems.fruit_vanilla]);
      Game.recordRecipe(coffee);
      Game.showScene('workshop-scene');
      Game.craftState.finishedCoffee = coffee;
      Game.showFinishedCoffee(coffee);
    });
    assert.match(await page.locator('#finished-coffee-score').innerText(), /^\d+\/100/);
    assert.ok((await page.locator('#finished-coffee-tags').innerText()).includes('风味六维'));
    assert.ok((await page.locator('#finished-coffee-tags').innerText()).includes('品质依据'));
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#finished-coffee-tags .coffee-tag').count(), 3);
    await page.screenshot({ path: path.join(outputDir, '04-craft-quality.png'), fullPage: true });
    results.push({ id: 'B05', item: '可解释工艺品质与三主风味', result: '通过' });

    await page.evaluate(() => {
      // 固定验收顾客，避免随机每日订单导致截图中的综合匹配度漂移。
      const customer = {
        ...Game.customerTemplates[0],
        id: 'browser_customer',
        day: Game.state.day,
        served: false,
        visitCount: 1,
        successfulOrders: 0,
        isReturning: false,
        storyText: Game.customerStories['咖啡爱好者小明'][0]
      };
      Game.shopState.customers[0] = customer;
      const coffee = {
        id: 'browser_match_coffee',
        name: '订单验证咖啡',
        tags: customer.demands.map(demand => demand.tag),
        sourceTags: customer.demands.map(demand => demand.tag),
        score: 90,
        price: 120,
        defects: [],
        rarityInnovation: { score: 20 },
        mainFlavorTags: ['果香', '花香', '自然甜感'],
        description: '用于验证顾客匹配与满意度。'
      };
      Game.state.coffeeStock = [coffee];
      Game.showScene('shop-scene');
      Game.selectCustomer(customer);
      Game.selectCoffeeForSale(coffee, 0);
    });
    const matchInfo = await page.locator('#match-info').innerText();
    assert.ok(matchInfo.includes('综合匹配度'));
    assert.ok(matchInfo.includes('97%'));
    await page.waitForTimeout(400);
    assert.ok(matchInfo.includes('需求匹配（50%）'));
    assert.ok(matchInfo.includes('工艺品质（30%）'));
    assert.ok(matchInfo.includes('稀有度/创新（20%）'));
    assert.ok(matchInfo.includes('下次改进'));
    await page.screenshot({ path: path.join(outputDir, '05-customer-match.png'), fullPage: true });
    results.push({ id: 'B06', item: '50/30/20顾客综合结算', result: '通过' });

    await page.locator('#sell-coffee-btn').click();
    assert.notEqual(await page.locator('#satisfaction').innerText(), '0%');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, '06-satisfaction.png'), fullPage: true });
    results.push({ id: 'B07', item: '销售满意度与回头客记录', result: '通过' });

    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#continue-game-btn').isDisabled(), false);
    await page.locator('#continue-game-btn').click();
    assert.equal(await page.evaluate(() => Object.keys(Game.state.collection.recipes).length), 1);
    assert.equal(await page.evaluate(() => Game.state.customerHistory['咖啡爱好者小明'].successfulOrders), 1);
    results.push({ id: 'B08', item: '本地存档与继续游戏', result: '通过' });

    await page.evaluate(() => Game.showProgressHub());
    const progressText = await page.locator('#progress-content').innerText();
    assert.ok(progressText.includes('咖啡节阶段目标'));
    assert.ok(progressText.includes('第 7 天'));
    assert.ok(progressText.includes('专精路线'));
    assert.ok(progressText.includes('咖啡图鉴'));
    assert.ok(progressText.includes('配方笔记'));
    assert.ok(progressText.includes('经营成本'));
    assert.ok(progressText.includes('回头客故事'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, '07-progress-hub.png'), fullPage: true });
    results.push({ id: 'B09', item: '中长期成长档案', result: '通过' });

    assert.deepEqual(consoleErrors, []);
    results.push({ id: 'B10', item: '浏览器控制台错误', result: '通过' });
  } finally {
    await browser.close();
  }

  const resultPath = path.join(outputDir, 'browser-results.json');
  await fs.writeFile(resultPath, JSON.stringify({ targetUrl, consoleErrors, results }, null, 2));
  console.log(JSON.stringify({ outputDir, consoleErrors, results }, null, 2));
}

await runBrowserSmoke();
