import { useState, useEffect, useRef, useCallback } from 'react'

const KEY = import.meta.env.VITE_CAT_API_KEY

const BREED_IDS = {
  ragd: 'ragd', mcoo: 'mcoo', munc: 'munc',
  norw: 'norw', sibe: 'sibe', bali: 'bali', birm: 'birm',
}

// 품종 이름 → API breed_id 매핑
const BREED_NAME_TO_ID = {
  'Ragdoll': 'ragd',
  'Maine Coon': 'mcoo',
  'Munchkin': 'munc',
  'Norwegian Forest Cat': 'norw',
  'Siberian': 'sibe',
  'Balinese': 'bali',
  'Birman': 'birm',
}

// 좋아요한 사진에서 선호 품종 ID 추출 (상위 3개)
function getPreferredBreedIds() {
  try {
    const photos = JSON.parse(localStorage.getItem('meow_liked_photos') || '{}')
    const counts = {}
    for (const p of Object.values(photos)) {
      if (p.breed && BREED_NAME_TO_ID[p.breed]) {
        counts[p.breed] = (counts[p.breed] || 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => BREED_NAME_TO_ID[name])
  } catch { return [] }
}

const KITTEN_BREEDS = ['munc', 'ragd', 'bali', 'norw', 'sibe', 'birm']

const EXCLUDED_KEYWORDS = [
  'Persian', 'Exotic', 'Himalayan', 'Chinchilla',
  'Sphynx', 'Peterbald', 'Donskoy', 'Levkoy',
  'Devon Rex', 'Cornish Rex', 'Oriental', 'Egyptian Mau',
  'Shorthair', 'Russian Blue', 'Bengal', 'Siamese',
  'Abyssinian', 'Singapura', 'Tonkinese', 'Burmese',
  'Bombay', 'Korat', 'Ocicat', 'Savannah',
]

function isExcluded(breed) {
  if (!breed) return false
  return EXCLUDED_KEYWORDS.some(kw => breed.includes(kw))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(i) {
  return {
    id:    'ca_' + i.id,
    url:   i.url,
    thumb: i.url,
    source: 'catapi',
    author: 'TheCatAPI',
    link:  i.url,
    w:     i.width  || 500,
    h:     i.height || 400,
    breed: i.breeds?.[0]?.name || null,
    title: i.breeds?.[0]?.name ? `${i.breeds[0].name} 고양이` : '귀여운 고양이',
  }
}

async function fetchCatAPI(limit = 50, breedId = null) {
  const breedParam  = breedId ? `&breed_ids=${breedId}` : ''
  const breedsParam = breedId ? '' : '&has_breeds=1'
  const res  = await fetch(
    `https://api.thecatapi.com/v1/images/search?limit=${limit}&order=RAND${breedParam}${breedsParam}&api_key=${KEY}`
  )
  const data = await res.json()
  return Array.isArray(data) ? data.map(normalize) : []
}

export function usePhotos(category = 'all') {
  const [photos,  setPhotos]  = useState([])
  const [loading, setLoading] = useState(false)

  const loadingRef  = useRef(false)
  const categoryRef = useRef(category)
  const seenIdsRef  = useRef(new Set()) // 이번 세션에서 본 사진 ID 전부

  useEffect(() => { categoryRef.current = category }, [category])

  // ── fetch & filter ────────────────────────────
  const fetchPhotos = useCallback(async (cat) => {
    let batches
    if (cat === 'kitten') {
      batches = await Promise.all(KITTEN_BREEDS.map(b => fetchCatAPI(20, b)))
    } else if (cat === 'all') {
      const preferred = getPreferredBreedIds()
      // 기본 랜덤 + 선호 품종 추가 fetch
      const base = [fetchCatAPI(50, null), fetchCatAPI(50, null)]
      const pref = preferred.map(id => fetchCatAPI(40, id))
      batches = await Promise.all([...base, ...pref])
    } else {
      const breedId = BREED_IDS[cat] || null
      batches = await Promise.all([fetchCatAPI(50, breedId), fetchCatAPI(50, breedId)])
    }

    const seen = new Set()
    const out  = []
    for (const p of shuffle(batches.flat())) {
      if (seen.has(p.id)) continue
      if (isExcluded(p.breed)) continue
      seen.add(p.id)
      out.push(p)
    }
    return out
  }, [])

  // ── initial load ──────────────────────────────
  const loadInitial = useCallback(async (cat) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh = await fetchPhotos(cat)
      fresh.forEach(p => seenIdsRef.current.add(p.id))
      setPhotos(fresh)
    } catch (e) {
      console.error('loadInitial error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPhotos])

  // ── reload when category changes ──────────────
  useEffect(() => {
    setPhotos([])
    seenIdsRef.current = new Set()
    loadingRef.current = false
    loadInitial(category)
  }, [category]) // eslint-disable-line

  // ── load more (infinite scroll) ───────────────
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh = await fetchPhotos(categoryRef.current)
      const deduped = fresh.filter(p => !seenIdsRef.current.has(p.id))
      deduped.forEach(p => seenIdsRef.current.add(p.id))
      setPhotos(prev => [...prev, ...deduped])
    } catch (e) {
      console.error('loadMore error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPhotos])

  // ── 수동 새로고침: 새 사진 먼저, 봤던 사진 뒤로 ──
  const refreshAll = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh = await fetchPhotos(categoryRef.current)
      const newPhotos  = fresh.filter(p => !seenIdsRef.current.has(p.id))
      const oldPhotos  = fresh.filter(p =>  seenIdsRef.current.has(p.id))
      const combined   = [...newPhotos, ...oldPhotos]
      combined.forEach(p => seenIdsRef.current.add(p.id))
      setPhotos(combined)
    } catch (e) {
      console.error('refreshAll error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPhotos])

  return { photos, loading, counts: { all: photos.length }, loadMore, refreshAll }
}
