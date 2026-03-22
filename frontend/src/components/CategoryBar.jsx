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

  function updateFade() {
    const el = innerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    updateFade()
    el.addEventListener('scroll', updateFade)
    window.addEventListener('resize', updateFade)
    return () => {
      el.removeEventListener('scroll', updateFade)
      window.removeEventListener('resize', updateFade)
    }
  }, [])

  // PC: 마우스 휠로 가로 스크롤
  function handleWheel(e) {
    if (!innerRef.current) return
    e.preventDefault()
    innerRef.current.scrollBy({ left: e.deltaY || e.deltaX, behavior: 'smooth' })
  }

  return (
    <div className="category-bar">
      {canLeft  && <div className="cat-fade cat-fade-left"  />}
      {canRight && <div className="cat-fade cat-fade-right" />}
      <div className="category-inner" ref={innerRef} onWheel={handleWheel}>
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
