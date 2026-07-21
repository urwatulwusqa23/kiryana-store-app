import { useEffect, useRef, useState } from 'react'
import {
  Wheat, Carrot, Apple, Fish, Milk, Coffee, Cherry, Croissant,
  Banana, Egg, IceCream2, Candy, Salad, Cookie, Grape, Beef,
} from 'lucide-react'

const ITEMS = [
  { Icon: Wheat,        top: '6%',  left: '4%',  size: 34, color: '#e0a72c', bg: '#fbf1dc', dur: '14s', delay: '0s',   depth: 30 },
  { Icon: Carrot,       top: '10%', left: '30%', size: 30, color: '#d17a2e', bg: '#fbe9d8', dur: '17s', delay: '1s',   depth: 45 },
  { Icon: Grape,        top: '4%',  left: '56%', size: 32, color: '#8a5c8a', bg: '#f3e8f3', dur: '16s', delay: '0.6s', depth: 20 },
  { Icon: Cookie,       top: '5%',  left: '80%', size: 30, color: '#e0a72c', bg: '#fbf1dc', dur: '15s', delay: '2.8s', depth: 35 },
  { Icon: Apple,        top: '26%', left: '92%', size: 36, color: '#c1392b', bg: '#faece9', dur: '13s', delay: '2s',   depth: 50 },
  { Icon: IceCream2,    top: '30%', left: '10%', size: 30, color: '#d17a2e', bg: '#fbe9d8', dur: '16s', delay: '3.4s', depth: 25 },
  { Icon: Coffee,       top: '34%', left: '38%', size: 32, color: '#6e5f45', bg: '#f0e8da', dur: '18s', delay: '2.5s', depth: 40 },
  { Icon: Egg,          top: '40%', left: '64%', size: 26, color: '#9a8a68', bg: '#f4efe4', dur: '14s', delay: '2.2s', depth: 30 },
  { Icon: Fish,         top: '56%', left: '4%',  size: 34, color: '#4a7d94', bg: '#e8f1f4', dur: '16s', delay: '0.5s', depth: 55 },
  { Icon: Candy,        top: '58%', left: '28%', size: 28, color: '#c1392b', bg: '#faece9', dur: '13s', delay: '1.8s', depth: 20 },
  { Icon: Beef,         top: '52%', left: '52%', size: 32, color: '#c1392b', bg: '#faece9', dur: '17s', delay: '1.4s', depth: 45 },
  { Icon: Cherry,       top: '60%', left: '86%', size: 28, color: '#c1392b', bg: '#faece9', dur: '12s', delay: '3s',   depth: 25 },
  { Icon: Milk,         top: '76%', left: '14%', size: 30, color: '#6e5f45', bg: '#f4efe4', dur: '15s', delay: '1.5s', depth: 35 },
  { Icon: Salad,        top: '80%', left: '40%', size: 32, color: '#4c7a41', bg: '#eaf3e6', dur: '17s', delay: '0.3s', depth: 50 },
  { Icon: Croissant,    top: '84%', left: '64%', size: 32, color: '#e0a72c', bg: '#fbf1dc', dur: '19s', delay: '0.8s', depth: 20 },
  { Icon: Banana,       top: '88%', left: '88%', size: 34, color: '#e0a72c', bg: '#fbf1dc', dur: '15s', delay: '1.2s', depth: 40 },
]

// variant="hero"   — full-size, full-opacity, for standalone entry screens (Login, Signup, portal landings).
// variant="subtle" — smaller/fewer/lower-opacity, meant to sit fixed behind data-dense pages (Dashboard, Inventory, ...)
//                     without competing with tables/charts for attention.
export default function GroceryBackdrop({ variant = 'hero', fixed = false }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const subtle = variant === 'subtle'
  const items = subtle ? ITEMS.filter((_, i) => i % 2 === 0) : ITEMS

  useEffect(() => {
    function onMove(e) {
      const w = window.innerWidth, h = window.innerHeight
      setMouse({ x: (e.clientX / w) * 2 - 1, y: (e.clientY / h) * 2 - 1 })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className={`${fixed ? 'fixed' : 'absolute'} inset-0 overflow-hidden pointer-events-none`}
      style={{ opacity: subtle ? 0.45 : 1, zIndex: fixed ? 0 : undefined }}
      aria-hidden="true">
      {items.map(({ Icon, top, left, size, color, bg, dur, delay, depth }, i) => {
        const s = subtle ? Math.round(size * 0.7) : size
        return (
          <div key={i}
            className="absolute"
            style={{
              top, left,
              transform: `translate(${mouse.x * depth}px, ${mouse.y * depth}px)`,
              transition: 'transform 0.35s ease-out',
            }}>
            <div className="grocery-float rounded-full flex items-center justify-center"
              style={{
                width: s + (subtle ? 18 : 26), height: s + (subtle ? 18 : 26),
                background: bg,
                boxShadow: subtle ? 'none' : '0 4px 14px rgba(44,36,22,0.08)',
                animationDuration: dur,
                animationDelay: delay,
              }}>
              <Icon size={s} color={color} strokeWidth={1.75} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
