export default function Header({ onRefresh, onRandom }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-paw">🐱</span>
          <div>
            <div className="logo-name">냥월드</div>
            <div className="logo-sub">전세계 실시간 냥월드</div>
          </div>
        </div>

        <div className="hdr-right">
          <div className="live-chip">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
          <button className="btn btn-ghost" onClick={onRefresh}>
            🔄 새로고침
          </button>
          <button className="btn btn-grad" onClick={onRandom}>
            🎲 랜덤 냥이
          </button>
        </div>
      </div>
    </header>
  )
}
