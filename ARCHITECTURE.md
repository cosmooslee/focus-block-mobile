# Focus Block — 모바일 앱 아키텍처 설계

## 1. 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    React Native (Expo)                   │
│                   iOS / Android 공통 UI                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 로그인   │  │ 대시보드 │  │ 타이머   │  │ 설정    │ │
│  │ 회원가입 │  │ URL 관리 │  │ 집중모드 │  │ 구독    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │              │       │
│  ┌────▼─────────────▼─────────────▼──────────────▼────┐ │
│  │              Shared Service Layer                   │ │
│  │  Supabase Auth · DB Sync · RevenueCat · Timer      │ │
│  └────┬───────────────────────────────────┬───────────┘ │
└───────┼───────────────────────────────────┼─────────────┘
        │                                   │
  ┌─────▼──────┐                     ┌──────▼──────┐
  │  iOS       │                     │  Android    │
  │  Native    │                     │  Native     │
  │  Module    │                     │  Module     │
  └─────┬──────┘                     └──────┬──────┘
        │                                   │
  ┌─────▼──────────┐              ┌─────────▼─────────┐
  │ Screen Time    │              │ Local VpnService   │
  │ Family Controls│              │ (또는 Accessibility│
  │ Managed Settings│             │  Service)          │
  └────────────────┘              └───────────────────┘
```

---

## 2. 핵심 차단 로직 — 플랫폼별 상세

### 2-1. iOS: Screen Time API (Family Controls / Managed Settings)

**개요**
Apple은 iOS 15+에서 Family Controls 프레임워크를 통해
앱/웹사이트를 프로그래밍 방식으로 차단하는 공식 API를 제공합니다.
App Store 심사에서 유일하게 승인되는 "앱 차단" 방식입니다.

**필요 프레임워크**
- `FamilyControls` — 사용자 인증 및 권한 요청
- `ManagedSettings` — 앱/웹사이트 차단 규칙 적용
- `DeviceActivity` — 사용 시간 모니터링 및 스케줄

**구현 흐름**
```
1. AuthorizationCenter.shared.requestAuthorization(for: .individual)
   → 사용자에게 Screen Time 권한 요청

2. 사용자가 차단할 URL/앱 목록 선택 (ActivityPicker)

3. ManagedSettingsStore().shield.webDomains = Set(...)
   → 선택한 도메인을 실제로 차단

4. DeviceActivitySchedule로 4시간 타이머 등록
   → 시간 종료 시 자동 차단 해제

5. 사용자가 직접 해제 불가 (Shield 표시)
```

**제약/주의점**
- iOS 15+ 필수
- Family Controls entitlement 필요 (Apple Developer에서 별도 신청)
- React Native에서 직접 호출 불가 → Swift Native Module 필요
- Expo에서는 Config Plugin + Dev Client(EAS Build) 사용

---

### 2-2. Android: Local VpnService 기반 차단

**개요**
Android에서는 `VpnService`를 이용해 로컬 VPN 터널을 생성,
기기 내부에서 DNS/HTTP 요청을 가로채 특정 도메인을 차단합니다.
데이터가 외부 서버로 나가지 않아 프라이버시 안전합니다.

**구현 흐름**
```
1. VpnService.prepare(context) → 사용자에게 VPN 권한 요청

2. VPN 터널 생성 (TUN 인터페이스)
   → 모든 네트워크 트래픽이 앱을 통과

3. DNS 요청 파싱
   → 차단 목록에 있는 도메인이면 0.0.0.0 응답 (싱크홀)
   → 아니면 정상 DNS 서버로 포워딩

4. 집중 모드 종료 시 VPN 서비스 stop
   → 차단 자동 해제
