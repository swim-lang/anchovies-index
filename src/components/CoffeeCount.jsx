import { useEffect, useState } from 'react'

/*
 * COFFEE COUNT
 * The office cup (plain white, black lid) and this week's tally.
 * Click the cup to log one; the count starts over each Monday.
 *
 * Stored in this browser only (localStorage). To share one count across the
 * team, point `load`/`save` at a small shared store instead.
 */

const KEY = 'anchovies-coffee'

// ISO week, e.g. "2026-W40": the tally resets when this changes.
function weekOf(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y = t.getUTCFullYear()
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7)
  return `${y}-W${String(w).padStart(2, '0')}`
}

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    if (v && v.week === weekOf()) return v.count
  } catch {
    /* storage unavailable */
  }
  return 0
}

function save(count) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ week: weekOf(), count }))
  } catch {
    /* storage unavailable: the count still works for this visit */
  }
}

export default function CoffeeCount() {
  const [count, setCount] = useState(load)
  const [bump, setBump] = useState(0)

  useEffect(() => save(count), [count])

  return (
    <div className="coffee" aria-live="polite">
      <button
        type="button"
        className="coffee-cup"
        onClick={() => {
          setCount((c) => c + 1)
          setBump((b) => b + 1)
        }}
        aria-label={`Log a coffee. ${count} this week.`}
        title="Log a coffee"
      >
        <svg key={bump} viewBox="0 0 40 52" className={bump ? 'is-bumped' : ''} aria-hidden="true">
          {/* steam */}
          <path className="coffee-steam" d="M16 8 c-3 -3 3 -5 0 -8 M24 8 c-3 -3 3 -5 0 -8" fill="none" stroke="#9a9993" strokeWidth="1.4" strokeLinecap="round" />
          {/* lid */}
          <path d="M8 13 H32 L33 16 H7 Z" fill="#1a1a19" />
          <rect x="6" y="16" width="28" height="4" rx="1.5" fill="#111" />
          <rect x="15" y="12" width="10" height="2" rx="1" fill="#2c2c2a" />
          {/* cup */}
          <path d="M8 20 H32 L29 50 H11 Z" fill="#fbfbf8" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
          <path d="M9.5 30 H30.5 L29.7 38 H10.3 Z" fill="#f0efea" />
        </svg>
      </button>
      <span className="coffee-count">
        <span className="coffee-num">{count}</span>
        <span className="label muted">{count === 1 ? 'coffee' : 'coffees'} this week</span>
      </span>
      {count > 0 && (
        <button type="button" className="coffee-undo label" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="Remove one coffee">
          −1
        </button>
      )}
    </div>
  )
}
