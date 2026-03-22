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
    isGif: i.url?.toLowerCase().endsWith('.gif') || false,
  }
}

async function fetchCatAPI(limit = 50, breedId = null, mimeType = null, requireBreeds = true) {
  const breedParam  = breedId ? `&breed_ids=${breedId}` : ''
  const breedsParam = (!breedId && requireBreeds) ? '&has_breeds=1' : ''
  const mimeParam   = mimeType ? `&mime_types=${mimeType}` : ''
  const res  = await fetch(
    `https://api.thecatapi.com/v1/images/search?limit=${limit}&order=RAND${breedParam}${breedsParam}${mimeParam}&api_key=${KEY}`
  )
  const data = await res.json()
  return Array.isArray(data) ? data.map(normalize) : []
}

const PAGE = 12 // 한 번에 보여줄 장수

export function usePhotos(category = 'all') {
  const [photos,  setPhotos]  = useState([])
  const [loading, setLoading] = useState(false)

  const loadingRef  = useRef(false)
  const categoryRef = useRef(category)
  const seenIdsRef  = useRef(new Set())
  const bufferRef   = useRef([]) // 불러왔지만 아직 미표시 사진 저장소

  useEffect(() => { categoryRef.current = category }, [category])

  // ── fetch & filter ────────────────────────────
  const fetchPhotos = useCallback(async (cat) => {
    let batches
    if (cat === 'kitten') {
      batches = await Promise.all(KITTEN_BREEDS.map(b => fetchCatAPI(20, b)))
    } else if (cat === 'gif') {
      batches = await Promise.all([
        fetchCatAPI(20, null, 'gif', false),
        fetchCatAPI(20, null, 'gif', false),
      ])
    } else if (cat === 'all') {
      const preferred = getPreferredBreedIds()
      const base = [fetchCatAPI(50, null), fetchCatAPI(50, null)]
      const pref = preferred.map(id => fetchCatAPI(40, id))
      const gifs = [fetchCatAPI(10, null, 'gif', false)]
      batches = await Promise.all([...base, ...pref, ...gifs])
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

  // 버퍼 보충 (백그라운드)
  const refillBuffer = useCallback((cat) => {
    fetchPhotos(cat).then(fresh => {
      const deduped = fresh.filter(p => !seenIdsRef.current.has(p.id))
      deduped.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = [...bufferRef.current, ...deduped]
    }).catch(() => {})
  }, [fetchPhotos])

  // ── initial load ──────────────────────────────
  const loadInitial = useCallback(async (cat) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh = await fetchPhotos(cat)
      fresh.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = fresh.slice(PAGE)   // 나머지는 버퍼에
      setPhotos(fresh.slice(0, PAGE))         // 처음엔 PAGE장만
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
    bufferRef.current = []
    seenIdsRef.current = new Set()
    loadingRef.current = false
    loadInitial(category)
  }, [category]) // eslint-disable-line

  // ── load more: 버퍼에서 PAGE장씩 꺼내기 ──────
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return

    // 버퍼에 사진 있으면 바로 꺼내기
    if (bufferRef.current.length > 0) {
      const next = bufferRef.current.splice(0, PAGE)
      setPhotos(prev => [...prev, ...next])
      // 버퍼 부족하면 백그라운드에서 미리 보충
      if (bufferRef.current.length < PAGE * 2) {
        refillBuffer(categoryRef.current)
      }
      return
    }

    // 버퍼 비었으면 새로 fetch
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh   = await fetchPhotos(categoryRef.current)
      const deduped = fresh.filter(p => !seenIdsRef.current.has(p.id))
      deduped.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = deduped.slice(PAGE)
      setPhotos(prev => [...prev, ...deduped.slice(0, PAGE)])
    } catch (e) {
      console.error('loadMore error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPhotos, refillBuffer])

  // ── 수동 새로고침: 새 사진 먼저, 봤던 사진 뒤로 ──
  const refreshAll = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh     = await fetchPhotos(categoryRef.current)
      const newPhotos = fresh.filter(p => !seenIdsRef.current.has(p.id))
      const oldPhotos = fresh.filter(p =>  seenIdsRef.current.has(p.id))
      const combined  = [...newPhotos, ...oldPhotos]
      combined.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = combined.slice(PAGE)
      setPhotos(combined.slice(0, PAGE))
    } catch (e) {
      console.error('refreshAll error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPhotos])

  return { photos, loading, counts: { all: photos.length }, loadMore, refreshAll }
}
