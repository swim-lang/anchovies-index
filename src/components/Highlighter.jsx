import { useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'

/*
 * HIGHLIGHT IT (Notably)
 * Notably's campaign sets a line in type and picks out the words that matter
 * with a highlighter. Here the line is yours to mark: drag across words to
 * highlight them, click a highlighted word to take it off. "As on the
 * billboard" puts back the studio's own choices.
 */

// A chisel-tip highlighter, as the cursor (tip at the bottom left).
const PEN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g transform="rotate(45 18 18)"><rect x="13" y="2" width="10" height="20" rx="2" fill="#2b2b2a"/><rect x="13" y="18" width="10" height="6" fill="#e9e48a" stroke="#2b2b2a" stroke-width="1"/><path d="M14 24 L22 24 L20 31 L16 31 Z" fill="#d9d36a" stroke="#2b2b2a" stroke-width="1"/></g></svg>',
)}") 4 32, crosshair`

export default function Highlighter({ text, marks = [], color = '#e9e48a', caption }) {
  const words = text.split(' ')
  const [lit, setLit] = useState(() => new Set(marks))
  const [fresh, setFresh] = useState(() => new Set())
  const drag = useRef(null)
  const reduced = prefersReducedMotion()

  const wordAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-w]')
    return el ? Number(el.dataset.w) : null
  }
  const paint = (from, to, on) => {
    const [a, b] = from <= to ? [from, to] : [to, from]
    setLit((cur) => {
      const next = new Set(drag.current?.base ?? cur)
      for (let i = a; i <= b; i++) on ? next.add(i) : next.delete(i)
      return next
    })
    if (on) setFresh((f) => new Set([...f, ...Array.from({ length: b - a + 1 }, (_, k) => a + k)]))
  }

  const onDown = (e) => {
    const i = wordAt(e)
    if (i == null) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const on = !lit.has(i)
    drag.current = { from: i, on, base: new Set(lit), moved: false }
    sfx(on ? 'pencil' : 'unstick')
    paint(i, i, on)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const i = wordAt(e)
    if (i == null) return
    d.moved = true
    sfx('pencil', { throttle: 60 })
    paint(d.from, i, d.on)
  }
  const onUp = () => {
    drag.current = null
    setTimeout(() => setFresh(new Set()), 450)
  }

  return (
    <div className="hl-block">
      <div
        className="hl-stage"
        style={{ '--hl': color, cursor: PEN }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <p className="hl-text" aria-label={text}>
          {words.map((w, i) => (
            <span key={i}>
              <span
                data-w={i}
                className={`hl-word${lit.has(i) ? ' is-lit' : ''}${fresh.has(i) && !reduced ? ' is-fresh' : ''}${lit.has(i) && !lit.has(i - 1) ? ' is-start' : ''}${lit.has(i) && !lit.has(i + 1) ? ' is-end' : ''}`}
                aria-hidden="true"
              >
                {w}
              </span>
              {i < words.length - 1 && <span className={`hl-gap${lit.has(i) && lit.has(i + 1) ? ' is-lit' : ''}`}> </span>}
            </span>
          ))}
        </p>
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {lit.size} {lit.size === 1 ? 'word' : 'words'} highlighted<span className="stack-kind"> · drag across the words</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => (sfx('flip'), setLit(new Set(marks)))}>
            As on the billboard
          </button>
          <button type="button" className="text-btn label" onClick={() => (sfx('unstick'), setLit(new Set()))} disabled={!lit.size}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
