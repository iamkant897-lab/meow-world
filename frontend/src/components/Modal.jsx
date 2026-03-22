import { useEffect } from 'react'

const SOURCE_LABEL = { catapi: 'TheCatAPI', unsplash: 'Unsplash', reddit: 'Reddit' }

export default function Modal({ photo, likes, onClose, onLike }) {
  const liked = likes[photo.id]

  // ESC to close
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const tags = [
    photo.source && `📌 ${SOURCE_LABEL[photo.source] || photo.source}`,
    photo.author && photo.author,
    photo.breed  && `🐱 ${photo.breed}`,
    photo.ups    && `👍 ${photo.ups.toLocaleString()}`,
    photo.w && photo.h && `📐 ${photo.w}×${photo.h}`,
  ].filter(Boolean)

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-img-wrap">
          <img className="modal-img" src={photo.url} alt={photo.title || '고양이'} />
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <div className="modal-title">{photo.title || '귀여운 고양이 🐱'}</div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="tags">
            {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-grad"
              onClick={() => onLike(photo.id)}
            >
              {liked ? '💔 좋아요 취소' : '❤️ 좋아요'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => window.open(photo.link, '_blank')}
            >
              🔗 원본 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
