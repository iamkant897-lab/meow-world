import { useEffect, useRef, useState, useMemo } from 'react'
import PhotoCard from './PhotoCard'

const SKELETON_HEIGHTS = [220,300,190,340,260,210,250,310,185,270,230,200,320,280,210,250,290,195,265,225]

function getNumCols() {
  const w = window.innerWidth
  if (w <= 600)  return 2
  if (w <= 900)  return 3
  if (w <= 1200) return 4
  return 5
}

export default function Gallery({ photos, loading, likes, onCardClick, onLike, onHide, onLoadMore, transitionKey }) {
  const triggerRef = useRef(null)
  const [numCols, setNumCols] = useState(getNumCols)

  useEffect(() => {
    const onResize = () => setNumCols(getNumCols())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 가장 짧은 열에 배치 (Pinterest 방식) — 기존 사진 위치 고정
  const colAssignRef  = useRef(new Map())
  const colHeightsRef = useRef([])

  const columns = useMemo(() => {
    const reset = colHeightsRef.current.length !== numCols || photos.length === 0
    if (reset) {
      colAssignRef.current  = new Map()
      colHeightsRef.current = new Array(numCols).fill(0)
      if (photos.length === 0) return Array.from({ length: numCols }, () => [])
    }
    const cols = Array.from({ length: numCols }, () => [])
    photos.forEach(photo => {
      if (!colAssignRef.current.has(photo.id)) {
        const h = colHeightsRef.current
        const shortest = h.indexOf(Math.min(...h))
        colAssignRef.current.set(photo.id, shortest)
        h[shortest] += (photo.h || 400) / (photo.w || 500)
      }
      cols[colAssignRef.current.get(photo.id)].push(photo)
    })
    return cols
  }, [photos, numCols])

  // 사진 수 바뀔 때마다 Observer 재등록 (초기 로딩 중엔 건드리지 않음)
  useEffect(() => {
    if (!triggerRef.current || photos.length === 0) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: '150px' }
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

      {showSkeletons ? (
        <div className="masonry-cols">
          {Array.from({ length: numCols }, (_, ci) => (
            <div key={ci} className="masonry-col">
              {SKELETON_HEIGHTS.filter((_, i) => i % numCols === ci).map((h, i) => (
                <div key={i} className="skel" style={{ height: h }} />
              ))}
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">😿</div>
          <p>사진이 없어요</p>
        </div>
      ) : (
        <div className="masonry-cols" key={transitionKey}>
          {columns.map((col, ci) => (
            <div key={ci} className="masonry-col">
              {col.map((p, j) => (
                <PhotoCard
                  key={p.id}
                  photo={p}
                  liked={!!likes[p.id]}
                  onLike={onLike}
                  onHide={onHide}
                  onClick={onCardClick}
                  index={j * numCols + ci}
                />
              ))}
            </div>
          ))}
        </div>
      )}

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
