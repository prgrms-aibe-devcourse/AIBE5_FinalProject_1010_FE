/**
 * @file room/EndSessionModal.jsx
 * @description 선생님 수업 종료 모달 — 종료 전 오늘 진도 기록(선택) 후 종료. ESC로 닫힘(저장 중 제외).
 */
import { useEffect } from 'react'

export default function EndSessionModal({ open, saving, progress, setProgress, onCancel, onCloseWithout, onCloseWith }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving, onCancel])

  if (!open) return null
  return (
    <div onClick={() => !saving && onCancel()} role="dialog" aria-modal="true" aria-label="수업 종료"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade-in .15s ease' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(460px, calc(100vw - 32px))', background: '#fff', borderRadius: 18, padding: '24px 24px 20px', boxShadow: '0 16px 50px rgba(0,0,0,0.25)', border: '1px solid var(--soft-border,#f3e2c0)' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--soft-text,#451a03)' }}>🎬 수업을 종료할까요?</h2>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--soft-text-dim,#92400e)', lineHeight: 1.5 }}>
          종료하면 모든 참가자의 연결이 끊깁니다.<br />오늘 나간 진도를 남기려면 아래에 적어주세요. (선택)
        </p>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: 'var(--soft-text-dim,#92400e)', background: 'var(--peach-bg,#fef3e2)', padding: '4px 10px', borderRadius: 999 }}>
            📅 오늘({new Date().toLocaleDateString('ko-KR')}) 날짜로 기록됩니다
          </span>
          <textarea
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            disabled={saving}
            rows={4}
            maxLength={1000}
            placeholder="오늘 어디까지 나갔는지 짧게 적어주세요 (예: 3단원 함수 ~ 합성함수까지)"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--soft-border,#e5e7eb)', fontSize: 14, lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <span style={{ alignSelf: 'flex-end', fontSize: 11, color: '#9ca3af' }}>{progress.length}/1000</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" disabled={saving} onClick={onCancel}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--soft-border,#e5e7eb)', background: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', color: '#6b7280' }}>
            취소
          </button>
          <button type="button" disabled={saving} onClick={onCloseWithout}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#6b7280', color: '#fff', fontWeight: 800, fontSize: 13, cursor: saving ? 'default' : 'pointer' }}>
            진도 없이 종료
          </button>
          <button type="button" disabled={saving || !progress.trim()} onClick={onCloseWith}
            style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: (saving || !progress.trim()) ? '#fca5a5' : '#ef4444', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (saving || !progress.trim()) ? 'default' : 'pointer' }}>
            {saving ? '저장 중…' : '진도 저장하고 종료'}
          </button>
        </div>
      </div>
    </div>
  )
}