```

**대안: Accessibility Service**
- VPN 권한 없이 포그라운드 앱을 감지해서 차단 앱 실행 시 오버레이 표시
- Google Play 정책상 접근성 서비스 사용 심사가 까다로움
- VpnService 방식이 Play Store 승인 가능성이 더 높음

**제약/주의점**
- 사용자가 VPN을 수동 해제할 수 있음 → NotificationListener로 감지 후 경고
- Android 10+ 에서 VPN 앱 허용 정책 확인 필요
- React Native에서 직접 호출 불가 → Kotlin/Java Native Module 필요
- Expo에서는 Config Plugin + Dev Client(EAS Build) 사용

---

## 3. RevenueCat 구독 결제 흐름

### 3-1. 아키텍처

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ 사용자   │────▶│ React Native │────▶│   RevenueCat     │
│ (앱)     │     │ Purchases SDK│     │   서버           │
└──────────┘     └──────┬───────┘     └────────┬────────┘
                        │                      │
                 ┌──────▼───────┐       ┌──────▼────────┐
                 │ App Store /  │       │  Supabase     │
                 │ Play Store   │       │  (권한 동기화)│
                 └──────────────┘       └───────────────┘
```

### 3-2. 사용자 결제 흐름

```
┌─────────────────────────────────────────────────┐
│ 1. 앱 설치 → 회원가입/로그인 (Supabase Auth)     │
│                                                  │
│ 2. 무료 체험 시작 (7일 Free Trial)               │
│    └─ RevenueCat: Offerings에서 Trial 패키지 표시│
│    └─ 사용자가 "무료 체험 시작" 터치             │
│    └─ App Store/Play Store 결제 시트 표시        │
│    └─ 결제 정보 입력 (7일간 과금 없음)           │
│                                                  │
│ 3. 체험 기간 중                                  │
│    └─ RevenueCat SDK로 구독 상태 실시간 확인     │
│    └─ 모든 프리미엄 기능 사용 가능               │
│                                                  │
│ 4. 7일 후 자동 유료 전환                         │
│    └─ 월 $4.99 또는 연 $29.99 자동 과금          │
│    └─ 취소하면 체험 종료 시점에 무료 버전 전환   │
│                                                  │
│ 5. 구독 상태 동기화                              │
│    └─ RevenueCat Webhook → Supabase DB 업데이트  │
│    └─ 앱 실행 시 CustomerInfo로 권한 재확인      │
└─────────────────────────────────────────────────┘
```

### 3-3. 무료 vs 프리미엄 기능 구분

| 기능               | 무료       | 프리미엄     |
|-------------------|------------|-------------|
| URL 등록          | 3개까지    | 무제한       |
| 집중 모드 시간    | 30분 고정  | 1~12시간 자유|
| 차단 강도         | 소프트 차단| 하드 차단    |
| 통계/리포트       | 기본       | 상세 분석    |
| 앱 차단 (iOS)     | ✕          | ✓           |
| 커스텀 차단 스케줄 | ✕          | ✓           |

---

## 4. 기술 스택 정리

| 영역              | 기술                               |
|-------------------|------------------------------------|
| 모바일 프레임워크  | React Native (Expo + Dev Client)   |
| iOS 차단          | Screen Time API (Swift Module)     |
| Android 차단      | VpnService (Kotlin Module)         |
| 인증/DB           | Supabase (Auth + PostgreSQL)       |
| 구독 결제         | RevenueCat                         |
| 웹 랜딩/대시보드  | Next.js (기존 프로젝트 유지)       |
| 배포 (모바일)     | EAS Build + EAS Submit             |
| 배포 (웹)         | Vercel                             |

---

## 5. 개발 로드맵

### Phase 1 — 기초 셋업 (현재)
- [x] Expo 프로젝트 생성
- [ ] Supabase Auth 연동 (로그인/회원가입)
- [ ] 기본 네비게이션 구조 (Auth → Dashboard)
- [ ] URL 관리 CRUD (Supabase 연동)

### Phase 2 — 핵심 차단 기능
- [ ] iOS Screen Time Native Module 구현
- [ ] Android VpnService Native Module 구현
- [ ] 집중 모드 타이머 + 차단 연동
- [ ] EAS Build 파이프라인 구축

### Phase 3 — 구독 결제
- [ ] RevenueCat SDK 연동
- [ ] 구독 Paywall UI 구현
- [ ] 무료/프리미엄 기능 분기 로직
- [ ] Webhook → Supabase 권한 동기화

### Phase 4 — 출시 준비
- [ ] App Store 심사 대응 (Screen Time entitlement)
- [ ] Play Store 정책 대응 (VPN 사용 고지)
- [ ] 랜딩 페이지 (Next.js) 리뉴얼
- [ ] 베타 테스트 (TestFlight / Internal Testing)
- [ ] 정식 출시
