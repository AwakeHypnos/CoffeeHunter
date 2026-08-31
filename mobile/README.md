# CoffeeHunter Mobile

本目录是 CoffeeHunter 的 iOS/Android 原生外壳，应用标识为 `com.AwakeHypnos.coffeehunter`，仅支持横屏。
当前发布版本统一为 `0.1.0 (build 1)`，发布产物使用 `CoffeeHunter-0.1.0-build1` 前缀命名。

## 结构

- 根目录 `../game.html` 与 `../src/game-v2.js` 是唯一玩法业务源。
- `scripts/prepare-web.mjs` 在构建时生成移动端入口，不提交生成目录。
- `src/mobile.css` 负责横屏、安全区和触控布局。
- `src/mobile-bridge.js` 负责原生存档、生命周期、返回键、震动和方向锁定。
- `ios/` 与 `android/` 是 Capacitor 原生工程。

## 常用命令

```bash
npm install
npm run sync
npm run open:ios
npm run open:android
```

## 构建与验证

- Node.js 22+、Xcode 26+、Android SDK 36。
- Android 构建必须使用 Java 21；本机可显式设置
  `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`。
- `npm run verify`：生成 Web 资源并执行移动布局测试。
- `npm run sync`：同步 Web 资源与原生插件。
- 在 `android/` 目录执行 `./gradlew assembleDebug`：生成本地调试 APK。
- 在 `android/` 目录执行 `./gradlew bundleRelease`：生成待签名的 Google Play AAB。
- 在 `android/` 目录执行 `./gradlew :app:testDebugUnitTest :app:connectedDebugAndroidTest`：只运行应用层测试。
- iOS 在 `ios/App/App.xcodeproj` 中选择开发团队后 Archive。

## 上架前清单

- 替换 Capacitor 默认图标与启动图，并准备 iPhone、iPad、Android 商店截图。
- 配置 Apple Distribution / App Store Connect 和 Android upload keystore / Play Console。
- 确认版本号、应用分类、年龄分级、隐私政策 URL、支持 URL 与商店文案。
- 在至少一台 iPhone、一台 iPad 和一台 Android 真机完成完整游玩、后台恢复与存档升级回归。

当前原生工程、隐私清单、横屏限制与离线资源均已就位；未包含账号、证书、正式品牌素材或商店上传动作。
