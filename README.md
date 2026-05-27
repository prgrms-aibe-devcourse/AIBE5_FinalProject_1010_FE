# Team10_1010_Frontend

<div align="center">
  <strong>선생님과 학생을 연결하는 양방향 비대면 강의 플랫폼</strong>
  <p>실시간 화이트보드 · 화상통화 · QnA 등 상호작용 기반의 양방향 비대면 강의 환경을 제공합니다.</p>
</div>

---

## 📝 프로젝트 소개 (Introduction)

> **"화면을 마주하는 순간, 배움의 거리는 사라집니다."**
> 
> **페이스터디(FaceStudy)**는 선생님과 학생을 이어주는 가장 완벽한 비대면 학습 공간입니다. 
> 단순한 일방향 영상 송출을 넘어, 실시간 화이트보드 협업, 화상 통화, 그리고 AI 튜터링을 결합한 상호작용 중심의 교육 솔루션을 지향합니다.

본 저장소는 **FaceStudy** 플랫폼의 웹 실시간 캔버스 필기, WebRTC 화상 회의 윈도우, AI 질의응답 피드백 뷰 등 사용자 중심의 역동적이고 직관적인 UI/UX를 구축하는 **프론트엔드(Frontend)** 프로젝트입니다.

---

# StudyFlow — React App

`StudyFlow` 토이프로젝트의 프론트 화면을 React로 구성한 버전입니다.
페이지/기능별 컴포넌트로 분리되어 있어 개발/유지보수가 쉽습니다.

## 빠른 시작

### 미리보기만 보고 싶을 때 (npm 불필요)
`../studyflow-preview/index.html` 더블클릭

### 개발 서버 실행

```bash
cd studyflow-app
rmdir /s /q node_modules   # ← 윈도우에서 처음 한 번만 (sandbox symlink 정리)
npm install
npm run dev
```

브라우저가 자동으로 `http://localhost:5173` 으로 열립니다.

### 프로덕션 빌드

```bash
npm run build           # dist/ 폴더에 정적 파일 생성
```

## 폴더 구조

```
studyflow-app/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx                       # 엔트리
    ├── App.jsx                        # HashRouter + 5개 라우트
    │
    ├── styles/                        # CSS 분리 — 변경하기 쉽게
    │   ├── index.css                  # 마스터 import
    │   ├── common.css                 # 디자인 토큰 (색/타이포/그림자)
    │   ├── home.css                   # 메인 페이지 스타일
    │   ├── login.css
    │   ├── search.css
    │   └── classroom.css
    │
    ├── data/                          # 더미 데이터 (백엔드 연동 시 fetch로 교체)
    │   ├── categories.js              # 분야별 카테고리
    │   ├── liveClasses.js             # 진행 중 LIVE 수업
    │   ├── teachers.js                # 인기 선생님
    │   ├── questions.js               # QnA 게시판 질문
    │   ├── features.js                # Why StudyFlow 6가지
    │   └── courses.js                 # 강의 카드
    │
    ├── hooks/                         # 커스텀 훅
    │   └── useMouseTilt.js            # 카드 3D tilt 효과
    │
    ├── components/
    │   ├── layout/                    # 페이지 골격
    │   │   ├── Navbar.jsx             # 상단 네비게이션 (NavLink)
    │   │   ├── Footer.jsx
    │   │   ├── CursorEffects.jsx      # 마우스 도트 + 글로우
    │   │   └── BgShapes.jsx           # 배경 블롭 (마우스 패럴랙스)
    │   │
    │   ├── ui/                        # 재사용 UI
    │   │   ├── Avatar.jsx
    │   │   ├── Badge.jsx
    │   │   └── Eyebrow.jsx
    │   │
    │   └── illustrations/
    │       └── HeroIllustration.jsx   # Hero SVG + 눈동자 트래킹
    │
    └── pages/
        ├── home/                      # 메인 페이지 — 8 섹션 + 합치는 HomePage
        │   ├── HomePage.jsx
        │   ├── HeroSection.jsx
        │   ├── CategoriesSection.jsx
        │   ├── LiveNowSection.jsx
        │   ├── TopTeachersSection.jsx
        │   ├── StatsBannerSection.jsx
        │   ├── QnaBoardSection.jsx    # 새로 추가된 질문게시판
        │   ├── QnaImages.jsx          # QnA 카드용 손그림 SVG
        │   ├── FeaturesSection.jsx
        │   └── CTASection.jsx
        │
        ├── auth/
        │   └── LoginPage.jsx          # 탭으로 로그인/회원가입
        │
        ├── search/                    # 수업 검색 페이지
        │   ├── SearchPage.jsx
        │   ├── FilterPanel.jsx
        │   └── CourseCard.jsx
        │
        └── classroom/                 # 화상수업 페이지
            ├── ClassroomPage.jsx
            ├── ClassroomTopBar.jsx
            ├── VideoStrip.jsx
            ├── Whiteboard.jsx
            ├── ChatSidebar.jsx
            └── BottomControls.jsx
```


## 주석 읽는 방법

이번 버전은 개발 중 바로 이해하고 수정할 수 있도록 코드 주석을 보강했습니다.

- 각 파일 상단의 `@file` 주석: 이 파일이 어떤 화면/기능을 담당하는지, 어디를 수정하면 되는지 설명합니다.
- JSX 내부 주석: 상태값, 조건부 렌더링, 더미 데이터가 실제 API로 바뀔 지점을 설명합니다.
- CSS 주석: 화면 단위 레이아웃과 주요 selector가 어떤 컴포넌트와 연결되는지 설명합니다.
- `src/data/*.js`: 백엔드 연동 전 임시 데이터입니다. API를 붙일 때는 이 구조를 기준으로 응답을 맞추거나 매핑하면 됩니다.

## 개발 가이드

### 새 섹션 추가
1. `src/pages/home/MySection.jsx` 컴포넌트 생성
2. `src/pages/home/HomePage.jsx` 의 JSX에 import + 추가
3. 스타일은 `src/styles/home.css` 에 추가

### 더미 데이터를 백엔드 API로 교체
1. `src/data/*.js` 의 export를 그대로 두고
2. 컴포넌트 안에서 `useEffect` + `fetch('/api/...')` 으로 받아오기
3. `vite.config.js` 에 `/api` 프록시 추가:
```js
server: {
  proxy: { '/api': 'http://localhost:8080' }
}
```

### 새 페이지 추가
1. `src/pages/foo/FooPage.jsx` 생성
2. `src/App.jsx` 에 `<Route path="/foo" element={<FooPage />} />` 추가
3. `Navbar.jsx` 에 NavLink 추가

## 라우트

| 경로          | 컴포넌트          | 설명 |
|---------------|------------------|------|
| `/`           | HomePage         | 메인 (8개 섹션) |
| `/search`     | SearchPage       | 수업 찾기 |
| `/login`      | LoginPage        | 로그인 / 회원가입 |
| `/classroom`  | ClassroomPage    | 화상 수업 강의실 |

(`/qna` , `/ai` 는 일단 HomePage 로 라우팅, 추후 분리 페이지로 확장 예정)

## 기술 스택

- **React 18** + **Vite 5** (HMR + 빠른 빌드)
- **react-router-dom 6** (HashRouter — file:// 환경 호환)
- **순수 CSS** + CSS Custom Properties (테마/디자인 토큰)
- **번들 외부 의존성 없음** (가볍게 유지)

---

`AIBE5 데브코스 2차 프로젝트 7팀`
