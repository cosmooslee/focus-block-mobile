package expo.modules.focusblocknative

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class FocusBlockNativeModule : Module() {
    companion object {
        const val VPN_REQUEST_CODE = 24601
        var blockedDomains: List<String> = emptyList()
        var durationMinutes: Int = 240
        var isActive: Boolean = false
        var pendingPromise: Promise? = null
    }

    override fun definition() = ModuleDefinition {
        Name("FocusBlockNative")

        // VPN 권한 요청 (Android에서는 VPN consent 필요)
        AsyncFunction("requestAuthorization") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.resolve(mapOf(
                    "success" to false,
                    "error" to "Activity를 찾을 수 없습니다."
                ))
                return@AsyncFunction
            }

            val vpnIntent = VpnService.prepare(activity)
            if (vpnIntent != null) {
                pendingPromise = promise
                activity.startActivityForResult(vpnIntent, VPN_REQUEST_CODE)
            } else {
                // 이미 VPN 권한 있음
                promise.resolve(mapOf("success" to true))
            }
        }

        // 차단 활성화 — Local VPN 시작
        AsyncFunction("activateBlocking") { domains: List<String>, _bundleIds: List<String>, duration: Int, promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.resolve(mapOf(
                    "success" to false,
                    "error" to "Activity를 찾을 수 없습니다."
                ))
                return@AsyncFunction
            }

            // VPN 권한 확인
            val vpnIntent = VpnService.prepare(activity)
            if (vpnIntent != null) {
                promise.resolve(mapOf(
                    "success" to false,
                    "error" to "VPN 권한이 필요합니다. 먼저 requestAuthorization을 호출하세요."
                ))
                return@AsyncFunction
            }

            blockedDomains = domains
            durationMinutes = duration

            // VPN 서비스 시작
            val serviceIntent = Intent(activity, FocusBlockVpnService::class.java).apply {
                action = FocusBlockVpnService.ACTION_START
                putStringArrayListExtra("domains", ArrayList(domains))
                putExtra("duration", duration)
            }

            activity.startForegroundService(serviceIntent)
            isActive = true

            promise.resolve(mapOf("success" to true))
        }

        // 차단 해제 — Local VPN 중지
        AsyncFunction("deactivateBlocking") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity != null) {
                val serviceIntent = Intent(activity, FocusBlockVpnService::class.java).apply {
                    action = FocusBlockVpnService.ACTION_STOP
                }
                activity.startService(serviceIntent)
            }

            blockedDomains = emptyList()
            isActive = false

            promise.resolve(mapOf("success" to true))
        }

        // 차단 상태 확인
        Function("isBlockingActive") {
            return@Function isActive
        }
    }
}
