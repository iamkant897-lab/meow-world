import { useState, useCallback } from 'react'

const IDS_KEY    = 'meow_likes'
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
      try { localStorage.setItem(IDS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    setLikedPhotos(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else if (photo) next[id] = photo
      try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { likes, likedPhotos, toggleLike }
}
