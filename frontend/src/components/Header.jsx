export default function Header({ onRefresh, onSettings }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={onRefresh} title="클릭하면 새로고침" style={{ cursor: 'pointer' }}>
          <span className="logo-paw">🐱</span>
          <div>
            <div className="logo-name">냥월드</div>
            <div className="logo-sub">전세계 실시간 냥월드</div>
          </div>
        </div>

        <div className="hdr-right">
          <button className="btn btn-ghost" onClick={onRefresh}>
            🔄 새로고침
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onSettings} title="설정">
            ⚙️
          </button>
        </div>
      </div>
    </header>
  )
}
