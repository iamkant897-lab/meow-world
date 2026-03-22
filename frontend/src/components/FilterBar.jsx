const FILTERS = [
  { key: 'all',   label: '🐱 전체',   countKey: 'all'   },
  { key: 'liked', label: '❤️ 좋아요', countKey: 'liked' },
]

export default function FilterBar({ active, onChange, counts }) {
  return (
    <div className="filter-bar">
      <div className="filter-inner">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`f-btn${active === f.key ? ' active' : ''}`}
            onClick={() => onChange(f.key)}
          >
            {f.label}
            <span className="f-num">{counts[f.countKey] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
