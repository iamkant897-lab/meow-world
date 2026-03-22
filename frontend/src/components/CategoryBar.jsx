export const CATEGORIES = [
  { id: 'all',  label: '🐱 전체'          },
  { id: 'gif',  label: '🎬 움짤'          },
  { id: 'ragd', label: '🤍 랙돌'          },
  { id: 'mcoo', label: '🦁 메인쿤'        },
  { id: 'munc', label: '🐾 먼치킨'        },
  { id: 'norw', label: '🌲 노르웨이숲'    },
  { id: 'sibe', label: '❄️ 시베리안'      },
  { id: 'bali', label: '🌸 발리니즈'      },
  { id: 'birm', label: '✨ 버만'          },
  { id: 'raga', label: '🧸 랙어머핀'      },
  { id: 'bslo', label: '🇬🇧 브리티시 롱헤어' },
  { id: 'tang', label: '🤍 터키시 앙고라' },
  { id: 'soma', label: '🦊 소말리'        },
]

export default function CategoryBar({ active, onChange }) {
  return (
    <div className="category-bar">
      <div className="category-inner">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`cat-btn${active === c.id ? ' active' : ''}`}
            onClick={() => onChange(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
