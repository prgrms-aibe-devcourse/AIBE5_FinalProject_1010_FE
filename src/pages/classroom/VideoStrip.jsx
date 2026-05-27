/**
 * @file VideoStrip.jsx
 * @description 강의실 왼쪽 참여자 비디오 타일 목록입니다.
 * - 실제 카메라 영상 대신 색상 배경과 이니셜로 참여자를 표현합니다.
 * - speaking, muted, raised 같은 상태 플래그로 UI 배지를 다르게 표시합니다.
 */
/**
 * 강의실 좌측 비디오 타일 스트립.
 */
// 참여자 타일 더미 데이터입니다. 실제 WebRTC 연결 시 participant 목록으로 교체하면 됩니다.
const tiles = [
  { bg: 't1', face: '박', name: '박지훈', role: 'teacher', roleLabel: '👨‍🏫 선생님', speaking: true },
  { bg: 't2', face: '나', name: '이재섭 (나)', role: 'you',  roleLabel: 'YOU', icons: ['🎥', '🎤'] },
  { bg: 't3', face: '민', name: '김민지', raised: true, icons: ['🎤'] },
  { bg: 't4', face: '서', name: '박서준', muted: true },
  { bg: 't5', face: '하', name: '최하윤', icons: ['🎤'] },
  { bg: 't6', face: '지', name: '정지호', muted: true },
  { bg: 't2', face: '예', name: '윤예린', icons: ['🎤'] },
]

export default function VideoStrip() {
  return (
    <aside className="video-strip">
      {tiles.map((t, i) => (
        <div key={i} className={`video-tile ${t.role || ''}`}>
          <div className={`tile-bg ${t.bg}`}></div>
          <div className="tile-face">{t.face}</div>
          {t.role === 'teacher' && <span className="tile-role-badge teacher">{t.roleLabel}</span>}
          {t.role === 'you' && <span className="tile-role-badge you">{t.roleLabel}</span>}
          {t.raised && <span className="tile-raised">✋</span>}
          <div className="tile-meta">
            <span className="tile-name">{t.name}</span>
            <div className="tile-icons">
              {t.speaking && <div className="tile-icon speaking">🔊</div>}
              {t.muted && <div className="tile-icon muted">🚫</div>}
              {t.icons && t.icons.map((ic, j) => <div key={j} className="tile-icon">{ic}</div>)}
            </div>
          </div>
        </div>
      ))}
    </aside>
  )
}
