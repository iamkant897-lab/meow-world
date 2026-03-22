// Vercel 서버리스 함수 — TheCatAPI 이미지 프록시 (CORS 우회용)
export default async function handler(req, res) {
  const { url } = req.query
  if (!url || !url.startsWith('https://cdn2.thecatapi.com/')) {
    return res.status(400).end()
  }
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('upstream error')
    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.end(buffer)
  } catch {
    res.status(502).end()
  }
}
