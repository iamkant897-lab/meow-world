const express   = require('express');
const cors      = require('cors');
const fetch     = require('node-fetch');
const NodeCache = require('node-cache');

const app   = express();
const cache = new NodeCache({ stdTTL: 60 });

app.use(cors());
app.use(express.json());

const CAT_API_KEY = 'live_24rszkvopcd0OJ1ucmgPLf6xIMBWfXf26X8xOteZ64qZ8vm8EpJ57XfVM651ce4p';

// breed_id 목록
const BREED_IDS = {
  munc: 'munc', pers: 'pers', rblu: 'rblu', beng: 'beng',
  ragd: 'ragd', mcoo: 'mcoo', siam: 'siam', bsho: 'bsho',
  sfol: 'sfol', abys: 'abys',
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchCatAPI(limit = 50, breedId = null) {
  try {
    const breedParam = breedId ? `&breed_ids=${breedId}` : '';
    const res  = await fetch(
      `https://api.thecatapi.com/v1/images/search?limit=${limit}&order=RAND${breedParam}&api_key=${CAT_API_KEY}`,
      { timeout: 8000 }
    );
    const data = await res.json();
    return data.map(i => ({
      id:     'ca_' + i.id,
      url:    i.url,
      thumb:  i.url,
      source: 'catapi',
      author: 'TheCatAPI',
      link:   i.url,
      w:      i.width  || 500,
      h:      i.height || 400,
      breed:  i.breeds?.[0]?.name || null,
      title:  i.breeds?.[0]?.name ? `${i.breeds[0].name} 고양이` : '귀여운 고양이',
    }));
  } catch (e) {
    console.warn('[CatAPI] error:', e.message);
    return [];
  }
}

// ─── ROUTES ───────────────────────────────────

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// GET /api/photos?page=1&category=all
app.get('/api/photos', async (req, res) => {
  const category = req.query.category || 'all';
  const page     = parseInt(req.query.page) || 1;
  const cacheKey = `${category}_${page}_${Math.floor(Date.now() / 60000)}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json({ photos: cached });

  try {
    const breedId = BREED_IDS[category] || null;

    // 2배치 병렬로 가져와서 중복 제거 → 다양한 사진 확보
    const [batch1, batch2] = await Promise.all([
      fetchCatAPI(50, breedId),
      fetchCatAPI(50, breedId),
    ]);

    const seen   = new Set();
    const photos = [];
    for (const p of shuffle([...batch1, ...batch2])) {
      if (!seen.has(p.id)) { seen.add(p.id); photos.push(p); }
    }

    cache.set(cacheKey, photos);
    res.json({ photos });
  } catch (e) {
    console.error('[/api/photos] error:', e);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// GET /api/random
app.get('/api/random', async (_, res) => {
  try {
    const r    = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${CAT_API_KEY}`);
    const [d]  = await r.json();
    res.json({
      id:     'rnd_' + d.id,
      url:    d.url,
      thumb:  d.url,
      source: 'catapi',
      author: 'TheCatAPI',
      link:   d.url,
      w:      d.width,
      h:      d.height,
      breed:  d.breeds?.[0]?.name || null,
      title:  d.breeds?.[0]?.name ? `${d.breeds[0].name} 고양이 🐱` : '🎲 랜덤 귀여운 냥이',
    });
  } catch (e) {
    res.status(500).json({ error: 'Random cat fetch failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🐱 냥월드 서버 실행 중 → http://localhost:${PORT}/api/health\n`);
});
