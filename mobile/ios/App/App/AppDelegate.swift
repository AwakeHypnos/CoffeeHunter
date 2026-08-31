import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 保留 Capacitor 默认启动入口，移动端业务初始化由 Web 桥接层统一负责。
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // 游戏失去焦点时，Capacitor App 事件会通知 Web 层持久化存档。
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // 后台生命周期保持轻量，存档由移动桥接层写入原生偏好存储。
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // 回到前台时继续使用当前 WebView 和游戏状态。
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // 无额外原生任务需要恢复。
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // 终止前不重复写入；Web 层已在非活跃事件中同步存档。
    }

    // 为 iOS 13 及以上创建唯一窗口场景并交由 CoffeeHunter 场景代理承载。
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
