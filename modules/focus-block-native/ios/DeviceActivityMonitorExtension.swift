import DeviceActivity
import ManagedSettings

/// DeviceActivity Extension — 타이머 종료 시 자동으로 차단 해제
/// 이 Extension은 앱이 꺼져 있어도 OS가 직접 실행합니다.
/// Xcode에서 "DeviceActivityMonitor" Extension Target으로 추가 필요.
class FocusBlockMonitor: DeviceActivityMonitor {

    let store = ManagedSettingsStore()

    // 집중 모드 시간이 끝났을 때 OS가 호출
    override func intervalDidEnd(for activity: DeviceActivityName) {
        // 모든 shield 해제
        store.shield.webDomains = nil
        store.shield.webDomainDenyList = nil
        store.clearAllSettings()
    }

    // 집중 모드가 시작될 때 (확인용)
    override func intervalDidStart(for activity: DeviceActivityName) {
        // 차단이 이미 FocusBlockNativeModule에서 설정됨
        // 추가 로직이 필요하면 여기에
    }
}
