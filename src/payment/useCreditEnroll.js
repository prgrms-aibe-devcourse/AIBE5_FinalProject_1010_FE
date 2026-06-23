/**
 * @file useCreditEnroll.js
 * @description 크레딧으로 수강 결제하는 흐름을 담은 훅.
 * 결제 진행 상태(paying)·에러(error)·잔액부족 여부(needCharge)를 관리하고,
 * 성공 시 onSuccess 콜백을 호출한다. 뷰(CourseCtaSidebar)에서 로직을 분리한다.
 */
import { useState } from 'react'
import { enrollWithCredit } from '../api/courseApi.js'

export function useCreditEnroll(courseId, { onSuccess } = {}) {
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [needCharge, setNeedCharge] = useState(false)

  async function enroll() {
    if (paying) return
    setError('')
    setNeedCharge(false)
    setPaying(true)
    try {
      const res = await enrollWithCredit(courseId)
      const balance = res?.creditBalance
      window.alert(`수강 신청이 완료되었어요!${balance != null ? ` (남은 크레딧 ${balance.toLocaleString()})` : ''}`)
      if (onSuccess) onSuccess(res)
      else window.location.reload()
    } catch (e) {
      if (e?.code === 'INSUFFICIENT_CREDIT') {
        setNeedCharge(true)
        setError('크레딧이 부족합니다. 충전 후 다시 시도해 주세요.')
      } else {
        setError(e?.message || '수강 신청에 실패했습니다.')
      }
      setPaying(false)
    }
  }

  return { enroll, paying, error, needCharge }
}
