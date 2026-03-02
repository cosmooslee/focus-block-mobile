const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Android Config Plugin — VPN Service 사용에 필요한 permissions/service 선언
 *
 * AndroidManifest.xml에 아래를 추가:
 * - FOREGROUND_SERVICE 권한
 * - FOREGROUND_SERVICE_SPECIAL_USE 권한
 * - FocusBlockVpnService 서비스 등록
 *
 * 참고: 모듈 자체 AndroidManifest.xml에도 선언되어 있지만,
 * 빌드 시 merge 순서에 따라 누락될 수 있어 plugin에서도 보장합니다.
 */
function withVpnPermissions(config) {
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // permissions 추가
    const permissions = manifest["uses-permission"] || [];
    const requiredPerms = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.INTERNET",
    ];

    for (const perm of requiredPerms) {
      const exists = permissions.some(
        (p) => p.$?.["android:name"] === perm,
      );
      if (!exists) {
        permissions.push({
          $: { "android:name": perm },
        });
      }
    }
    manifest["uses-permission"] = permissions;

    // VPN 서비스가 이미 모듈 manifest에 등록되어 있으므로
    // 여기서는 permission만 보장

    return mod;
  });

  return config;
}

module.exports = withVpnPermissions;
