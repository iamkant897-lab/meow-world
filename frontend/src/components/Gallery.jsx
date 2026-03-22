import { useEffect, useRef } from 'react'
import PhotoCard from './PhotoCard'

const SKELETON_HEIGHTS = [220,300,190,340,260,210,250,310,185,270,230,200,320,280,210,250,290,195,265,225]

export default function Gallery({ photos, loading, likes, onCardClick, onLike, onHide, onLoadMore }) {
  const triggerRef = useRef(null)

  // 사진 수가 바뀔 때마다 Observer 재등록
  // → 트리거가 아직 화면에 보이면 즉시 발동해서 계속 채워줌
  useEffect(() => {
    if (!triggerRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: '300px' }
    )
    obs.observe(triggerRef.current)
    return () => obs.disconnect()
  }, [photos.length, onLoadMore])

  const showSkeletons = loading && photos.length === 0

  return (
    <div className="gallery-wrap">
      <div className="stats">
        총&nbsp;<strong>{photos.length.toLocaleString()}</strong>&nbsp;장의 고양이 사진
      </div>

      <div className="masonry">
        {showSkeletons
          ? SKELETON_HEIGHTS.map((h, i) => (
              <div key={i} className="skel" style={{ height: h }} />
            ))
          : photos.length === 0
            ? (
              <div className="empty" style={{ columnSpan: 'all' }}>
                <div className="empty-icon">😿</div>
                <p>사진이 없어요</p>
              </div>
            )
            : photos.map((p, i) => (
                <PhotoCard
                  key={p.id}
                  photo={p}
                  liked={!!likes[p.id]}
                  onLike={onLike}
                  onHide={onHide}
                  onClick={onCardClick}
                  index={i}
                />
              ))
        }
      </div>

      <div className="load-trigger" ref={triggerRef}>
        {loading && photos.length > 0 && (
          <div className="dots">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        )}
      </div>
    </div>
  )
}
