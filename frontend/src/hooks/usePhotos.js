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

// 사진 a[], 움짤 b[] 를 p,g,p,g,... 순서로 섞기
function interleave(a, b) {
  const result = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i])
    if (i < b.length) result.push(b[i])
  }
  return result
}

// 중복제거 + 제외 품종 필터
function dedupFilter(arr) {
  const seen = new Set()
  const out  = []
  for (const p of arr) {
    if (seen.has(p.id)) continue
    if (isExcluded(p.breed)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
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
    breed:       i.breeds?.[0]?.name        || null,
    title:       i.breeds?.[0]?.name ? `${i.breeds[0].name} 고양이` : '귀여운 고양이',
    isGif:       i.url?.toLowerCase().endsWith('.gif') || false,
    temperament: i.breeds?.[0]?.temperament  || null,
    origin:      i.breeds?.[0]?.origin       || null,
    description: i.breeds?.[0]?.description  || null,
    life_span:   i.breeds?.[0]?.life_span    || null,
    wikipedia:   i.breeds?.[0]?.wikipedia_url|| null,
  }
}

async function fetchCatAPI(limit = 50, breedId = null, mimeType = null, requireBreeds = true, categoryId = null) {
  const breedParam    = breedId    ? `&breed_ids=${breedId}`       : ''
  const breedsParam   = (!breedId && !categoryId && requireBreeds) ? '&has_breeds=1' : ''
  const mimeParam     = mimeType   ? `&mime_types=${mimeType}`     : ''
  const categoryParam = categoryId ? `&category_ids=${categoryId}` : ''
  const res  = await fetch(
    `https://api.thecatapi.com/v1/images/search?limit=${limit}&order=RAND${breedParam}${breedsParam}${mimeParam}${categoryParam}&api_key=${KEY}`
  )
  const data = await res.json()
  return Array.isArray(data) ? data.map(normalize) : []
}

// TheCatAPI의 kittens 카테고리 ID를 한 번만 가져와서 캐시
let kittenCatId = null
async function getKittenCatId() {
  if (kittenCatId) return kittenCatId
  try {
    const res  = await fetch(`https://api.thecatapi.com/v1/categories?api_key=${KEY}`)
    const list = await res.json()
    const found = Array.isArray(list) && list.find(c => c.name.toLowerCase() === 'kittens')
    kittenCatId = found?.id || 5  // 못 찾으면 일반적으로 알려진 ID 5 사용
  } catch { kittenCatId = 5 }
  return kittenCatId
}

const PAGE = 12 // 한 번에 보여줄 장수

// ── 본 사진 기록 (localStorage) ──────────────────
const SEEN_KEY = 'nyang_seen_history'
const COOLDOWN_ALL    = 7 * 24 * 60 * 60 * 1000  // 7일
const COOLDOWN_BREED  = 3 * 24 * 60 * 60 * 1000  // 3일

function getSeenHistory() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') } catch { return {} }
}

function cleanAndGetHistory() {
  const history = getSeenHistory()
  const now = Date.now()
  const cleaned = {}
  for (const [id, ts] of Object.entries(history)) {
    if (now - ts < COOLDOWN_ALL) cleaned[id] = ts  // 7일 지난 건 삭제
  }
  localStorage.setItem(SEEN_KEY, JSON.stringify(cleaned))
  return cleaned
}

function markSeen(photos) {
  const history = getSeenHistory()
  const now = Date.now()
  photos.forEach(p => { history[p.id] = now })
  localStorage.setItem(SEEN_KEY, JSON.stringify(history))
}

function filterUnseen(photos, category) {
  const history = cleanAndGetHistory()
  const cooldown = category === 'all' ? COOLDOWN_ALL : COOLDOWN_BREED
  const now = Date.now()
  return photos.filter(p => !history[p.id] || (now - history[p.id]) >= cooldown)
}

