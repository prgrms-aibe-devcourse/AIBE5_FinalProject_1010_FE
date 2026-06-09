/**
 * @file QnaWritePage.jsx
 * @description 질문 작성/수정 겸용 페이지.
 *              - 작성: /qna/write — 과목·제목·내용·이미지(여러 장)를 받아 질문을 생성한다.
 *              - 수정: /qna/:questionId/edit — 기존 질문을 불러와 폼을 채운 뒤 PATCH로 수정한다.
 *                이미지는 "기존 이미지 중 남길 것 + 새로 추가한 것"을 합쳐 imageFileIds로 보낸다.
 *                (백엔드 상세 응답이 이미지마다 fileId를 주므로 일부만 삭제/추가가 가능하다.)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createQuestion, fetchQuestionDetail, updateQuestion } from '../../api/qnaApi.js'
import { fetchSubjects } from '../../api/subjectApi.js'
import { prepareImageForUpload, toAbsoluteFileUrl, uploadQnaImage } from '../../api/fileApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'

const TITLE_MAX = 200
const BODY_MAX = 4000

export default function QnaWritePage() {
  const navigate = useNavigate()
  const { questionId } = useParams()
  const isEdit = Boolean(questionId)

  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ subjectId: '', title: '', body: '' })
  const [files, setFiles] = useState([]) // 새로 추가한 File[]
  const [existingImages, setExistingImages] = useState([]) // 기존 첨부 [{fileId, url}] — 수정 모드, X로 개별 삭제 가능
  const [submitting, setSubmitting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(isEdit)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // 과목 목록 로드 (작성·수정 공통)
  useEffect(() => {
    fetchSubjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        setSubjects(arr)
        if (arr.length > 0) {
          setForm((prev) => (prev.subjectId ? prev : { ...prev, subjectId: String(arr[0].subjectId) }))
        }
      })
      .catch(() => setSubjects([]))
  }, [])

  // 수정 모드: 기존 질문을 불러와 폼을 채운다.
  useEffect(() => {
    if (!isEdit) return
    let active = true
    setLoadingDetail(true)
    fetchQuestionDetail(questionId)
      .then((detail) => {
        if (!active) return
        const myId = getCurrentUserId()
        const isAdmin = getCurrentUserRole() === 'ADMIN'
        if (detail.author?.userId !== myId && !isAdmin) {
          setError('본인이 작성한 질문만 수정할 수 있습니다.')
          return
        }
        setForm({
          subjectId: detail.subject?.subjectId != null ? String(detail.subject.subjectId) : '',
          title: detail.title ?? '',
          body: detail.content ?? '',
        })
        setExistingImages(Array.isArray(detail.images) ? detail.images : [])
      })
      .catch((err) => {
        if (active) setError(err.message || '질문을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoadingDetail(false)
      })
    return () => {
      active = false
    }
  }, [isEdit, questionId])

  // 새로 추가한 이미지 미리보기 URL. files가 바뀔 때 만들고, 언마운트/변경 시 해제한다.
  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  const update = (key, value) => {
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (picked.length) setFiles((prev) => [...prev, ...picked])
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))
  const removeExisting = (fileId) => setExistingImages((prev) => prev.filter((img) => img.fileId !== fileId))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.subjectId) return setError('과목을 선택해주세요.')
    if (!form.title.trim()) return setError('질문 제목을 입력해주세요.')
    if (form.body.trim().length < 10) return setError('질문 내용을 10자 이상 입력해주세요.')

    setSubmitting(true)
    setError('')
    try {
      // 새로 추가한 파일을 먼저 업로드해 fileId를 얻는다.
      const uploadedIds = []
      for (const file of files) {
        const prepared = await prepareImageForUpload(file)
        const uploaded = await uploadQnaImage(prepared)
        uploadedIds.push(uploaded.fileId)
      }

      if (isEdit) {
        // 남긴 기존 이미지 fileId + 새로 올린 fileId = 최종 이미지 묶음
        const imageFileIds = [...existingImages.map((img) => img.fileId), ...uploadedIds]
        await updateQuestion(questionId, {
          subjectId: Number(form.subjectId),
          title: form.title.trim(),
          content: form.body.trim(),
          imageFileIds,
        })
        navigate(`/qna/${questionId}`)
      } else {
        await createQuestion({
          subjectId: Number(form.subjectId),
          title: form.title.trim(),
          content: form.body.trim(),
          imageFileIds: uploadedIds,
        })
        navigate('/qna')
      }
    } catch (err) {
      if (err.status === 401) setError('로그인이 필요합니다.')
      else if (err.status === 403) setError(isEdit ? '본인이 작성한 질문만 수정할 수 있습니다.' : '질문 작성은 학생만 가능합니다.')
      else setError(err.message || (isEdit ? '질문 수정에 실패했습니다.' : '질문 등록에 실패했습니다.'))
      setSubmitting(false)
    }
  }

  const backTo = isEdit ? `/qna/${questionId}` : '/qna'

  if (loadingDetail) {
    return (
      <main className="qna-page qna-write">
        <section className="qna-write__body container">
          <p className="qna-detail__hint">불러오는 중…</p>
        </section>
      </main>
    )
  }

  return (
    <main className="qna-page qna-write">
      <section className="qna-write__hero">
        <div className="container">
          <button type="button" className="qna-write__back" onClick={() => navigate(backTo)}>
            ← {isEdit ? '질문으로 돌아가기' : '질문게시판으로'}
          </button>
          <span className="qna-hero__label">{isEdit ? '질문 수정' : '질문 작성'}</span>
          {isEdit ? (
            <h1>질문을 <span className="hand">다듬어</span> 볼까요</h1>
          ) : (
            <h1>막힌 문제를 <span className="hand">자세히</span> 남겨주세요</h1>
          )}
          <p>과목과 제목, 내용을 적고 필요하면 문제 사진을 첨부하세요. 선생님들이 풀이를 도와드립니다.</p>
        </div>
      </section>

      <section className="qna-write__body container">
        <form className="qna-write__form" onSubmit={handleSubmit}>
          <label className="form-group">
            <span className="form-label">과목</span>
            <select
              className="form-input"
              value={form.subjectId}
              onChange={(event) => update('subjectId', event.target.value)}
            >
              {subjects.length === 0 && <option value="">과목 불러오는 중…</option>}
              {subjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>{subject.name}</option>
              ))}
            </select>
          </label>

          <label className="form-group">
            <span className="form-label">제목</span>
            <input
              className="form-input"
              value={form.title}
              maxLength={TITLE_MAX}
              placeholder="예: 미적분 극값 문제에서 부호표가 헷갈립니다"
              onChange={(event) => update('title', event.target.value)}
            />
            <span className="qna-write__counter">{form.title.length}/{TITLE_MAX}</span>
          </label>

          <label className="form-group">
            <span className="form-label">내용</span>
            <textarea
              className="form-input qna-write__textarea"
              value={form.body}
              rows={10}
              maxLength={BODY_MAX}
              placeholder="어디까지 풀었는지, 어느 부분에서 막혔는지 구체적으로 적어주세요."
              onChange={(event) => update('body', event.target.value)}
            />
            <span className="qna-write__counter">{form.body.length}/{BODY_MAX}</span>
          </label>

          <div className="form-group">
            <span className="form-label">이미지 첨부 <em>(선택)</em></span>

            {/* 기존 이미지(수정 모드) + 새로 추가한 이미지를 함께 보여준다. 각 항목은 ×로 개별 삭제. */}
            {(existingImages.length > 0 || previews.length > 0) && (
              <ul className="qna-write__thumbs">
                {existingImages.map((image, index) => (
                  <li key={`existing-${image.fileId}`} className="qna-write__thumb">
                    <img src={toAbsoluteFileUrl(image.url)} alt={`기존 첨부 ${index + 1}`} />
                    <button type="button" onClick={() => removeExisting(image.fileId)} aria-label="첨부 제거">×</button>
                  </li>
                ))}
                {previews.map((preview, index) => (
                  <li key={`new-${preview.name}-${index}`} className="qna-write__thumb">
                    <img src={preview.url} alt={preview.name} />
                    <button type="button" onClick={() => removeFile(index)} aria-label="첨부 제거">×</button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="qna-write__upload"
              onClick={() => fileInputRef.current?.click()}
            >
              + 사진 추가
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                addFiles(event.target.files)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            />
          </div>

          {error && <p className="qna-modal__error">{error}</p>}

          <div className="qna-write__actions">
            <button className="btn btn-ghost" type="button" onClick={() => navigate(backTo)} disabled={submitting}>
              취소
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? (isEdit ? '수정 중…' : '등록 중…') : isEdit ? '수정 완료' : '질문 등록하기'}
            </button>
          </div>
        </form>

        <aside className="qna-write__tips">
          <h2>좋은 질문 작성 팁</h2>
          <ul>
            <li>막힌 지점을 구체적으로 적을수록 정확한 답변을 받아요.</li>
            <li>내가 시도한 풀이나 생각도 함께 적어보세요.</li>
            <li>문제 사진은 글씨가 잘 보이게 찍어 첨부해주세요.</li>
            <li>과목을 정확히 선택하면 관련 선생님께 더 잘 노출돼요.</li>
          </ul>
          <div className="qna-write__notice">
            질문 작성은 <strong>학생 계정</strong>만 가능합니다.
          </div>
        </aside>
      </section>
    </main>
  )
}
