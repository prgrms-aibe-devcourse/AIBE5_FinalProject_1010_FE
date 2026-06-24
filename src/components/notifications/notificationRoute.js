/**
 * @file notificationRoute.js
 * @description 알림 타입/relatedId → 클릭 시 이동할 경로 매핑.
 * BE NotificationType과 1:1 대응한다.
 */

/**
 * 알림을 클릭했을 때 이동할 경로를 반환한다. 매핑이 없으면 null(이동 없음).
 * @param {{ type: string, relatedId?: number|null }} n
 * @returns {string|null}
 */
export function notificationRoute(n) {
  switch (n?.type) {
    // 선생님이 받는 신청 관련 알림 → 수강 신청 받은 목록 탭
    case 'ENROLLMENT_REQUESTED':
    case 'ENROLLMENT_CANCELLED':
      return '/mypage?tab=req'
    // 학생이 받는 수락/거절 알림 → 신청 내역 탭
    case 'ENROLLMENT_ACCEPTED':
    case 'ENROLLMENT_REJECTED':
      return '/mypage?tab=apply'
    // QnA 답변 / 답변 채택 → 해당 질문 상세
    case 'QNA_ANSWERED':
    case 'QNA_ANSWER_ACCEPTED':
      return n.relatedId != null ? `/qna/${n.relatedId}` : '/qna'
    // 강의실 열림 → 해당 강의실(relatedId = courseId)
    case 'CLASSROOM_OPENED':
      return n.relatedId != null ? `/classroom/${n.relatedId}` : null
    // 관리자 인증 완료 → 인증 탭
    case 'TEACHER_VERIFIED':
      return '/mypage?tab=verify'
    default:
      return null
  }
}
