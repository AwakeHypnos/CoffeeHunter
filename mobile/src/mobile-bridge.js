import { Capacitor, SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';

const WEB_SAVE_KEY = 'coffeeHunter.save.v3';
const NATIVE_SAVE_KEY = 'coffeeHunter.native.save.v1';
const SIDEBAR_SCENES = new Set(['explore-scene', 'processing-scene', 'workshop-scene', 'shop-scene']);
const isNative = Capacitor.isNativePlatform();

// 在游戏初始化前用原生偏好存储恢复存档，同时兼容已有 WebView localStorage 存档。
async function hydrateNativeSave() {
  if (!isNative) return;
  const nativeSave = await Preferences.get({ key: NATIVE_SAVE_KEY });
  const webSave = localStorage.getItem(WEB_SAVE_KEY);
  if (nativeSave.value) {
    localStorage.setItem(WEB_SAVE_KEY, nativeSave.value);
  } else if (webSave) {
    await Preferences.set({ key: NATIVE_SAVE_KEY, value: webSave });
  }
}

// 将业务层同步存档镜像到 iOS UserDefaults 或 Android SharedPreferences。
async function persistNativeSave() {
  if (!isNative) return;
  const serializedSave = localStorage.getItem(WEB_SAVE_KEY);
  if (serializedSave) {
    await Preferences.set({ key: NATIVE_SAVE_KEY, value: serializedSave });
  }
}

// 提供轻量触觉反馈；模拟器或不支持的设备会安全忽略。
async function impact(style = ImpactStyle.Light) {
  if (!isNative) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('触觉反馈不可用:', error);
  }
}

// 创建横屏探索触控键和侧栏抽屉按钮，保证核心操作不依赖物理键盘。
function installMobileControls(game) {
  const controls = document.createElement('div');
  controls.id = 'mobile-explore-controls';
  controls.setAttribute('aria-label', '探索触控操作');
  controls.innerHTML = `
    <button type="button" data-action="up" aria-label="向上移动">▲</button>
    <button type="button" data-action="left" aria-label="向左移动">◀</button>
    <button type="button" data-action="collect" aria-label="采集">◎</button>
    <button type="button" data-action="right" aria-label="向右移动">▶</button>
    <button type="button" data-action="down" aria-label="向下移动">▼</button>
  `;
  controls.addEventListener('pointerdown', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.action;
    if (action === 'collect') game.collectCurrentCell();
    else game.movePlayer(action);
    void impact(action === 'collect' ? ImpactStyle.Medium : ImpactStyle.Light);
  });
  document.body.appendChild(controls);

  const panelToggle = document.createElement('button');
  panelToggle.id = 'mobile-panel-toggle';
  panelToggle.type = 'button';
  panelToggle.textContent = '☰ 面板';
  panelToggle.addEventListener('click', () => {
    document.body.classList.toggle('mobile-panel-open');
    void impact();
  });
  document.body.appendChild(panelToggle);

  const orientationGuard = document.createElement('div');
  orientationGuard.id = 'orientation-guard';
  orientationGuard.innerHTML = '<div><strong>📱 请将设备横过来</strong><span>CoffeeHunter 仅支持横屏游玩</span></div>';
  document.body.appendChild(orientationGuard);
}

// 根据当前场景同步移动端控件显隐，场景切换时自动收起侧栏。
function syncMobileScene(game) {
  const scene = game.state.currentScene || 'main-menu';
  document.body.dataset.scene = scene;
  document.body.classList.remove('mobile-panel-open');
  const panelToggle = document.getElementById('mobile-panel-toggle');
  if (panelToggle) panelToggle.hidden = !SIDEBAR_SCENES.has(scene);
}

// 包装业务存档和场景切换节点，原有 Web 行为保持同步且移动端获得原生增强。
function installGameHooks(game) {
  const originalSaveGame = game.saveGame.bind(game);
  game.saveGame = (...args) => {
    const result = originalSaveGame(...args);
    if (result) void persistNativeSave();
    return result;
  };

  const originalShowScene = game.showScene.bind(game);
  game.showScene = (...args) => {
    const result = originalShowScene(...args);
    syncMobileScene(game);
    return result;
  };
}

// Android 返回键优先关闭移动端浮层，再按游戏流程返回，主菜单才退出应用。
async function installNativeLifecycle(game) {
  if (!isNative) return;
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) game.saveGame();
  });
  await App.addListener('backButton', () => {
    if (document.body.classList.contains('mobile-panel-open')) {
      document.body.classList.remove('mobile-panel-open');
      return;
    }
    if (!document.getElementById('tool-shop-modal')?.classList.contains('hidden')) {
      game.hideToolShop();
      return;
    }
    if (!document.getElementById('progress-modal')?.classList.contains('hidden')) {
      game.hideProgressHub();
      return;
    }
    if (document.querySelector('.options-dialog')) return;
    if (game.state.currentScene === 'main-menu') {
      void App.exitApp();
    } else if (game.state.currentScene === 'explore-scene') {
      game.tryExitExplore();
    } else if (game.state.currentScene === 'shop-scene') {
      game.showScene('workshop-scene');
    } else {
      game.showScene('map-select-scene');
    }
  });
}

// 初始化横屏锁定、沉浸式状态栏和启动屏，失败时仍允许 Web 游戏继续运行。
async function configureNativeShell() {
  document.documentElement.dataset.platform = Capacitor.getPlatform();
  if (!isNative) return;
  const operations = [
    ScreenOrientation.lock({ orientation: 'landscape' }),
    SystemBars.hide(),
    SplashScreen.hide({ fadeOutDuration: 250 })
  ];
  const results = await Promise.allSettled(operations);
  results.filter(result => result.status === 'rejected').forEach(result => {
    console.warn('原生外壳能力初始化失败:', result.reason);
  });
}

// 启动移动端增强；异步恢复存档结束后兼容 DOM 已就绪或仍在加载两种时序。
async function bootstrapMobile() {
  try {
    await hydrateNativeSave();
  } catch (error) {
    console.warn('原生存档恢复失败，继续使用 Web 存档:', error);
  }

  const initialize = () => {
    const game = window.CoffeeHunterGame;
    if (!game) throw new Error('CoffeeHunter 游戏实例未加载。');
    installMobileControls(game);
    installGameHooks(game);
    syncMobileScene(game);
    void installNativeLifecycle(game);
    void configureNativeShell();

    document.addEventListener('click', event => {
      if (event.target.closest('button, .map-card, .customer-card, .inventory-slot, .workstation-slot')) {
        void impact();
      }
    }, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}

void bootstrapMobile();