export function usePhotos(category = 'all') {
  const [photos,  setPhotos]  = useState([])
  const [loading, setLoading] = useState(false)

  const loadingRef   = useRef(false)
  const refillRef    = useRef(false) // 백그라운드 refill 중복 방지
  const categoryRef  = useRef(category)
  const seenIdsRef   = useRef(new Set())
  const bufferRef    = useRef([]) // 불러왔지만 아직 미표시 사진 저장소

  useEffect(() => { categoryRef.current = category }, [category])

  // ── fetch & filter ────────────────────────────
  const fetchPhotos = useCallback(async (cat) => {
    if (cat === 'kitten') {
      const catId = await getKittenCatId()
      const batches = await Promise.all([
        fetchCatAPI(40, null, null, false, catId),
        fetchCatAPI(40, null, null, false, catId),
        fetchCatAPI(20, null, 'gif', false, catId),  // 아기 고양이 움짤
      ])
      return dedupFilter(shuffle(batches.flat()))
    }

    if (cat === 'gif') {
      // 품종 있는 GIF 우선, 부족하면 아무 GIF로 보충
      const batches = await Promise.all([
        fetchCatAPI(50, null, 'gif', true),   // 품종 있는 GIF
        fetchCatAPI(50, null, 'gif', true),
        fetchCatAPI(30, null, 'gif', false),  // 품종 없어도 보충
        fetchCatAPI(30, null, 'gif', false),
      ])
      return dedupFilter(shuffle(batches.flat()))
    }

    if (cat === 'all') {
      const preferred = getPreferredBreedIds()
      // 사진, 움짤 동시 fetch
      const [photoResults, gifResults] = await Promise.all([
        Promise.all([
          fetchCatAPI(50, null),
          fetchCatAPI(50, null),
          ...preferred.map(id => fetchCatAPI(30, id)),
        ]),
        Promise.all([
          fetchCatAPI(40, null, 'gif', true),   // 품종 있는 GIF
          fetchCatAPI(40, null, 'gif', false),  // 아무 GIF
        ]),
      ])
      const photos = dedupFilter(shuffle(photoResults.flat()))
      const gifs   = dedupFilter(shuffle(gifResults.flat()))
      // 사진:움짤 = 1:1 교대 배치
      return interleave(photos, gifs)
    }

    // 개별 품종 탭
    const breedId = BREED_IDS[cat] || null
    const batches = await Promise.all([fetchCatAPI(50, breedId), fetchCatAPI(50, breedId)])
    return dedupFilter(shuffle(batches.flat()))
  }, [])

  // 버퍼 보충 (백그라운드) — 동시에 1개만 실행
  const refillBuffer = useCallback((cat) => {
    if (refillRef.current) return
    refillRef.current = true
    fetchPhotos(cat).then(fresh => {
      const unseen  = filterUnseen(fresh, cat)
      const pool    = unseen.length > 0 ? unseen : fresh
      const deduped = pool.filter(p => !seenIdsRef.current.has(p.id))
      deduped.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = [...bufferRef.current, ...deduped]
    }).catch(() => {}).finally(() => { refillRef.current = false })
  }, [fetchPhotos])

  // ── initial load ──────────────────────────────
  const loadInitial = useCallback(async (cat) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const fresh   = await fetchPhotos(cat)
      const unseen  = filterUnseen(fresh, cat)
      // 안 본 사진이 너무 적으면 이미 본 것도 섞어서 보충
      const pool    = unseen.length >= PAGE ? unseen : fresh
      pool.forEach(p => seenIdsRef.current.add(p.id))
      bufferRef.current = pool.slice(PAGE)
      const shown = pool.slice(0, PAGE)
      markSeen(shown)
      setPhotos(shown)
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
  // 모든 경로에 잠금 → 동시 실행 차단
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      if (bufferRef.current.length > 0) {
        // 버퍼에 사진 있으면 바로 꺼내기
        const next = bufferRef.current.splice(0, PAGE)
        markSeen(next)
        setPhotos(prev => [...prev, ...next])
        // 버퍼 부족하면 백그라운드에서 미리 보충
        if (bufferRef.current.length < PAGE * 2) {
          refillBuffer(categoryRef.current)
        }
      } else {
        // 버퍼 비었으면 새로 fetch
        setLoading(true)
        const fresh   = await fetchPhotos(categoryRef.current)
        const unseen  = filterUnseen(fresh, categoryRef.current)
        const pool    = unseen.length >= PAGE ? unseen : fresh
        const deduped = pool.filter(p => !seenIdsRef.current.has(p.id))
        deduped.forEach(p => seenIdsRef.current.add(p.id))
        bufferRef.current = deduped.slice(PAGE)
        const shown = deduped.slice(0, PAGE)
        markSeen(shown)
        setPhotos(prev => [...prev, ...shown])
      }
    } catch (e) {
      console.error('loadMore error', e)
    } finally {
      setLoading(false)
      loadingRef.current = false // 항상 잠금 해제
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
