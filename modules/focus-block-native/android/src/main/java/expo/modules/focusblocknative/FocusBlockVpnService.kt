package expo.modules.focusblocknative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Local VPN Service — DNS Sinkhole 기반 도메인 차단
 *
 * 작동 원리:
 * 1. TUN 인터페이스를 만들어 모든 네트워크 트래픽을 가로챔
 * 2. DNS 쿼리를 파싱해서 차단 도메인이면 0.0.0.0 응답
 * 3. 차단 대상이 아닌 트래픽은 정상 DNS 서버로 포워딩
 *
 * VPN 우회 불가 이유:
 * - Android는 VPN 슬롯을 하나만 허용
 * - 이 서비스가 VPN 슬롯을 점유하므로 다른 VPN 동시 사용 불가
 * - 사용자가 VPN 해제 시 onRevoke() 호출 → 즉시 재연결 시도
 */
class FocusBlockVpnService : VpnService() {

    companion object {
        const val TAG = "FocusBlockVPN"
        const val ACTION_START = "expo.modules.focusblocknative.START"
        const val ACTION_STOP = "expo.modules.focusblocknative.STOP"
        const val CHANNEL_ID = "focus_block_vpn"
        const val NOTIFICATION_ID = 1001
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var blockedDomains: List<String> = emptyList()
    private val isRunning = AtomicBoolean(false)
    private var workerThread: Thread? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                blockedDomains = intent.getStringArrayListExtra("domains") ?: emptyList()
                startVpn()
            }
            ACTION_STOP -> {
                stopVpn()
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startVpn() {
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        try {
            val builder = Builder()
                .setSession("Focus Block")
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)
                // Google Public DNS를 통해 정상 트래픽 포워딩
                .addDnsServer("8.8.8.8")
                .addDnsServer("8.8.4.4")
                .setMtu(1500)
                .setBlocking(true)

            // 자기 자신(Focus Block 앱)은 VPN 우회하여 Supabase 통신 가능하게
            try {
                builder.addDisallowedApplication(packageName)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to exclude self from VPN", e)
            }

            vpnInterface = builder.establish()

            if (vpnInterface == null) {
                Log.e(TAG, "VPN interface is null — establish failed")
                return
            }

            isRunning.set(true)
            FocusBlockNativeModule.isActive = true

            workerThread = Thread { runDnsProxy() }
            workerThread?.start()

            Log.i(TAG, "VPN started. Blocking ${blockedDomains.size} domains")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN", e)
        }
    }

    /**
     * DNS 프록시 루프
     * TUN 인터페이스에서 패킷을 읽고, DNS 쿼리를 파싱하여
     * 차단 도메인이면 0.0.0.0 응답, 아니면 통과
     */
    private fun runDnsProxy() {
        val fd = vpnInterface?.fileDescriptor ?: return
        val input = FileInputStream(fd)
        val output = FileOutputStream(fd)
        val buffer = ByteBuffer.allocate(32767)

        while (isRunning.get()) {
            try {
                buffer.clear()
                val length = input.read(buffer.array())
                if (length <= 0) {
                    Thread.sleep(10)
                    continue
                }

                buffer.limit(length)

                // IP 헤더 파싱 (IPv4만)
                val version = (buffer.get(0).toInt() shr 4) and 0xF
                if (version != 4) {
                    // IPv4가 아니면 그냥 통과
                    output.write(buffer.array(), 0, length)
                    continue
                }

                val protocol = buffer.get(9).toInt() and 0xFF
                val headerLength = (buffer.get(0).toInt() and 0xF) * 4

                // UDP(17) 프로토콜, 목적지 포트 53(DNS)인 경우만 처리
                if (protocol == 17 && length > headerLength + 8) {
                    val dstPort = ((buffer.get(headerLength + 2).toInt() and 0xFF) shl 8) or
                            (buffer.get(headerLength + 3).toInt() and 0xFF)

                    if (dstPort == 53) {
                        val dnsPayloadOffset = headerLength + 8
                        val domainName = parseDnsQueryDomain(buffer.array(), dnsPayloadOffset, length)

                        if (domainName != null && shouldBlock(domainName)) {
                            Log.d(TAG, "BLOCKED: $domainName")
                            val response = buildDnsBlockResponse(buffer.array(), length, headerLength)
                            if (response != null) {
                                output.write(response)
                                continue
                            }
                        }
                    }
                }

                // 차단 대상이 아닌 패킷은 그대로 전달
                output.write(buffer.array(), 0, length)

            } catch (e: InterruptedException) {
                break
            } catch (e: Exception) {
                if (isRunning.get()) {
                    Log.w(TAG, "DNS proxy error", e)
                }
            }
        }
    }

