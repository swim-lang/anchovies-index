import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'
import '../styles/heartwood.css'

/*
 * THE RINGS (Heartwood)
 * Heartwood's mark is two wavy rings, one inside the other. Here it is large and slowly alive: the
 * rings turn in opposite directions and the whole mark breathes. Hover to
 * quicken them; grab a ring and spin it. Reduced motion: still, but a ring can
 * still be turned by hand (drag, or the arrow keys).
 *
 * The rings are the two paths of the supplied SVG, unaltered. If a future file
 * arrives as a single compound path, its subpaths are split on "M" and grouped
 * by bounding box (after PlateWindow's approach for Arc88).
 */

const BASE = [5, -7.5] // degrees per second: outer, inner
const HOVER = 3.2 // speed-up while the pointer rests on the mark

// Rings from the SVG text: one per <path>. A single compound path is split on
// absolute "M" subpaths and grouped by bounding box: the subpaths inside the
// largest box's central 75% belong to the inner ring. Relative "m" subpaths can't
// be split safely, so such a file is shown whole, as one turning mark.
function bbox(sub) {
  const n = (sub.match(/-?\d*\.?\d+/g) || []).map(Number)
  const xs = n.filter((_, i) => i % 2 === 0)
  const ys = n.filter((_, i) => i % 2 === 1)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

function ringsFrom(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const vb = (doc.documentElement.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number)
  const ds = [...doc.querySelectorAll('path')].map((p) => p.getAttribute('d'))
  if (ds.length >= 2) return { vb, rings: ds.slice(0, 2) }
  const d = ds[0] || ''
  const subs = d.split(/(?=[Mm])/).map((x) => x.trim()).filter(Boolean)
  if (subs.length < 2 || subs.some((x) => x[0] === 'm') || !/[Mm]/.test(d[0])) return { vb, rings: [d] }
  // Absolute-only paths: rough boxes from absolute coordinates (good enough to sort by size).
  const boxes = subs.map((x) => ({ x, b: bbox(x) }))
  const big = boxes.reduce((a, c) => (c.b.x1 - c.b.x0 > a.b.x1 - a.b.x0 ? c : a)).b
  const cx = (big.x0 + big.x1) / 2
  const w = (big.x1 - big.x0) / 2
  const inner = (b) => b.x0 > cx - w * 0.75 && b.x1 < cx + w * 0.75
  return {
    vb,
    rings: [boxes.filter((o) => !inner(o.b)).map((o) => o.x).join(' '), boxes.filter((o) => inner(o.b)).map((o) => o.x).join(' ')].filter(Boolean),
  }
}

export default function HeartwoodRings({ mark, caption }) {
  const [shape, setShape] = useState(null)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const reduced = prefersReducedMotion()
  const stage = useRef(null)
  const ringEls = useRef([])
  const st = useRef({ a: [0, 0], extra: [0, 0], boost: 1, boostTarget: 1, drag: null, last: 0 })

  useEffect(() => {
    let alive = true
    fetch(mark.src)
      .then((r) => r.text())
      .then((t) => alive && setShape(ringsFrom(t)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [mark.src])

  const paint = () => {
    const s = st.current
    ringEls.current.forEach((el, i) => el && (el.style.transform = `rotate(${s.a[i]}deg)`))
  }

  // The turning: base speed × hover boost, plus any fling, which decays back to nothing.
  useEffect(() => {
    if (!shape) return
    paint()
    let id = 0
    let prev = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const s = st.current
      s.boost += (s.boostTarget - s.boost) * Math.min(1, dt * 2.5)
      for (let i = 0; i < 2; i++) {
        if (s.drag?.ring === i) continue
        const base = playing ? BASE[i] * s.boost : 0
        s.a[i] += (base + s.extra[i]) * dt
        s.extra[i] *= Math.exp(-dt * 1.1)
        if (Math.abs(s.extra[i]) < 0.05) s.extra[i] = 0
      }
      paint()
      id = requestAnimationFrame(tick)
    }
    if (!reduced) id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [shape, playing, reduced])

  const angleAt = (e) => {
    const r = stage.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    return { deg: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI, dist: Math.hypot(e.clientX - cx, e.clientY - cy) / (r.width / 2) }
  }

  const onDown = (e) => {
    if (!shape) return
    const { deg, dist } = angleAt(e)
    if (dist > 1.05) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    // The inner ring sits inside ~70% of the radius; outside that, the outer ring.
    const ring = rings.length > 1 && dist < 0.75 ? 1 : 0
    st.current.drag = { ring, deg, t: performance.now(), v: 0, travelled: 0 }
    st.current.extra[ring] = 0
    sfx('pick')
  }
  const onMove = (e) => {
    const s = st.current
    if (e.pointerType === 'mouse' && !s.drag) s.boostTarget = angleAt(e).dist <= 1 ? HOVER : 1
    const d = s.drag
    if (!d) return
    const { deg } = angleAt(e)
    let delta = deg - d.deg
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const now = performance.now()
    const dt = Math.max(1, now - d.t) / 1000
    d.v = d.v * 0.6 + (delta / dt) * 0.4
    d.deg = deg
    d.t = now
    s.a[d.ring] += delta
    const before = Math.floor(d.travelled / 30)
    d.travelled += Math.abs(delta)
    if (Math.floor(d.travelled / 30) !== before) sfx('tick', { throttle: 50 })
    if (reduced) paint()
  }
  const onUp = () => {
    const s = st.current
    const d = s.drag
    if (!d) return
    s.drag = null
    // Let go mid-spin and it carries on (not with reduced motion).
    if (!reduced && performance.now() - d.t < 90) {
      s.extra[d.ring] = Math.max(-720, Math.min(720, d.v)) - (playing ? BASE[d.ring] * s.boost : 0)
      if (Math.abs(d.v) > 200) sfx('whoosh')
    }
  }

  const onKey = (e) => {
    const map = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [1, 1], ArrowDown: [1, -1] }
    const k = map[e.key]
    if (!k) return
    e.preventDefault()
    const [ring, dir] = k
    const i = Math.min(ring, rings.length - 1)
    if (reduced) {
      st.current.a[i] += dir * 15
      paint()
    } else st.current.extra[i] += dir * 120
    sfx('tick', { throttle: 60 })
  }

  const rings = shape?.rings ?? []
  const vb = shape?.vb ?? [0, 0, 193.6, 192.16]

  return (
    <div className="hw-block">
      <div className="hw-ground">
        <div
          ref={stage}
          className={`hw-mark${playing && !reduced ? ' is-breathing' : ''}`}
          role="application"
          aria-roledescription="logo"
          tabIndex={0}
          aria-label={`${mark.alt}. ${reduced || !playing ? 'Still.' : 'Turning slowly.'} Drag a ring to spin it; left and right arrows turn the outer ring, up and down the inner.`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={() => (st.current.boostTarget = 1)}
          onKeyDown={onKey}
        >
          <svg viewBox={vb.join(' ')} aria-hidden="true">
            {rings.map((d, i) => (
              <path key={i} ref={(el) => (ringEls.current[i] = el)} className="hw-ring" d={d} />
            ))}
          </svg>
        </div>
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {rings.length > 1 ? 'Two rings' : 'The mark'}
            <span className="stack-kind"> · {reduced ? 'drag a ring to turn it' : 'hover to quicken · drag to spin'}</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        {!reduced && (
          <div className="stack-controls">
            <button type="button" className="text-btn label" aria-pressed={!playing} onClick={() => (sfx('button'), setPlaying((p) => !p))}>
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
