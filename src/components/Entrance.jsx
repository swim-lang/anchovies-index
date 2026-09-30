import { useEffect, useRef } from 'react'
import { ROOMS } from '../content/rooms.js'

/*
 * THE ENTRANCE
 * First thing on arrival: four doors, one per room. Pick one and the entrance
 * lifts away onto that room. Drawn as simple line objects in one weight.
 */

function RoomGlyph({ room }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }
  switch (room) {
    case 'cabinet':
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="14" y="10" width="52" height="62" rx="2" {...s} />
          {[12, 31, 50].map((y) => (
            <g key={y}>
              <rect x="19" y={y + 2} width="42" height="15" rx="1" {...s} />
              <rect x="30" y={y + 5} width="20" height="5" {...s} />
              <path d={`M34 ${y + 13} h12`} {...s} />
            </g>
          ))}
        </svg>
      )
    case 'fridge':
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="20" y="6" width="40" height="68" rx="4" {...s} />
          <path d="M20 28 H60 M25 14 v8 M25 34 v14" {...s} />
          <circle cx="44" cy="17" r="3" {...s} />
          <rect x="38" y="40" width="7" height="7" {...s} />
          <path d="M50 52 l4 6 h-8 z" {...s} />
        </svg>
      )
    case 'vending':
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="16" y="6" width="48" height="68" rx="2" {...s} />
          <rect x="21" y="11" width="28" height="44" {...s} />
          {[20, 31, 42].map((y) => (
            <path key={y} d={`M23 ${y} h24`} {...s} />
          ))}
          <rect x="53" y="13" width="7" height="6" {...s} />
          <path d="M54 25 h5 M54 30 h5 M54 35 h5" {...s} />
          <rect x="24" y="60" width="22" height="8" {...s} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="30" y="8" width="20" height="24" {...s} />
          <path d="M34 15 h12 M34 20 h9" {...s} />
          <rect x="14" y="30" width="52" height="8" rx="4" {...s} />
          <path d="M18 40 H62 L70 68 H10 Z" {...s} />
          {[48, 55, 62].map((y, r) =>
            Array.from({ length: 7 - r }, (_, i) => <circle key={`${y}-${i}`} cx={22 + r * 3 + i * 6} cy={y} r="1.8" {...s} />),
          )}
        </svg>
      )
  }
}

export default function Entrance({ onPick }) {
  const first = useRef(null)
  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div className="entrance" role="dialog" aria-modal="true" aria-labelledby="entrance-title">
      <div className="entrance-inner" ref={first} tabIndex={-1}>
        <p className="label muted">The Anchovies Index</p>
        <h1 id="entrance-title" className="entrance-title">
          Where to first?
        </h1>
        <ol className="entrance-rooms">
          {ROOMS.map((r, i) => (
            <li key={r.key}>
              <button type="button" className="entrance-room" onClick={() => onPick(r.key)}>
                <span className="label muted">{String(i + 1).padStart(2, '0')}</span>
                <RoomGlyph room={r.key} />
                <span className="entrance-room-title">{r.title}</span>
                <span className="entrance-room-what">{r.what}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
