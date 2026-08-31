import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(testDirectory, '..');

// 从工作区统一依赖目录加载 Playwright，避免把本地验收工具写入应用依赖。
async function loadPlaywright() {
  const dependencyRoot = process.env.CODEX_WORKSPACE_NODE_MODULES;
  if (!dependencyRoot) throw new Error('缺少 CODEX_WORKSPACE_NODE_MODULES');
  return import(pathToFileURL(path.join(dependencyRoot, 'playwright', 'index.mjs')).href);
}

// 启动临时静态服务器，让 npm run test:web 无需依赖人工启动的预览进程。
async function startStaticServer() {
  const distRoot = path.join(mobileRoot, 'dist');
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png'
  };
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(distRoot, relativePath);
    if (!filePath.startsWith(`${distRoot}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await fs.readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return { server, url: `http://127.0.0.1:${address.port}/` };
}

// 验证横屏布局、触控探索和竖屏提示，并输出商店迁移验收证据。
async function runMobileWebSmoke() {
  const outputDir = path.resolve(process.env.COFFEEHUNTER_TEST_OUTPUT || 'test-reports/screenshots');
  await fs.mkdir(outputDir, { recursive: true });

  const { chromium } = await loadPlaywright();
  const localServer = process.env.COFFEEHUNTER_TEST_URL ? null : await startStaticServer();
  const targetUrl = process.env.COFFEEHUNTER_TEST_URL || localServer.url;
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  const results = [];
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    assert.ok((await page.locator('body').innerText()).includes('CoffeeHunter'));
    assert.equal(await page.locator('#orientation-guard').evaluate(element => getComputedStyle(element).display), 'none');
    assert.equal(await page.locator('#mobile-explore-controls button').count(), 5);
    await page.screenshot({ path: path.join(outputDir, 'M01-landscape-main-menu.png') });
    results.push({ id: 'M01', item: '横屏主菜单与移动增强加载', result: '通过' });

    await page.getByRole('button', { name: /开始游戏/ }).click();
    await page.waitForSelector('#daily-orders .daily-order-card');
    assert.equal(await page.locator('#daily-orders .daily-order-card').count(), 4);
    assert.equal(await page.locator('#map-cards .map-card').count(), 13);
    results.push({ id: 'M02', item: '横屏订单与地图选择', result: '通过' });

    await page.locator('#map-cards .map-card:not(.locked)').first().click();
    await page.locator('#start-explore-btn').click();
    await page.waitForSelector('#explore-scene:not(.hidden)');
    assert.equal(await page.locator('#mobile-explore-controls').evaluate(element => getComputedStyle(element).display), 'grid');
    assert.equal(await page.locator('#mobile-panel-toggle').isVisible(), true);

    const cellSize = await page.locator('.map-cell').first().boundingBox();
    assert.ok(cellSize && cellSize.width <= 32 && cellSize.height <= 32);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

    const positionBefore = await page.evaluate(() => {
      const { x, y } = Game.exploreState.playerPos;
      const target = Game.exploreState.map[y][x + 1];
      target.isDanger = false;
      target.dangerResolved = true;
      target.isBlocked = false;
      target.items = [];
      return { x, y };
    });
    await page.locator('#mobile-explore-controls [data-action="right"]').tap();
    assert.equal(await page.evaluate(() => Game.exploreState.playerPos.x), positionBefore.x + 1);

    await page.locator('#mobile-panel-toggle').tap();
    assert.equal(await page.locator('body').evaluate(element => element.classList.contains('mobile-panel-open')), true);
    await page.waitForTimeout(250);
    const sidebarBounds = await page.locator('.explore-sidebar').boundingBox();
    assert.ok(sidebarBounds && sidebarBounds.x < 844 && sidebarBounds.x + sidebarBounds.width <= 844);
    await page.screenshot({ path: path.join(outputDir, 'M03-landscape-exploration.png') });
    results.push({ id: 'M03', item: '探索触控、紧凑网格与侧栏抽屉', result: '通过' });

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('#orientation-guard').evaluate(element => getComputedStyle(element).display), 'flex');
    assert.ok((await page.locator('#orientation-guard').innerText()).includes('仅支持横屏游玩'));
    await page.screenshot({ path: path.join(outputDir, 'M04-portrait-guard.png') });
    results.push({ id: 'M04', item: '竖屏阻断提示', result: '通过' });

    assert.deepEqual(consoleErrors, []);
    results.push({ id: 'M05', item: '页面错误与控制台异常', result: '通过' });
  } finally {
    await browser.close();
    if (localServer) {
      await new Promise((resolve, reject) => localServer.server.close(error => error ? reject(error) : resolve()));
    }
  }

  const resultPath = path.join(path.dirname(outputDir), 'mobile-browser-results.json');
  await fs.writeFile(resultPath, JSON.stringify({ targetUrl, consoleErrors, results }, null, 2));
  console.log(JSON.stringify({ outputDir, consoleErrors, results }, null, 2));
}

await runMobileWebSmoke();
