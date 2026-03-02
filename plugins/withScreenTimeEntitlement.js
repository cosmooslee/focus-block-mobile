const { withEntitlementsPlist, withInfoPlist } = require("expo/config-plugins");

/**
 * iOS Config Plugin — Screen Time API 사용에 필요한 entitlement/info.plist 추가
 *
 * - com.apple.developer.family-controls (Family Controls 권한)
 * - NSFamilyControlsUsageDescription (권한 요청 시 표시 문구)
 */
function withScreenTimeEntitlement(config) {
  // 1) Entitlements에 FamilyControls 추가
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.developer.family-controls"] = true;
    return mod;
  });

  // 2) Info.plist에 사용 설명 추가
  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSFamilyControlsUsageDescription =
      "집중 모드에서 선택한 앱과 웹사이트를 차단하기 위해 Screen Time 접근 권한이 필요합니다.";
    return mod;
  });

  return config;
}

module.exports = withScreenTimeEntitlement;
