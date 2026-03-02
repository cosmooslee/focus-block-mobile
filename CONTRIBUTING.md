# Contributing Guide

## 브랜치 전략

- `main`: 배포 기준 브랜치
- 기능 개발: `feature/<topic>`
- 버그 수정: `fix/<topic>`

## 개발 규칙

- TypeScript strict 모드 유지
- 네이티브 코드(iOS/Android)는 각각 플랫폼 폴더에서만 수정
- 민감정보(API 키, 토큰, 인증서)는 절대 커밋 금지
- 기능 추가 시 관련 문서(`README.md`, `ARCHITECTURE.md`) 함께 갱신

## 커밋 메시지 권장 형식

- `feat: ...` 새 기능
- `fix: ...` 버그 수정
- `refactor: ...` 구조 개선
- `docs: ...` 문서 수정
- `chore: ...` 기타 설정/의존성

예시:

```text
feat: add iOS screentime activation flow
fix: handle vpn permission denial on android
```

## PR 체크리스트

- [ ] 앱 실행 확인 (`npm run dev`)
- [ ] 타입 오류 없음
- [ ] 문서 갱신 여부 확인
- [ ] 민감정보 커밋 여부 확인
- [ ] iOS/Android 영향 범위 설명 작성

## 테스트 가이드

- 로그인/회원가입 플로우
- 앱 선택/카테고리 차단 토글
- URL 추가/삭제
- 집중 모드 시작/종료 타이머
- 네이티브 권한 요청(iOS Screen Time, Android VPN)

