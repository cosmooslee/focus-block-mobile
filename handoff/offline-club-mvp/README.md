# Offline Club MVP Handoff

This branch carries a Git bundle for the Offline Club iOS SwiftUI MVP that was prepared in Windows Codex.

- Source project branch inside the bundle: `codex/offline-club-mvp`
- Latest local commit inside the bundle: `2059c217e6ff7e0d6e3ee391e71926cd062db37e`
- Bundle SHA-256: `ffe6030b10f775f501533623e5c0711779b875d689c98af00173d4832b86ae15`
- Bundle byte size: `41794`
- Chunk count: `12`

## Restore On MacBook

```bash
mkdir -p ~/Projects/offline-club-handoff
cd ~/Projects/offline-club-handoff

git clone --branch offline-club-mvp-handoff --depth 1 https://github.com/cosmooslee/focus-block-mobile.git handoff-repo
cd handoff-repo

cat handoff/offline-club-mvp/chunk-*.b64 | base64 -D > offline-club-mvp.bundle
shasum -a 256 offline-club-mvp.bundle

git clone offline-club-mvp.bundle offline-club
cd offline-club
git switch codex/offline-club-mvp
```

The `shasum` output should be:

```text
ffe6030b10f775f501533623e5c0711779b875d689c98af00173d4832b86ae15  offline-club-mvp.bundle
```

If your Mac has GNU `base64`, `base64 --decode` also works.

## Continue In MacBook Codex

Open MacBook Codex in the restored `offline-club` folder and paste this prompt:

```text
이 저장소는 Windows Codex에서 이어받은 Offline Club iOS SwiftUI MVP입니다. 먼저 `git status --short --branch`, `bash scripts/mac-bootstrap.sh`, `bash scripts/mac-test.sh`를 실행해서 XcodeGen/Xcode build/test를 검증하고, 이어서 `bash scripts/mac-preview.sh`와 `bash scripts/serve-sim-browser.sh`로 Codex 인앱 브라우저 iPhone simulator preview를 띄워주세요. 빌드 오류가 있으면 수정하고, Home -> Session -> Club -> Rewards -> Profile 플로우를 실제 화면으로 확인하면서 계속 구현해줘.
```

## First Mac Commands

```bash
bash scripts/mac-bootstrap.sh
bash scripts/mac-test.sh
bash scripts/mac-run-simulator.sh
```

For the hot-reload preview, run two terminals:

```bash
bash scripts/mac-preview.sh
bash scripts/serve-sim-browser.sh
```

Open the local `serve-sim` URL in the Codex in-app Browser.
