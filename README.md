# Focus Block Mobile

iOS/Android 집중 차단 앱입니다.  
React Native(Expo) 기반이며, Supabase 인증/동기화와 네이티브 차단 모듈을 사용합니다.

## 핵심 기능

- 집중 모드(기본 4시간) 카운트다운
- 인기 앱 아이콘 선택 차단 (카테고리 일괄 차단 포함)
- 커스텀 URL 직접 추가/삭제
- Supabase Auth 로그인/회원가입
- Supabase `blocked_urls` 동기화
- 네이티브 차단 구조
  - iOS: Screen Time API (FamilyControls + ManagedSettings)
  - Android: Local VpnService DNS sinkhole

## 기술 스택

- Expo SDK 54
- React Native 0.81
- TypeScript
- Supabase JS
- Expo Modules (커스텀 네이티브 모듈)
- EAS Build / EAS Submit

## 프로젝트 구조

```text
mobile/
├─ src/
│  ├─ data/                 # 앱 카탈로그(카테고리/도메인/번들ID)
│  ├─ lib/                  # Supabase, blockingService
│  └─ screens/              # 로그인, 대시보드
├─ modules/focus-block-native/
│  ├─ ios/                  # Screen Time 모듈
│  └─ android/              # VPN 차단 모듈
├─ plugins/                 # config plugin (iOS entitlement / Android permission)
├─ app.json
├─ eas.json
└─ ARCHITECTURE.md
```

## 로컬 실행

```bash
npm install
npm run dev
```

Expo Go는 네이티브 모듈을 지원하지 않으므로, 실제 차단 테스트는 Dev Client 빌드가 필요합니다.

## iOS Dev Client 빌드

```bash
npm install -g eas-cli
eas login
eas init
eas build --profile development --platform ios
```

## 주요 스크립트

- `npm run dev`: Dev Client 연결용 Metro 서버
- `npm run build:ios:dev`: iOS development 빌드
- `npm run build:ios:preview`: iOS internal 배포 빌드
- `npm run build:ios:prod`: iOS production 빌드

## 환경/계정 요구사항

- Expo 계정
- Apple Developer Program 계정
- Supabase 프로젝트 (Auth + `blocked_urls` 테이블)
- (출시 단계) RevenueCat 설정

## 문서

- 아키텍처: `ARCHITECTURE.md`
- 기여 가이드: `CONTRIBUTING.md`
- 릴리즈 절차: `RELEASE.md`

