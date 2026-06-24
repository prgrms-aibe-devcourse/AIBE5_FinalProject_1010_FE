# StudyFlow — Frontend

<div align="center">
  <strong>선생님과 학생을 연결하는 양방향 비대면 강의 플랫폼</strong>
  <p>실시간 화상수업 · 공유 화이트보드 · AI 튜터 · QnA 등 상호작용 기반의 학습 환경을 제공합니다.</p>
</div>

---

## 📝 프로젝트 소개

> **"화면을 마주하는 순간, 배움의 거리는 사라집니다."**

선생님과 학생을 이어주는 비대면 학습 공간의 **프론트엔드(React)** 프로젝트입니다.
수업 검색·매칭, 실시간 화상수업 강의실, AI 질의응답, QnA, 마이페이지/관리자 등
사용자 중심의 직관적인 UI/UX를 구축합니다.

---

## 🛠 기술 스택

| 구분 | 기술 |
| :--- | :--- |
| Framework | React 18 + Vite 5 |
| Routing | react-router-dom 6 (HashRouter) |
| Realtime | `@stomp/stompjs` + `sockjs-client` (채팅), `livekit-client` (화상수업) |
| Map | Kakao Maps SDK (CDN, 수업 장소 지정 · 좌표 추출) |
| 문서/수식 | `react-markdown` · `remark-gfm` · `remark-math` · `rehype-katex` · `katex` |
| 파일 | `pdfjs-dist` (PDF 뷰어), `heic2any` (HEIC 변환) |
| Styling | 순수 CSS + CSS Custom Properties (디자인 토큰) |

---

## 💡 주요 화면

- **홈**: 서비스 소개 · 인기 선생님 · LIVE 수업 · QnA 미리보기
- **수업 찾기**: 필터(과목/학년/방식/지역/가격/인원) + 정렬(최신·오래된·가격·**가까운순(GPS 거리)**)
- **선생님 찾기 / 상세**: 선생님 검색 및 프로필
- **수업 등록/수정/상세/대시보드**: 카카오맵으로 대면 수업 장소 지정
- **강의실**: LiveKit 화상수업, 화이트보드, 채팅
- **AI 튜터**: 과목별 AI 질의응답 (SSE 스트리밍)
- **QnA**: 질문 목록·작성·상세
- **마이페이지 / 관리자**

---

## 📂 프로젝트 구조

```
src/
├── main.jsx                  # 엔트리
├── App.jsx                   # HashRouter 라우팅 허브 + 공통 Chrome(Navbar 등)
│
├── api/                      # 백엔드 연동 모듈
│   ├── config.js             # API_BASE 환경별 해석
│   ├── authFetch.js          # 토큰 자동 첨부 fetch 래퍼
│   ├── courseApi.js · enrollmentApi.js · qnaApi.js · aiApi.js ...
│   ├── chatSocket.js · chatApi.js · chatMappers.js   # 실시간 채팅
│   └── voiceConfig.js        # 화상/보이스 ICE 설정
│
├── auth/                     # 토큰 스토어 · 인증 부트스트랩
│
├── components/
│   ├── layout/               # Navbar, Footer, 배경/커서 효과
│   ├── ui/                   # Avatar, Badge 등 재사용 UI
│   ├── icons/ · illustrations/
│   ├── chat/                 # 전역 채팅 위젯
│   └── notifications/
│
├── pages/
│   ├── home/                 # 메인
│   ├── auth/                 # 로그인 · OAuth 추가정보 · 비밀번호 재설정
│   ├── search/               # 수업 찾기 (SearchPage, FilterPanel, CourseCard)
│   ├── teachers/             # 선생님 찾기 · 상세
│   ├── courses/              # 수업 등록/수정/상세/대시보드 (+ KakaoMapPicker)
│   ├── classroom/            # 화상수업 강의실
│   ├── ai/                   # AI 튜터 (lazy load)
│   ├── qna/ · mypage/ · admin/
│
├── styles/                   # 화면별 CSS + common.css(디자인 토큰)
├── hooks/ · utils/ · data/
```

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+ / npm

### 개발 서버

```bash
npm install
npm run dev
```

- `http://localhost:5173` 자동 오픈 (`host: true`라 같은 LAN의 다른 기기에서도 접속 가능)
- 백엔드는 기본적으로 `http://localhost:8080`을 바라봅니다.

### 프로덕션 빌드

```bash
npm run build       # dist/ 에 정적 파일 생성
npm run preview     # 빌드 결과 로컬 미리보기
```

---

## 🔑 환경 변수

`.env.development`, `.env.production`, `.env.local`에 설정합니다. (`*.example` 파일 참고)

| 변수 | 설명 |
| :--- | :--- |
| `VITE_API_BASE` | 백엔드 API 베이스 URL (개발 `http://localhost:8080`, 운영 시 실제 도메인) |
| `VITE_KAKAO_MAP_KEY` | 카카오 지도 JavaScript 키 — **개발자 콘솔에서 허용 도메인(Referer) 등록 필수** |
| `VITE_VOICE_ICE_SERVERS` | (선택) 보이스톡용 STUN/TURN 서버 |

> 카카오 키는 브라우저에 노출되므로 반드시 [개발자 콘솔](https://developers.kakao.com) → 플랫폼 → Web에서
> `http://localhost:5173`, 배포 도메인을 등록해 오남용을 막으세요.

---

## 🧭 주요 라우트

| 경로 | 페이지 | 설명 |
| :--- | :--- | :--- |
| `/` | HomePage | 메인 |
| `/courses` | SearchPage | 수업 찾기 |
| `/courses/new` · `/courses/:id/edit` | Course Create/Edit | 수업 등록/수정 |
| `/courses/:id` · `/courses/:id/dashboard` | Course Detail/Dashboard | 수업 상세 / 대시보드 |
| `/teachers` · `/teachers/:id` | Teacher Search/Detail | 선생님 찾기 |
| `/classroom/:courseId` | ClassroomPage | 화상수업 강의실 |
| `/ai` | AiPage | AI 튜터 |
| `/qna` · `/qna/write` · `/qna/:id` | QnA | 질문 게시판 |
| `/mypage` | MyPage | 마이페이지 |
| `/admin` | AdminPage | 관리자 |
| `/login` · `/password-reset` | Auth | 로그인 / 비밀번호 재설정 |

---

> `AIBE5 데브코스 최종 프로젝트` · StudyFlow Frontend