    /**
     * DNS 쿼리에서 도메인 이름 추출
     */
    private fun parseDnsQueryDomain(data: ByteArray, offset: Int, length: Int): String? {
        try {
            // DNS 헤더는 12바이트
            var pos = offset + 12
            val sb = StringBuilder()

            while (pos < length) {
                val labelLength = data[pos].toInt() and 0xFF
                if (labelLength == 0) break
                if (sb.isNotEmpty()) sb.append('.')
                pos++
                for (i in 0 until labelLength) {
                    if (pos + i >= length) return null
                    sb.append(data[pos + i].toInt().toChar())
                }
                pos += labelLength
            }

            return sb.toString().lowercase()
        } catch (e: Exception) {
            return null
        }
    }

    /**
     * 도메인이 차단 대상인지 확인 (서브도메인도 매칭)
     */
    private fun shouldBlock(domain: String): Boolean {
        return blockedDomains.any { blocked ->
            domain == blocked || domain.endsWith(".$blocked")
        }
    }

    /**
     * 차단 DNS 응답 생성 (0.0.0.0 반환)
     * IP 헤더의 src/dst를 뒤집고, DNS answer에 0.0.0.0을 넣음
     */
    private fun buildDnsBlockResponse(
        originalPacket: ByteArray,
        packetLength: Int,
        ipHeaderLength: Int,
    ): ByteArray? {
        try {
            val response = originalPacket.copyOf(packetLength)

            // IP 헤더: src ↔ dst 교환
            for (i in 0..3) {
                val tmp = response[12 + i]
                response[12 + i] = response[16 + i]
                response[16 + i] = tmp
            }

            // UDP 헤더: src port ↔ dst port 교환
            val udpOffset = ipHeaderLength
            for (i in 0..1) {
                val tmp = response[udpOffset + i]
                response[udpOffset + i] = response[udpOffset + 2 + i]
                response[udpOffset + 2 + i] = tmp
            }

            // DNS 헤더 수정
            val dnsOffset = ipHeaderLength + 8
            // QR 비트를 1로 (응답), AA 비트 설정
            response[dnsOffset + 2] = (0x85).toByte()
            response[dnsOffset + 3] = (0x80).toByte()
            // Answer count = 1
            response[dnsOffset + 6] = 0
            response[dnsOffset + 7] = 1

            // DNS Answer 추가 (쿼리 뒤에 pointer + type A + class IN + TTL + 0.0.0.0)
            val answerBytes = byteArrayOf(
                0xC0.toByte(), 0x0C,       // Name pointer (쿼리의 이름 참조)
                0x00, 0x01,                // Type A
                0x00, 0x01,                // Class IN
                0x00, 0x00, 0x00, 0x3C,    // TTL: 60초
                0x00, 0x04,                // Data length: 4
                0x00, 0x00, 0x00, 0x00     // IP: 0.0.0.0 (싱크홀)
            )

            val result = ByteArray(packetLength + answerBytes.size)
            System.arraycopy(response, 0, result, 0, packetLength)
            System.arraycopy(answerBytes, 0, result, packetLength, answerBytes.size)

            // IP total length 업데이트
            val totalLength = result.size
            result[2] = ((totalLength shr 8) and 0xFF).toByte()
            result[3] = (totalLength and 0xFF).toByte()

            // UDP length 업데이트
            val udpLength = totalLength - ipHeaderLength
            result[udpOffset + 4] = ((udpLength shr 8) and 0xFF).toByte()
            result[udpOffset + 5] = (udpLength and 0xFF).toByte()

            return result
        } catch (e: Exception) {
            Log.w(TAG, "Failed to build DNS block response", e)
            return null
        }
    }

    private fun stopVpn() {
        isRunning.set(false)
        FocusBlockNativeModule.isActive = false
        workerThread?.interrupt()
        workerThread = null
        vpnInterface?.close()
        vpnInterface = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        Log.i(TAG, "VPN stopped")
    }

    // 사용자가 시스템에서 VPN을 해제하려 할 때 호출됨
    override fun onRevoke() {
        Log.w(TAG, "VPN revoked by user — attempting restart")
        stopVpn()
        // 즉시 재시작 시도 (강제 차단 유지)
        val restartIntent = Intent(this, FocusBlockVpnService::class.java).apply {
            action = ACTION_START
            putStringArrayListExtra("domains", ArrayList(blockedDomains))
        }
        startForegroundService(restartIntent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Focus Block 집중 모드",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "집중 모드가 활성화되어 있습니다"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("집중 모드 진행 중")
            .setContentText("${blockedDomains.size}개 사이트가 차단되었습니다")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
