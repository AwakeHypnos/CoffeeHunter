import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(mobileRoot, '..');
const generatedWebRoot = path.join(mobileRoot, 'web');
const generatedPublicRoot = path.join(generatedWebRoot, 'public');

// 从根目录唯一业务入口生成移动端页面，避免复制并分叉游戏主逻辑。
async function prepareMobileWeb() {
  const sourceHtmlPath = path.join(repositoryRoot, 'game.html');
  const sourceGamePath = path.join(repositoryRoot, 'src', 'game-v2.js');
  const mobileStylePath = path.join(mobileRoot, 'src', 'mobile.css');
  const mobileBridgePath = path.join(mobileRoot, 'src', 'mobile-bridge.js');
  const [sourceHtml, sourceGame, mobileStyle, mobileBridge] = await Promise.all([
    fs.readFile(sourceHtmlPath, 'utf8'),
    fs.readFile(sourceGamePath, 'utf8'),
    fs.readFile(mobileStylePath, 'utf8'),
    fs.readFile(mobileBridgePath, 'utf8')
  ]);

  if (!sourceHtml.includes('<script src="./src/game-v2.js"></script>')) {
    throw new Error('未找到 CoffeeHunter 当前业务脚本入口，停止生成移动端页面。');
  }

  const mobileHtml = sourceHtml
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">\n  <meta name="theme-color" content="#0f0f1a">'
    )
    .replace('</head>', '  <link rel="stylesheet" href="./mobile.css">\n</head>')
    .replace(
      '<script src="./src/game-v2.js"></script>',
      '<script src="./game-v2.js"></script>\n  <script type="module" src="./mobile-bridge.js"></script>'
    );
  const exposedGameSource = `${sourceGame}\n\n// 暴露移动端桥接所需的唯一游戏实例。\nwindow.CoffeeHunterGame = Game;\n`;

  await fs.rm(generatedWebRoot, { recursive: true, force: true });
  await fs.mkdir(generatedPublicRoot, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(generatedWebRoot, 'index.html'), mobileHtml),
    fs.writeFile(path.join(generatedWebRoot, 'mobile.css'), mobileStyle),
    fs.writeFile(path.join(generatedWebRoot, 'mobile-bridge.js'), mobileBridge),
    fs.writeFile(path.join(generatedPublicRoot, 'game-v2.js'), exposedGameSource)
  ]);
}

await prepareMobileWeb();
