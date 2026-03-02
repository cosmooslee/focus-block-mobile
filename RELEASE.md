# Release Playbook

## 1) 릴리즈 전 체크

- `main` 최신 상태 pull
- 버전 정책 확인 (`app.json` version)
- Supabase/RevenueCat 운영 설정 확인
- iOS entitlement 상태 확인 (Family Controls 승인 여부)

## 2) 개발 빌드 (내부 테스트)

```bash
eas build --profile development --platform ios
```

내부 QA는 development/preview 빌드로 진행합니다.

## 3) 프리뷰 빌드 (내부 배포)

```bash
eas build --profile preview --platform ios
```

## 4) 프로덕션 빌드

```bash
eas build --profile production --platform ios
```

## 5) 앱스토어 제출

```bash
eas submit --profile production --platform ios
```

## 6) 배포 후 확인

- 구독 상태(RevenueCat entitlement) 정상 여부
- 로그인/세션 복원
- 집중 모드 시작/종료
- 차단 정책 작동 여부
- 크래시/성능 모니터링

