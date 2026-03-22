import { useState } from 'react'

export default function PhotoCard({ photo, liked, onLike, onHide, onClick, index }) {
  const [hiding,   setHiding]   = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const delay = Math.min(index * 25, 500)

  function handleHide(e) {
    e.stopPropagation()
    setHiding(true)
    // 페이드아웃 후 실제 제거
    setTimeout(() => onHide(photo.id, photo.breed || null), 380)
  }

  function handleLike(e) {
    e.stopPropagation()
    onLike(photo.id, photo)
    if (!liked) {
      setLikeAnim(true)
      setTimeout(() => setLikeAnim(false), 600)
    }
  }

  return (
    <div
      className={`card${hiding ? ' hiding' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onClick(photo)}
    >
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
