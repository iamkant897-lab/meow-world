import { useRef, useState, useEffect } from 'react'

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
  { id: 'sfol', label: '🙉 스코티쉬 폴드' },
  { id: 'bsho', label: '🩶 브리티시 숏헤어' },
  { id: 'beng', label: '🐆 뱅갈'          },
  { id: 'rblu', label: '💙 러시안 블루'   },
  { id: 'siam', label: '👑 샴'            },
]

export default function CategoryBar({ active, onChange }) {
  const innerRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)

  function updateArrows() {
    const el = innerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows)
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [])

  function scroll(dir) {
    innerRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  return (
    <div className="category-bar">
      {canLeft  && <button className="cat-arrow cat-arrow-left"  onClick={() => scroll(-1)}>‹</button>}
      {canRight && <button className="cat-arrow cat-arrow-right" onClick={() => scroll( 1)}>›</button>}
      <div className="category-inner" ref={innerRef}>
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
