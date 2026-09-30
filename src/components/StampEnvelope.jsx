import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { HeldTool, ToolGlyph } from './Desk.jsx'
import { sfx } from '../motion/sound.js'

/*
 * STAMP AN ENVELOPE (Molly Engels)
 * Molly's hand-drawn stamps lie loose beside her envelope. Drag them onto the
 * envelope and they stick; drag a stuck one away and it peels off. When at least
 * one is on, "Post it" franks them with a cancellation mark.
 * A pencil lies beside it: pick it up and write on the letter poking out of
 * the envelope (strokes are clipped to the visible part of the letter).
 * Stamps and envelope are the studio's own artwork, used as supplied.
 */

// The letter's visible outline in the envelope image's own pixels (600 × 545).
const LETTER = '78,4 522,4 522,238 300,352 78,238'

const rand = (a, b) => a + Math.random() * (b - a)

export default function StampEnvelope({ envelope, stamps }) {
  const stageRef = useRef(null)
  const envRef = useRef(null)
  const [box, setBox] = useState(null) // measured size of the stage
  const [pos, setPos] = useState(null) // key → { x, y, r, stuck, z }
  const [posted, setPosted] = useState(false)
  const drag = useRef(null)
  const zTop = useRef(20)
  const reduced = prefersReducedMotion()

  const stampW = Math.round(Math.max(48, Math.min(76, (box?.w ?? 900) * 0.07)))
  const [pencil, setPencil] = useState(false) // holding the pencil
  const [lines, setLines] = useState([]) // pencil strokes, in envelope-image pixels
  const svgRef = useRef(null)
  const writing = useRef(false)

  // Lay the stamps out loosely along the right-hand side (below on narrow screens).
  useEffect(() => {
    const el = stageRef.current
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect
      setBox({ w, h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (pos || !box) return
    const narrow = box.w < 640
    const next = {}
    stamps.forEach((s, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      next[s.key] = narrow
        ? { x: 30 + (i % 5) * ((box.w - 60) / 5) + rand(-6, 6), y: box.h * 0.72 + Math.floor(i / 5) * 70 + rand(-6, 6), r: rand(-14, 14), stuck: false, z: i }
        : { x: box.w * 0.64 + col * (stampW + 22) + rand(-10, 10), y: 34 + row * (stampW * 1.08 + 12) + rand(-8, 8), r: rand(-16, 16), stuck: false, z: i }
    })
    setPos(next)
  }, [box, pos, stamps, stampW])

  const onDown = (key) => (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (pencil) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const p = pos[key]
    drag.current = { key, x0: e.clientX, y0: e.clientY, px: p.x, py: p.y }
    zTop.current += 1
    sfx('pick')
    setPos((q) => ({ ...q, [key]: { ...q[key], z: zTop.current, lifted: true, stuck: false } }))
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const x = d.px + e.clientX - d.x0
    const y = d.py + e.clientY - d.y0
    setPos((q) => ({ ...q, [d.key]: { ...q[d.key], x, y, r: q[d.key].r + (e.movementX || 0) * 0.08 } }))
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const env = envRef.current.getBoundingClientRect()
    const stage = stageRef.current.getBoundingClientRect()
    setPos((q) => {
      const p = q[d.key]
      const cx = stage.left + p.x + stampW / 2
      const cy = stage.top + p.y + stampW / 2
      // Stuck if the stamp's centre lands on the envelope.
      const onEnv = cx > env.left && cx < env.right && cy > env.top + env.height * 0.18 && cy < env.bottom
      sfx(onEnv ? 'stamp' : 'drop')
      return { ...q, [d.key]: { ...p, lifted: false, stuck: onEnv, r: onEnv ? rand(-5, 5) : p.r } }
    })
    setPosted(false)
  }

  const toLetter = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * 600, ((e.clientY - r.top) / r.height) * 545]
  }
  const onWriteDown = (e) => {
    if (!pencil) return
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    writing.current = true
    setLines((l) => [...l, [toLetter(e)]])
  }
  const onWriteMove = (e) => {
    if (!writing.current) return
    const pt = toLetter(e)
    sfx('pencil', { throttle: 70 })
    setLines((l) => [...l.slice(0, -1), [...l[l.length - 1], pt]])
  }
  const onWriteUp = () => {
    writing.current = false
  }

  useEffect(() => {
    if (!pencil) return
    const k = (e) => e.key === 'Escape' && (e.stopPropagation(), setPencil(false))
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [pencil])

  const stuck = pos ? Object.values(pos).filter((p) => p.stuck).length : 0

  return (
    <div className="stamp-block">
      <div ref={stageRef} className={`stamp-stage${pencil ? ' is-writing' : ''}`} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <img ref={envRef} className="stamp-envelope" src={envelope.src} alt={envelope.alt} draggable={false} />
        {/* The letter: a writing surface laid exactly over the envelope image */}
        <svg
          ref={svgRef}
          className="stamp-letter"
          viewBox="0 0 600 545"
          onPointerDown={onWriteDown}
          onPointerMove={onWriteMove}
          onPointerUp={onWriteUp}
          onPointerCancel={onWriteUp}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="molly-letter">
              <polygon points={LETTER} />
            </clipPath>
          </defs>
          <polygon points={LETTER} fill="transparent" className="stamp-letter-hit" />
          <g clipPath="url(#molly-letter)">
            {lines.map((l, i) => (
              <polyline key={i} points={l.map((p) => p.join(',')).join(' ')} fill="none" stroke="rgba(38,38,40,.85)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        </svg>
        {!pencil && (
          <button type="button" className="stamp-pencil" onClick={() => setPencil(true)} aria-label="Pick up the pencil to write on the letter">
            <ToolGlyph kind="pencil" />
          </button>
        )}
        {pos &&
          stamps.map((s) => {
            const p = pos[s.key]
            return (
              <button
                key={s.key}
                type="button"
                className={`stamp${p.stuck ? ' is-stuck' : ''}${p.lifted ? ' is-lifted' : ''}`}
                style={{
                  width: stampW,
                  transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`,
                  zIndex: p.z,
                  transition: p.lifted || reduced ? 'none' : undefined,
                }}
                onPointerDown={onDown(s.key)}
                aria-label={`${s.name} stamp${p.stuck ? ', on the envelope' : ''}`}
              >
                <img src={s.src} alt="" draggable={false} />
              </button>
            )
          })}
        {posted && (
          <svg
            className="postmark"
            viewBox="0 0 260 120"
            aria-hidden="true"
            style={(() => {
              const on = Object.values(pos).filter((q) => q.stuck)
              const cx = on.reduce((a, q) => a + q.x, 0) / on.length
              const cy = on.reduce((a, q) => a + q.y, 0) / on.length
              return { left: cx - stampW * 0.6, top: cy + stampW * 0.1 }
            })()}
          >
            <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <text x="60" y="48" textAnchor="middle" fontSize="12" fontFamily="var(--mono)" fill="currentColor">DENVER CO</text>
            <text x="60" y="66" textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="currentColor">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
            </text>
            <text x="60" y="82" textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="currentColor">{new Date().getFullYear()}</text>
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M112 ${28 + i * 16} q 18 -10 36 0 t 36 0 t 36 0 t 36 0`} fill="none" stroke="currentColor" strokeWidth="3" />
            ))}
          </svg>
        )}
      </div>
      {pencil && <HeldTool kind="pencil" length={170} />}
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {stuck} of {stamps.length} stamps on<span className="stack-kind"> · drag them onto the envelope</span>
          </span>
          <span className="stack-text">Handcrafted stamps featuring original watercolor illustrations.</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" disabled={!stuck || posted} onClick={() => (sfx('press'), setPosted(true))}>
            Post it <span aria-hidden="true">✉</span>
          </button>
          <button type="button" className="text-btn label" onClick={() => setPencil((v) => !v)} aria-pressed={pencil}>
            {pencil ? 'Put pencil down' : 'Write a note'}
          </button>
          <button
            type="button"
            className="text-btn label"
            onClick={() => {
              setPos(null)
              setPosted(false)
              setLines([])
            }}
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  )
}
