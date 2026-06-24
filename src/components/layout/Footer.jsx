/**
 * @file Footer.jsx
 * @description 메인 페이지 하단 푸터입니다.
 * - 브랜드 설명, 서비스 링크, 고객지원, 회사 정보를 정적으로 보여줍니다.
 * - 실제 링크 연결이 필요하면 각 li를 Link 또는 a 태그로 교체하면 됩니다.
 */
/**
 * 푸터 컴포넌트.
 * 4단 그리드(브랜드 + 서비스/지원/회사 링크) + 카피라이트
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div>
          <div className="logo" style={{ marginBottom: 12 }}>
            <span className="logo-mark">S</span>
            Study Flow
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#9CA3AF' }}>
            양방향 화상 교육 플랫폼<br />
            선생님과 학생이 함께 만들어가는 진짜 수업
          </p>
        </div>
        <div>
          <h4>서비스</h4>
          <ul><li>수업 찾기</li><li>선생님 찾기</li><li>AI 질문</li><li>질문게시판</li></ul>
        </div>
        <div>
          <h4>고객지원</h4>
          <ul><li>공지사항</li><li>자주 묻는 질문</li><li>1:1 문의</li><li>이용약관</li></ul>
        </div>
        <div>
          <h4>회사</h4>
          <ul><li>회사 소개</li><li>채용</li><li>제휴문의</li><li>개인정보 처리방침</li></ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Study Flow. All rights reserved.</span>
        <span>AIBE5 데브코스 최종 프로젝트 10팀</span>
      </div>
    </footer>
  )
}
