import LoginHistoryView from './LoginHistoryView.jsx'

export default function LoginHistoryTab() {
  return (
    <div className="mp-block">
      <h2 className="mp-block-title">로그인 기록</h2>
      <LoginHistoryView variant="mypage" />
    </div>
  )
}
