import { useState, useCallback } from 'react'

import Header      from './components/Header'
import FilterBar   from './components/FilterBar'
import CategoryBar from './components/CategoryBar'
import Gallery     from './components/Gallery'
import Modal       from './components/Modal'
import Toast       from './components/Toast'
import NewBanner   from './components/NewBanner'
import ScrollTop   from './components/ScrollTop'

import { usePhotos } from './hooks/usePhotos'
import { useLikes  } from './hooks/useLikes'

export default function App() {
  const [filter,   setFilter]   = useState('all')
  const [category, setCategory] = useState('all')
  const [modal,    setModal]    = useState(null)
  const [toasts,   setToasts]   = useState([])

  const [hidden, setHidden] = useState(
    () => new Set(JSON.parse(localStorage.getItem('nyang_hidden') || '[]'))
  )
  const [blockedBreeds, setBlockedBreeds] = useState(
    () => new Set(JSON.parse(localStorage.getItem('nyang_blocked_breeds') || '[]'))
  )

  const { likes, likedPhotos, toggleLike } = useLikes()
  const {
    photos, loading, counts,
    loadMore, refreshAll,
  } = usePhotos(category)

  // ── toast helper ──────────────────────────────
  const addToast = useCallback((ico, msg) => {
    const id = Date.now()
    setToasts(t => [...t, { id, ico, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  // ── like handler (card + modal) ───────────────
  const handleLike = useCallback((id, photo) => {
    const wasLiked = !!likes[id]
    toggleLike(id, photo)
    addToast(wasLiked ? '💔' : '❤️', wasLiked ? '좋아요를 취소했어요' : '좋아요! 귀엽죠? 🐱')
  }, [likes, toggleLike, addToast])

  // ── refresh ───────────────────────────────────
  const handleRefresh = useCallback(async () => {
    await refreshAll()
    addToast('🔄', '새로운 고양이들을 불러왔어요!')
  }, [refreshAll, addToast])

  // ── hide handler ──────────────────────────────
  const handleHide = useCallback((id, breed) => {
    setHidden(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('nyang_hidden', JSON.stringify([...next]))
      return next
    })
    if (breed) {
      setBlockedBreeds(prev => {
        const next = new Set(prev)
        next.add(breed)
        localStorage.setItem('nyang_blocked_breeds', JSON.stringify([...next]))
        return next
      })
      addToast('🚫', `${breed} 품종을 차단했어요`)
    } else {
      addToast('🚫', '사진을 숨겼어요')
    }
  }, [addToast])

  // ── random cat ────────────────────────────────
  const handleRandom = useCallback(async () => {
    addToast('🎲', '랜덤 냥이 불러오는 중...')
    try {
      const key = import.meta.env.VITE_CAT_API_KEY
      const res  = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${key}`)
      const [d]  = await res.json()
      setModal({
        id: 'rnd_' + d.id, url: d.url, thumb: d.url, source: 'catapi',
        author: 'TheCatAPI', link: d.url, w: d.width, h: d.height,
        breed: d.breeds?.[0]?.name || null,
        title: d.breeds?.[0]?.name ? `${d.breeds[0].name} 고양이 🐱` : '🎲 랜덤 귀여운 냥이',
      })
    } catch {
      addToast('😿', '랜덤 냥이를 불러오지 못했어요')
    }
  }, [addToast])

  // ── filtered photos ───────────────────────────
  const filtered = (() => {
    if (filter === 'liked') {
      // 저장된 사진 전체에서 보여줌 (세션 무관)
      return Object.values(likedPhotos).filter(p =>
        !hidden.has(p.id) && !(p.breed && blockedBreeds.has(p.breed))
      )
    }
    return photos.filter(p =>
      !hidden.has(p.id) &&
      !(p.breed && blockedBreeds.has(p.breed))
    )
  })()

  return (
    <>
      <Header
        onRefresh={handleRefresh}
        onRandom={handleRandom}
      />

      <FilterBar
        active={filter}
        onChange={setFilter}
        counts={{ all: counts.all, liked: Object.keys(likedPhotos).length }}
      />

      <CategoryBar active={category} onChange={setCategory} />

      <Gallery
        photos={filtered}
        loading={loading}
        likes={likes}
        onCardClick={setModal}
        onLike={handleLike}
        onHide={handleHide}
        onLoadMore={loadMore}
      />

      {modal && (
        <Modal
          photo={modal}
          photos={filtered}
          likes={likes}
          onClose={() => setModal(null)}
          onLike={handleLike}
          onNavigate={setModal}
        />
      )}

      {toasts.map(t => (
        <Toast key={t.id} ico={t.ico} msg={t.msg} />
      ))}

      <ScrollTop />
    </>
  )
}
