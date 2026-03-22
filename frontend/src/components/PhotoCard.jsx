import { useState, useRef } from 'react'

export default function PhotoCard({ photo, liked, onLike, onHide, onClick, index }) {
  const [hiding,    setHiding]    = useState(false)
  const [likeAnim,  setLikeAnim]  = useState(false)
  const [showHeart, setShowHeart] = useState(false) // 더블탭 하트 이펙트

  const tapTimerRef = useRef(null)
  const lastTapRef  = useRef(0)
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

  // 더블탭 → 좋아요 / 싱글탭 → 모달
  function handleCardClick() {
    const now = Date.now()
    if (now - lastTapRef.current < 280) {
      clearTimeout(tapTimerRef.current)
      lastTapRef.current = 0
      doLike()
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 750)
    } else {
      lastTapRef.current = now
      tapTimerRef.current = setTimeout(() => {
        onClick(photo)
      }, 280)
    }
  }

  return (
    <div
      className={`card${hiding ? ' hiding' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={handleCardClick}
    >
      {/* 더블탭 하트 이펙트 */}
      {showHeart && <div className="double-tap-heart">❤️</div>}

      {/* 하트 — 좋아요 시 항상 표시 */}
      <button
        className={`card-like${liked ? ' liked' : ''}${likeAnim ? ' pop' : ''}`}
        onClick={handleLike}
        title="좋아요"
      >
        {liked ? '❤️' : '🤍'}
      </button>

      {/* 숨기기 */}
      <button
        className="card-hide"
        onClick={handleHide}
        title="이 사진 숨기기"
      >
        🚫
      </button>

      {photo.isGif && <div className="gif-badge">GIF</div>}

      <img
        src={photo.thumb || photo.url}
        alt={photo.title || '고양이'}
        loading="lazy"
        onError={e => { e.target.closest('.card').style.display = 'none' }}
      />

      <div className="card-overlay">
        {photo.breed && <div className="overlay-title">🐱 {photo.breed}</div>}
      </div>
    </div>
  )
}
