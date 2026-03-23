import { useEffect, useRef, useState } from 'react'

export default function Modal({ photo, photos, likes, onClose, onLike, onNavigate, onHide }) {
  const liked = !!likes[photo.id]
  const [copied,  setCopied]  = useState(false)
  const [saving,  setSaving]  = useState(false)

  // 현재 사진 위치
  const currentIdx = photos ? photos.findIndex(p => p.id === photo.id) : -1
  const hasPrev = currentIdx > 0
  const hasNext = photos && currentIdx < photos.length - 1

  function goPrev() { if (hasPrev) onNavigate(photos[currentIdx - 1]) }
  function goNext() { if (hasNext) onNavigate(photos[currentIdx + 1]) }

  // 키보드 조작 (ESC, ←, →)
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  goNext()
      if (e.key === 'ArrowLeft')   goPrev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, currentIdx, photos]) // eslint-disable-line

  // 터치 스와이프
  const touchStartX = useRef(0)
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 55) {
      if (dx < 0) goNext()
      else        goPrev()
    }
  }

  // 사진 저장 — 서버 프록시로 CORS 우회 후 원탭 다운로드
  async function handleSave() {
    setSaving(true)
    try {
      const proxyUrl = `/api/image?url=${encodeURIComponent(photo.url)}`
      const res  = await fetch(proxyUrl)
      if (!res.ok) throw new Error('proxy error')
      const blob = await res.blob()
      const ext  = photo.isGif ? 'gif' : 'jpg'
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href     = blobUrl
      a.download = `냥이_${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(photo.url, '_blank')
    } finally {
      setSaving(false)
    }
  }

  // 링크 공유 — 현재 URL(사진 ID 해시 포함) 공유
  // 받는 사람이 열면 해당 사진이 바로 모달로 뜸
  async function handleShare() {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: '🐱 냥월드', url: shareUrl })
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div
      className="modal-bg"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="modal-box">

        {/* 이미지 + 좌우 네비게이션 */}
        <div className="modal-img-wrap">
          {hasPrev && (
            <button className="modal-nav modal-nav-prev" onClick={goPrev}>‹</button>
          )}
          <img className="modal-img" src={photo.url} alt={photo.title || '고양이'} />
          {hasNext && (
            <button className="modal-nav modal-nav-next" onClick={goNext}>›</button>
          )}
          <button className="modal-close-overlay" onClick={onClose}>✕</button>
          <button className="modal-block-overlay" onClick={() => { onHide(photo.id, photo.breed || null); onClose() }}>🚫</button>
        </div>

        <div className="modal-body">
          <div className="modal-title">{photo.title || '귀여운 고양이 🐱'}</div>

          {/* 품종 상세 정보 */}
          {(photo.origin || photo.temperament || photo.life_span) && (
            <div className="breed-info">
              {photo.origin && (
                <div className="breed-row">
                  <span className="breed-label">🌍 원산지</span>
                  <span>{photo.origin}</span>
                </div>
              )}
              {photo.temperament && (
                <div className="breed-row">
                  <span className="breed-label">💝 성격</span>
                  <span>{photo.temperament}</span>
                </div>
              )}
              {photo.life_span && (
                <div className="breed-row">
                  <span className="breed-label">🎂 수명</span>
                  <span>{photo.life_span}년</span>
                </div>
              )}
              {photo.wikipedia && (
                <a className="breed-wiki" href={photo.wikipedia} target="_blank" rel="noreferrer">
                  📖 위키피디아 더 보기
                </a>
              )}
            </div>
          )}

          {/* 사진 번호 */}
          {photos && currentIdx >= 0 && (
            <div className="modal-counter">{currentIdx + 1} / {photos.length}</div>
          )}

          <div className="modal-actions">
            <button
              className={`btn ${liked ? 'btn-ghost' : 'btn-grad'}`}
              onClick={() => onLike(photo.id, photo)}
            >
              {liked ? '💔 취소' : '❤️ 좋아요'}
            </button>
            <button className="btn btn-ghost" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '💾 사진 저장'}
            </button>
            <button className="btn btn-ghost" onClick={handleShare}>
              {copied ? '✅ 복사됨!' : '🔗 링크 공유'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
