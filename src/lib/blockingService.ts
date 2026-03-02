import { Platform } from "react-native";
import { getAllDomains, getAllApps } from "../data/apps";

export type BlockTarget = {
  appIds: string[];
  customUrls: string[];
};

/**
 * 네이티브 모듈 동적 로드
 * Expo Go에서는 네이티브 모듈을 쓸 수 없으므로,
 * Dev Client(EAS Build)에서만 실제 모듈을 로드합니다.
 */
function getNativeModule() {
  try {
    return require("../../modules/focus-block-native");
  } catch {
    return null;
  }
}

function extractDomain(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith("http")) {
    cleaned = `https://${cleaned}`;
  }
  try {
    return new URL(cleaned).hostname;
  } catch {
    return url.trim().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

export function buildBlockList(target: BlockTarget): {
  domains: string[];
  bundleIds: string[];
} {
  const appDomains = getAllDomains(target.appIds);

  const customDomains = target.customUrls
    .map(extractDomain)
    .filter((d) => d.length > 0);

  const domains = Array.from(new Set([...appDomains, ...customDomains]));

  const allApps = getAllApps();
  const selectedApps = allApps.filter((app) => target.appIds.includes(app.id));

  const bundleIds: string[] = [];
  for (const app of selectedApps) {
    if (Platform.OS === "ios" && app.bundleId.ios) {
      bundleIds.push(app.bundleId.ios);
    } else if (Platform.OS === "android" && app.bundleId.android) {
      bundleIds.push(app.bundleId.android);
    }
  }

  return { domains, bundleIds };
}

/**
 * 1단계: 권한 요청
 * - iOS: Screen Time 권한 (FamilyControls authorization)
 * - Android: VPN 권한 (VpnService.prepare)
 */
export async function requestAuthorization(): Promise<{
  success: boolean;
  error?: string;
}> {
  const native = getNativeModule();

  if (!native) {
    console.warn("[BlockingService] 네이티브 모듈 없음 — Expo Go에서는 차단 불가");
    return { success: true };
  }

  return native.requestAuthorization();
}

/**
 * 2단계: 차단 활성화
 * - iOS: ManagedSettingsStore에 shield 등록 + DeviceActivity 스케줄
 * - Android: VpnService 시작 → DNS 싱크홀로 도메인 차단
 *
 * VPN 우회 불가 원리:
 * - iOS: OS 커널 수준 차단 (네트워크 계층 아님)
 * - Android: 유일한 VPN 슬롯 점유 → 다른 VPN 동시 작동 불가
 */
export async function activateBlocking(
  target: BlockTarget,
  durationMinutes: number = 240,
): Promise<{ success: boolean; error?: string }> {
  const { domains, bundleIds } = buildBlockList(target);

  if (domains.length === 0 && bundleIds.length === 0) {
    return { success: false, error: "차단할 대상이 없습니다." };
  }

  const native = getNativeModule();

  if (!native) {
    console.warn("[BlockingService] 네이티브 모듈 없음 — 시뮬레이션 모드");
    console.log(`[시뮬레이션] ${domains.length}개 도메인, ${bundleIds.length}개 앱 차단 활성화`);
    return { success: true };
  }

  // 먼저 권한 확인/요청
  const authResult = await native.requestAuthorization();
  if (!authResult.success) {
    return authResult;
  }

  return native.activateBlocking(domains, bundleIds, durationMinutes);
}

/**
 * 3단계: 차단 해제
 * - iOS: ManagedSettingsStore 초기화 + DeviceActivity 모니터링 중지
 * - Android: VpnService 종료
 */
export async function deactivateBlocking(): Promise<{
  success: boolean;
  error?: string;
}> {
  const native = getNativeModule();

  if (!native) {
    console.warn("[BlockingService] 네이티브 모듈 없음 — 시뮬레이션 모드");
    return { success: true };
  }

  return native.deactivateBlocking();
}

/**
 * 현재 차단 상태 확인
 */
export async function isBlockingActive(): Promise<boolean> {
  const native = getNativeModule();

  if (!native) {
    return false;
  }

  return native.isBlockingActive();
}
