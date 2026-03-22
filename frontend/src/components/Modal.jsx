import { useEffect, useRef, useState } from 'react'

export default function Modal({ photo, photos, likes, onClose, onLike, onNavigate, onHide }) {
  const liked = !!likes[photo.id]
  const [copied, setCopied] = useState(false)

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

  // 공유 버튼 — 이미지 파일로 직접 공유 (카톡에서 사진으로 바로 보임)
  async function handleShare() {
    // 1순위: 이미지 파일 다운로드 후 파일 공유
    if (navigator.share && navigator.canShare) {
      try {
        const res  = await fetch(photo.url)
        const blob = await res.blob()
        const ext  = photo.isGif ? 'gif' : 'jpg'
        const file = new File([blob], `nyang-${Date.now()}.${ext}`, { type: blob.type })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: photo.title || '귀여운 고양이 🐱' })
          return
        }
      } catch {}
    }
    // 2순위: 사이트 URL 공유 (OG 썸네일 뜸)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🐱 냥월드 — 귀여운 고양이 갤러리',
          url: 'https://meow-world.vercel.app',
        })
        return
      } catch {}
    }
    // 3순위: 클립보드 복사
    try {
      await navigator.clipboard.writeText('https://meow-world.vercel.app')
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
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <div className="modal-title">{photo.title || '귀여운 고양이 🐱'}</div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

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
            <button className="btn btn-ghost" onClick={handleShare}>
              {copied ? '✅ 복사됨!' : '📤 공유'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { onHide(photo.id, photo.breed || null); onClose() }}
            >
              🚫 차단
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
