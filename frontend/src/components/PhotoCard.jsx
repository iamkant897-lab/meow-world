import { useState, useRef, useEffect } from 'react'

export default function PhotoCard({ photo, liked, onLike, onHide, onClick, index }) {
  const [hiding,    setHiding]    = useState(false)
  const [likeAnim,  setLikeAnim]  = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [loaded,    setLoaded]    = useState(false)
  const [broken,    setBroken]    = useState(false)

  const lastTouchRef   = useRef(0)
  const didDoubleTap   = useRef(false)
  const delay = (index % 12) * 55

  function doLike() {
    onLike(photo.id, photo)
    if (!liked) {
      setLikeAnim(true)
      setTimeout(() => setLikeAnim(false), 600)
    }
  }

  function handleHide(e) {
    e.stopPropagation()
    setHiding(true)
    setTimeout(() => onHide(photo.id, photo.breed || null), 380)
  }

  function handleLike(e) {
    e.stopPropagation()
    doLike()
  }

  // touchstart로 더블탭 감지 — 딜레이 없이 즉시 반응
  function handleTouchStart() {
    const now = Date.now()
    if (now - lastTouchRef.current < 280) {
      didDoubleTap.current = true
      doLike()
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 750)
    }
    lastTouchRef.current = now
  }

  // click은 모달 오픈 (더블탭이었으면 무시)
  function handleCardClick() {
    if (didDoubleTap.current) {
      didDoubleTap.current = false
      return
    }
    onClick(photo)
  }

  return (
    <div
      className={`card${hiding ? ' hiding' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onTouchStart={handleTouchStart}
      onClick={handleCardClick}
    >
      {showHeart && <div className="double-tap-heart">❤️</div>}

      <button
        className={`card-like${liked ? ' liked' : ''}${likeAnim ? ' pop' : ''}`}
        onClick={handleLike}
        title="좋아요"
      >
        {liked ? '❤️' : '🤍'}
      </button>

      <button
        className="card-hide"
        onClick={handleHide}
        title="이 사진 숨기기"
      >
        🚫
      </button>

      {photo.isGif && <div className="gif-badge">GIF</div>}

      <div
        className="photo-img-wrap"
        style={{ aspectRatio: `${photo.w || 4} / ${photo.h || 3}` }}
      >
        {broken ? (
          <div className="photo-broken">😿</div>
        ) : (
          <img
            src={photo.thumb || photo.url}
            alt={photo.title || '고양이'}
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.35s' }}
          />
        )}
      </div>

      <div className="card-overlay">
        {photo.breed && <div className="overlay-title">🐱 {photo.breed}</div>}
      </div>
    </div>
  )
}
