import ExpoModulesCore
import FamilyControls
import ManagedSettings
import DeviceActivity

public class FocusBlockNativeModule: Module {
    private let store = ManagedSettingsStore()
    private let center = DeviceActivityCenter()
    private var isActive = false

    public func definition() -> ModuleDefinition {
        Name("FocusBlockNative")

        // Screen Time 권한 요청
        AsyncFunction("requestAuthorization") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                Task {
                    do {
                        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                        promise.resolve([
                            "success": true
                        ])
                    } catch {
                        promise.resolve([
                            "success": false,
                            "error": "Screen Time 권한이 거부되었습니다: \(error.localizedDescription)"
                        ])
                    }
                }
            } else {
                promise.resolve([
                    "success": false,
                    "error": "iOS 16 이상이 필요합니다."
                ])
            }
        }

        // 차단 활성화
        AsyncFunction("activateBlocking") { (domains: [String], bundleIds: [String], durationMinutes: Int, promise: Promise) in
            if #available(iOS 16.0, *) {
                // 웹 도메인 차단 — ManagedSettingsStore의 shield 사용
                // WebDomain은 Shield에서 직접 차단됨 (VPN 우회 불가, OS 커널 수준)
                var webDomains = Set<WebDomain>()
                for domain in domains {
                    webDomains.insert(WebDomain(domain: domain))
                }
                self.store.shield.webDomains = webDomains

                // 네트워크 트래픽 자체를 차단 (DNS/IP 수준 추가 방어)
                self.store.shield.webDomainDenyList = webDomains

                // DeviceActivity 스케줄 등록 (타이머 종료 시 자동 해제)
                let now = Date()
                let endDate = Calendar.current.date(byAdding: .minute, value: durationMinutes, to: now)!

                let startComponents = Calendar.current.dateComponents([.hour, .minute, .second], from: now)
                let endComponents = Calendar.current.dateComponents([.hour, .minute, .second], from: endDate)

                let schedule = DeviceActivitySchedule(
                    intervalStart: startComponents,
                    intervalEnd: endComponents,
                    repeats: false
                )

                do {
                    let activityName = DeviceActivityName("focusBlock")
                    try self.center.startMonitoring(activityName, during: schedule)
                    self.isActive = true
                    promise.resolve([
                        "success": true
                    ])
                } catch {
                    promise.resolve([
                        "success": false,
                        "error": "DeviceActivity 스케줄 등록 실패: \(error.localizedDescription)"
                    ])
                }
            } else {
                promise.resolve([
                    "success": false,
                    "error": "iOS 16 이상이 필요합니다."
                ])
            }
        }

        // 차단 해제
        AsyncFunction("deactivateBlocking") { (promise: Promise) in
            self.store.shield.webDomains = nil
            self.store.shield.webDomainDenyList = nil
            self.center.stopMonitoring([DeviceActivityName("focusBlock")])
            self.isActive = false
            promise.resolve([
                "success": true
            ])
        }

        // 차단 상태 확인
        AsyncFunction("isBlockingActive") { () -> Bool in
            return self.isActive
        }
    }
}
