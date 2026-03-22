import { useState, useCallback, useEffect } from 'react'

import Header      from './components/Header'
import FilterBar   from './components/FilterBar'
import CategoryBar from './components/CategoryBar'
import Gallery     from './components/Gallery'
import Modal       from './components/Modal'
import Settings    from './components/Settings'
import Toast       from './components/Toast'
import ScrollTop   from './components/ScrollTop'

import { usePhotos } from './hooks/usePhotos'
import { useLikes  } from './hooks/useLikes'

const KEY = import.meta.env.VITE_CAT_API_KEY

// 사진 데이터 정규화 (URL 해시로 직접 열 때 사용)
function normalizePhoto(d) {
  return {
    id:          'ca_' + d.id,
    url:         d.url,
    thumb:       d.url,
    source:      'catapi',
    author:      'TheCatAPI',
    link:        d.url,
    w:           d.width  || 500,
    h:           d.height || 400,
    breed:       d.breeds?.[0]?.name        || null,
    title:       d.breeds?.[0]?.name ? `${d.breeds[0].name} 고양이` : '귀여운 고양이',
    isGif:       d.url?.toLowerCase().endsWith('.gif') || false,
    temperament: d.breeds?.[0]?.temperament  || null,
    origin:      d.breeds?.[0]?.origin       || null,
    description: d.breeds?.[0]?.description  || null,
    life_span:   d.breeds?.[0]?.life_span    || null,
    wikipedia:   d.breeds?.[0]?.wikipedia_url|| null,
  }
}

export default function App() {
  const [filter,       setFilter]       = useState('all')
  const [category,     setCategory]     = useState('all')
  const [modal,        setModal]        = useState(null)
  const [toasts,       setToasts]       = useState([])
  const [showSettings, setShowSettings] = useState(false)

  const [hidden, setHidden] = useState(
    () => new Set(JSON.parse(localStorage.getItem('nyang_hidden') || '[]'))
  )
  const [blockedBreeds, setBlockedBreeds] = useState(
    () => new Set(JSON.parse(localStorage.getItem('nyang_blocked_breeds') || '[]'))
  )

  const { likes, likedPhotos, toggleLike } = useLikes()
  const { photos, loading, counts, loadMore, refreshAll } = usePhotos(category)

  // ── URL 해시로 사진 직접 열기 (공유 링크 수신) ──
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash || hash.length < 3) return
    fetch(`https://api.thecatapi.com/v1/images/${hash}?api_key=${KEY}`)
      .then(r => r.json())
      .then(d => { if (d?.id) setModal(normalizePhoto(d)) })
      .catch(() => {})
  }, [])

  // ── 모달 열리면 URL 해시 갱신, 닫히면 초기화 ──
  useEffect(() => {
    if (modal) {
      const rawId = modal.id.startsWith('ca_') ? modal.id.slice(3) : modal.id
      window.history.replaceState(null, '', `#${rawId}`)
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [modal])

  // ── 뒤로가기 버튼 → 모달 닫기 ──────────────────
  useEffect(() => {
    const onPop = () => setModal(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // ── toast helper ──────────────────────────────
  const addToast = useCallback((ico, msg) => {
    const id = Date.now()
    setToasts(t => [...t, { id, ico, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  // ── like handler ──────────────────────────────
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

  // ── unblock breed ─────────────────────────────
  const handleUnblock = useCallback((breed) => {
    setBlockedBreeds(prev => {
      const next = new Set(prev)
      next.delete(breed)
      localStorage.setItem('nyang_blocked_breeds', JSON.stringify([...next]))
      return next
    })
    addToast('✅', `${breed} 차단 해제됐어요`)
  }, [addToast])

  const handleClearBlocks = useCallback(() => {
    setBlockedBreeds(new Set())
    localStorage.setItem('nyang_blocked_breeds', '[]')
    addToast('✅', '차단 목록을 모두 해제했어요')
  }, [addToast])

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

  // ── filtered photos ───────────────────────────
  const filtered = (() => {
    if (filter === 'liked') {
      return Object.values(likedPhotos)
        .filter(p => !hidden.has(p.id) && !(p.breed && blockedBreeds.has(p.breed)))
        .sort((a, b) => (b.likedAt || 0) - (a.likedAt || 0))
    }
    return photos.filter(p =>
      !hidden.has(p.id) && !(p.breed && blockedBreeds.has(p.breed))
    )
  })()

  return (
    <>
      <Header
        onRefresh={handleRefresh}
        onSettings={() => setShowSettings(true)}
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
        transitionKey={category + filter}
      />

      {modal && (
        <Modal
          photo={modal}
          photos={filtered}
          likes={likes}
          onClose={() => setModal(null)}
          onLike={handleLike}
          onNavigate={setModal}
          onHide={handleHide}
        />
      )}

      {showSettings && (
        <Settings
          blockedBreeds={blockedBreeds}
          onUnblock={handleUnblock}
          onClearAll={handleClearBlocks}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toasts.map(t => (
        <Toast key={t.id} ico={t.ico} msg={t.msg} />
      ))}

      <ScrollTop />
    </>
  )
}
