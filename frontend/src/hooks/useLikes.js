import { useState, useCallback } from 'react'

const PHOTOS_KEY = 'meow_liked_photos'

export function useLikes() {
  const [likedPhotos, setLikedPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '{}') } catch { return {} }
  })

  // likes는 likedPhotos에서 파생 — 항상 동기화 보장
  const [likes, setLikes] = useState(() => {
    try {
      const photos = JSON.parse(localStorage.getItem(PHOTOS_KEY) || '{}')
      return Object.fromEntries(Object.keys(photos).map(id => [id, true]))
    } catch { return {} }
  })

  const toggleLike = useCallback((id, photo) => {
    setLikes(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
    setLikedPhotos(prev => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else if (photo) {
        // likedAt 타임스탬프 저장 → 최근 좋아요 순 정렬용
        next[id] = { ...photo, likedAt: Date.now() }
      }
      try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { likes, likedPhotos, toggleLike }
}
