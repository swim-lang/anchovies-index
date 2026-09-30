import { useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'

/*
 * TEAR AT THE PERFORATION (Runway)
 * The studio's aftercare boarding pass, front and back. Pull the stub: it strains
 * at the perforation, then tears away with a ragged edge. Turn the pass over to
 * read the flight plan on the back: lift the dog-eared corner and it turns over.
 */

const TEAR_AT = 70 // px of pull before the paper gives
const R = 1.3 // corner radius, % of the width
const FOLD = 4.2 // dog-ear size, % of the width (grows on hover)

// A seam at x (%), top to bottom: straight until torn, then ragged.
function seam(x, torn) {
  if (!torn) return [[x, 0], [x, 100]]
  const teeth = 22
  return Array.from({ length: teeth + 1 }, (_, i) => [x + (i % 2 ? 0.55 : -0.55) + (((i * 37) % 7) - 3) * 0.08, (i / teeth) * 100])
}

// A quarter arc from angle a0 to a1 (degrees) about (cx, cy).
function arc(cx, cy, rx, ry, a0, a1) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / 5) * Math.PI) / 180
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  })
}

/*
 * The outline of one piece of the pass as a clip-path polygon, in % of the
 * face. `from`/`to` bound it horizontally; an outer edge gets rounded corners,
 * an inner one is the perforation. `fold` cuts the dog-ear off one outer corner.
 * Every outline has the same number of points, so clip-path transitions smoothly.
 */
function outline({ from, to, outerLeft, torn, fold, aspect }) {
  const rx = R
  const ry = R * aspect
  const fx = fold ?? 0
  const fy = fx * aspect
  let pts = []
  if (outerLeft) {
    pts.push(...arc(rx, ry, rx, ry, 180, 270)) // top-left
    pts.push(...seam(to, torn)) // right edge: the perforation
    // bottom-left: the dog-ear, as two points plus padding to match the arc's six
    const bl = fold ? [[fx, 100], [fx, 100], [fx, 100], [0, 100 - fy], [0, 100 - fy], [0, 100 - fy]] : arc(rx, 100 - ry, rx, ry, 90, 180)
    pts.push(...bl)
  } else {
    pts.push(...arc(100 - rx, ry, rx, ry, 270, 360)) // top-right
    const br = fold ? [[100, 100 - fy], [100, 100 - fy], [100, 100 - fy], [100 - fx, 100], [100 - fx, 100], [100 - fx, 100]] : arc(100 - rx, 100 - ry, rx, ry, 0, 90)
    pts.push(...br)
    pts.push(...seam(from, torn).reverse()) // left edge: the perforation, bottom to top
  }
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`
}

// One side of one piece: paper, grain and bevel, plus (optionally) the dog-ear.
function Face({ src, alt, clip, back, fold, onTurn, onHover, aspect, label }) {
  return (
    <div className={`pass-face${back ? ' is-back' : ''}`}>
      <div className="pass-paper" style={{ clipPath: clip, borderRadius: `${R}% / ${R * aspect}%` }}>
        <img src={src} alt={alt} draggable={false} />
      </div>
      {fold != null && (
        <button
          type="button"
          className={`pass-fold${back ? ' is-right' : ''}`}
          style={{ width: `${fold}%`, height: `${fold * aspect}%` }}
          onClick={onTurn}
          onPointerEnter={() => onHover(true)}
          onPointerLeave={() => onHover(false)}
          onFocus={() => onHover(true)}
          onBlur={() => onHover(false)}
          aria-label={label}
        >
          <span />
        </button>
      )}
    </div>
  )
}

export default function BoardingPass({ front, back, perf = 0.675 }) {
  const [flipped, setFlipped] = useState(false)
  const [torn, setTorn] = useState(false)
  const [pull, setPull] = useState({ x: 0, y: 0, r: 0 })
  const [lift, setLift] = useState(false) // the dog-ear lifts under the pointer
  const drag = useRef(null)
  const reduced = prefersReducedMotion()

  const onDown = (e) => {
    if (flipped || (e.pointerType === 'mouse' && e.button !== 0)) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    drag.current = { x0: e.clientX - pull.x, y0: e.clientY - pull.y, torn }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!torn) {
      // Paper under tension: it gives a little, then all at once.
      if (Math.hypot(dx, dy) > TEAR_AT) {
        sfx('tear')
        setTorn(true)
        setPull({ x: dx, y: dy, r: dx * 0.03 })
      } else setPull({ x: dx * 0.12, y: dy * 0.12, r: dy * -0.02 })
      return
    }
    setPull({ x: dx, y: dy, r: dx * 0.03 + dy * 0.02 })
  }
  const onUp = () => {
    drag.current = null
    if (!torn) setPull({ x: 0, y: 0, r: 0 })
  }

  const reset = () => {
    setTorn(false)
    setPull({ x: 0, y: 0, r: 0 })
    setFlipped(false)
  }

  const aspect = front.w / front.h
  const fold = lift ? FOLD * 1.45 : FOLD
  const p = perf * 100
  const turn = () => (sfx('flip'), setFlipped((f) => !f))
  // The stub is on the right of the front, so on the left of the back.
  const mainClip = outline({ to: p, outerLeft: true, torn, fold, aspect })
  const stubClip = outline({ from: p, outerLeft: false, torn, aspect })
  const backMain = outline({ from: 100 - p, outerLeft: false, torn, fold, aspect })
  const backStub = outline({ to: 100 - p, outerLeft: true, torn, aspect })
  const faceProps = { aspect, onTurn: turn, onHover: setLift }

  return (
    <div className="pass-block">
      <div className="pass-stage" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="pass" style={{ aspectRatio: `${front.w} / ${front.h}` }}>
          <div className={`pass-turn${flipped ? ' is-flipped' : ''}`}>
            {/* The main part of the pass */}
            <div className="pass-piece">
              <Face src={front.src} alt={front.alt} clip={mainClip} fold={flipped ? null : fold} label="Turn the pass over" {...faceProps} />
              <Face src={back.src} alt={back.alt} clip={backMain} back fold={flipped ? fold : null} label="Turn the pass back to the front" {...faceProps} />
            </div>
            {/* The stub: pull it */}
            <div
              className={`pass-piece pass-stub${torn ? ' is-torn' : ''}`}
              style={{
                transform: `translate(${pull.x}px, ${pull.y}px) rotate(${pull.r}deg)`,
                transformOrigin: `${perf * 100}% 50%`,
                transition: drag.current || reduced ? 'none' : undefined,
              }}
              onPointerDown={onDown}
              role="button"
              tabIndex={0}
              aria-label={torn ? 'The torn-off stub' : 'The stub. Pull to tear it off along the perforation.'}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !torn) {
                  e.preventDefault()
                  setTorn(true)
                  setPull({ x: 60, y: 26, r: 4 })
                }
              }}
            >
              <Face src={front.src} alt="" clip={stubClip} {...faceProps} />
              <Face src={back.src} alt="" clip={backStub} back {...faceProps} />
            </div>
          </div>
        </div>
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {flipped ? 'Back' : 'Front'}
            <span className="stack-kind"> · {torn ? 'stub torn off' : 'pull the stub to tear it'} · click the folded corner to turn it</span>
          </span>
          <span className="stack-text">{flipped ? 'Flight plan: what to expect' : 'Aftercare pass'}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={reset} disabled={!torn && !flipped}>
            New pass
          </button>
        </div>
      </div>
    </div>
  )
}
