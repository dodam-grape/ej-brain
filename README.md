# 은정 Brain

업무, 육아, 자산, 부동산·이사, 자기계발과 목표관리를 한곳에서 관리하는 개인용 웹앱입니다. PC에서는 왼쪽 메뉴, 모바일에서는 하단 고정 메뉴로 자동 전환됩니다.

## GitHub Pages 업로드

1. GitHub에서 새 저장소를 만듭니다. 저장소 이름 예시: `eunjeong-brain`
2. 이 폴더 안의 파일을 모두 저장소 최상단에 올립니다. `index.html`이 폴더 안쪽이 아니라 가장 위에 있어야 합니다.
3. 저장소의 `Settings → Pages`로 이동합니다.
4. `Source`는 `Deploy from a branch`, `Branch`는 `main`, 폴더는 `/ (root)`를 선택하고 저장합니다.
5. 잠시 후 `https://사용자이름.github.io/eunjeong-brain/` 주소로 접속합니다.

## 저장과 PC·모바일 동기화

Firebase 설정 전에도 입력한 내용은 현재 브라우저에 자동 저장됩니다. PC와 모바일에서 동일한 데이터를 보려면 다음 설정을 한 번 진행합니다.

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 만듭니다.
2. 프로젝트에 웹 앱을 추가하고 표시되는 `firebaseConfig` 값을 복사합니다.
3. `Authentication → Sign-in method`에서 Google 로그인을 사용 설정합니다.
4. `Authentication → Settings → Authorized domains`에 `사용자이름.github.io`를 추가합니다.
5. `Firestore Database`를 만들고 프로덕션 모드로 시작합니다.
6. 이 폴더의 `firestore.rules` 내용을 Firebase의 Firestore 규칙 화면에 붙여넣고 게시합니다.
7. `firebase-config.js`의 빈 값에 Firebase에서 받은 값을 넣고 GitHub에 다시 올립니다.
8. 은정 Brain의 왼쪽 아래 구름 버튼을 눌러 PC와 모바일에서 같은 Google 계정으로 로그인합니다.

설정 후에는 할 일, 일정, 가계부, 자산정보와 각종 체크리스트가 기기 사이에서 자동으로 동기화됩니다.

## 1차 기능

- Brain 빠른 수집과 업무·육아·자산·이사·자기계발·목표 스마트 분류
- 업무 대시보드, 업무계획, 업무 달력
- 할 일과 일정 입력·완료 처리
- 도담·소담 기본 화면과 교육 로드맵
- 자산 대시보드, 현 자산현황, 가계부, 월별 지출 분석
- 부동산·이사 준비 체크리스트
- 자기계발 및 목표 진척도

요청에 따라 블로그 메뉴는 포함하지 않았습니다.
