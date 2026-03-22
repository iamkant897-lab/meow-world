import { useEffect } from 'react'

export default function Settings({ blockedBreeds, onUnblock, onClearAll, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const breeds = [...blockedBreeds].sort()

  return (
    <div className="settings-bg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-panel">
        <div className="settings-hdr">
          <span className="settings-title">⚙️ 설정</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">
            🚫 차단한 품종
            <span className="settings-badge">{breeds.length}</span>
          </div>

          {breeds.length === 0 ? (
            <p className="settings-empty">차단한 품종이 없어요 😊</p>
          ) : (
            <>
              <div className="blocked-list">
                {breeds.map(breed => (
                  <div key={breed} className="blocked-item">
                    <span>🐱 {breed}</span>
                    <button className="unblock-btn" onClick={() => onUnblock(breed)}>
                      해제
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm clear-all-btn" onClick={onClearAll}>
                🗑️ 전체 차단 해제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
