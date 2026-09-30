import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import IndexCard from './IndexCard.jsx'
import { prefersReducedMotion } from '../motion/timing.js'
import { agency } from '../content/projects.js'

/*
 * THE ROTARY INDEX
 * Cards clip onto a ring. A continuous `pos` (0 … n-1) drives the whole file:
 *   d = i - pos
 *   d > 0   waiting behind, rising in steps so each tab shows above the front card
 *   d = 0   upright and flat to the viewer (the card you can pull out)
 *   d < 0   flipped forward over the ring, lying face-down toward you
 * Pull down or scroll to flip forward, push up to flip back. Releasing hands
 * `pos` to a critically damped spring aimed at a whole card, so the flip lands
 * with weight and doesn't bounce.
 */

const SPRING_W = 10 // natural frequency: ≈ 0.5s settle, no overshoot
const DRAG_THRESHOLD = 6 // px before a press becomes a drag
const FLIP = 104 // degrees a card turns when it flips over the ring
const PX_PER_CARD = { y: 150, x: 220 } // drag distance that flips one card

function measure() {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const mobile = vw < 720
  const chrome = mobile ? 118 : 136 // header + footer
  const tabs = mobile ? 78 : 104 // room above the card for the stepped tabs
  const below = mobile ? 70 : 84 // room for the ring and a flipped card
  const avail = vh - chrome - tabs - below
  const cw = mobile ? Math.min(vw - 32, 460, avail / 1.18) : Math.min(vw * 0.56, 920, avail / 0.72)
  return {
    mobile,
    cw: Math.round(cw),
    step: mobile ? 11 : 15, // vertical rise per card behind
  }
}

const preload = (imgs) => imgs.filter(Boolean).forEach((i) => (new Image().src = i.src))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function Index({
  projects,
  active,
  onActiveChange,
  onOpen,
  receded,
  busy,
  hidden,
  cardEls,
  buttonEls,
}) {
  const n = projects.length
  const stageRef = useRef(null)
  const [m, setM] = useState(measure)
  const mRef = useRef(m)
  mRef.current = m

  const pos = useRef(active)
  const vel = useRef(0)
  const target = useRef(active)
  const raf = useRef(0)
  const fallback = useRef(0)
  const drag = useRef(null)
  const wheelIdle = useRef(0)
  const suppressClick = useRef(false)
  const [hinted, setHinted] = useState(false)

  // ── Render every card from pos ───────────────────────────────────────────
  const paint = useCallback(() => {
    const { step } = mRef.current
    cardEls.current.forEach((el, i) => {
      if (!el) return
      const d = i - pos.current
      let y = 0
      let z = 0
      let rot = 0
      let shade = 0
      let opacity = 1
      if (d >= 0) {
        // Behind: each card sits a step higher and further back, leaning slightly.
        y = -d * step
        z = -d * 26
        rot = d * 2.2
        shade = Math.min(d, 4) * 0.05
      } else {
        // Flipping forward over the ring.
        const f = Math.min(-d, 1.6)
        rot = -FLIP * Math.min(f, 1) - (f > 1 ? (f - 1) * 8 : 0)
        z = 2
        opacity = f <= 1 ? 1 : clamp((1.6 - f) / 0.6, 0, 1) // the second card over fades under the first
      }
      el.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rot}deg)`
      // Fade the faces, not the card: opacity on the card would flatten its 3D and show the wrong side.
      el.style.setProperty('--fade', String(opacity))
      el.style.visibility = d > 5.5 || opacity === 0 ? 'hidden' : ''
      el.style.setProperty('--shade', shade.toFixed(3))
      el.style.pointerEvents = d < -1.5 ? 'none' : ''
    })
  }, [cardEls])

  const loop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    let last = performance.now()
    const stepFn = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (!drag.current?.active && !wheelIdle.current) {
        const x = pos.current - target.current
        const a = -SPRING_W * SPRING_W * x - 2 * SPRING_W * vel.current
        vel.current += a * dt
        pos.current += vel.current * dt
        if (Math.abs(x) < 0.0008 && Math.abs(vel.current) < 0.002) {
          pos.current = target.current
          vel.current = 0
          paint()
          return
        }
      }
      paint()
      raf.current = requestAnimationFrame(stepFn)
    }
    raf.current = requestAnimationFrame(stepFn)
    // If frames stop (hidden tab), still land on the target card.
    clearTimeout(fallback.current)
    fallback.current = setTimeout(() => {
      if (drag.current?.active || wheelIdle.current || pos.current === target.current) return
      cancelAnimationFrame(raf.current)
      pos.current = target.current
      vel.current = 0
      paint()
    }, 1600)
  }, [paint])

  // Follow the active index (buttons, keyboard, tabs, index list, history).
  useEffect(() => {
    target.current = active
    if (prefersReducedMotion() && !drag.current?.active) {
      pos.current = active
      vel.current = 0
      paint()
    } else loop()
  }, [active, loop, paint])

  useLayoutEffect(() => {
    paint()
  }, [paint, m])

  // Dev only: window.__ring(1.4) freezes the ring at any position for inspection.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__ring = (p) => {
      cancelAnimationFrame(raf.current)
      pos.current = p
      paint()
    }
  }, [paint])

  useEffect(() => {
    const onResize = () => setM(measure())
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf.current)
      clearTimeout(fallback.current)
    }
  }, [])

  const go = useCallback(
    (i) => {
      const next = clamp(Math.round(i), 0, n - 1)
      setHinted(true)
      target.current = next
      onActiveChange(next)
      return next
    },
    [n, onActiveChange],
  )

  // Past either end the ring resists instead of stopping dead.
  const resist = useCallback(
    (p) => (p < 0 ? p * 0.25 : p > n - 1 ? n - 1 + (p - (n - 1)) * 0.25 : p),
    [n],
  )

  // ── Pointer: pull the cards over, with a clean click/drag distinction ────
  const onPointerDown = (e) => {
    if (hidden || busy || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      p0: pos.current,
      from: target.current,
      axis: null,
      active: false,
      samples: [{ v: 0, t: e.timeStamp }],
    }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      d.axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'
      d.active = true
      d.x0 = e.clientX
      d.y0 = e.clientY
      d.p0 = pos.current
      stageRef.current.setPointerCapture(e.pointerId)
      stageRef.current.classList.add('is-dragging')
      setHinted(true)
      loop()
      return
    }
    // Pulling down (or left) brings the next card forward.
    const travel = d.axis === 'y' ? (e.clientY - d.y0) / PX_PER_CARD.y : -(e.clientX - d.x0) / PX_PER_CARD.x
    pos.current = resist(d.p0 + travel)
    d.samples.push({ v: travel, t: e.timeStamp })
    if (d.samples.length > 6) d.samples.shift()
  }

  const endDrag = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.active) return
    stageRef.current.classList.remove('is-dragging')
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 0)

    const a = d.samples[0]
    const b = d.samples[d.samples.length - 1]
    const v = b.t > a.t ? clamp(((b.v - a.v) / (b.t - a.t)) * 1000, -12, 12) : 0 // cards per second
    // A flick can carry the file a few cards, like spinning the ring.
    const projected = pos.current + v * 0.22
    const next = clamp(Math.round(projected), Math.max(0, d.from - 3), Math.min(n - 1, d.from + 3))
    vel.current = v * 0.5
    go(next)
    loop()
  }

  const onClickCapture = (e) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  // The index doesn't scroll, so the wheel and trackpad turn the ring directly.
  useEffect(() => {
    const el = stageRef.current
    const onWheel = (e) => {
      if (hidden || busy) return
      e.preventDefault()
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      const unit = e.deltaMode === 1 ? 40 : 1
      pos.current = resist(pos.current + (delta * unit) / 320)
      vel.current = 0
      setHinted(true)
      clearTimeout(wheelIdle.current)
      wheelIdle.current = setTimeout(() => {
        wheelIdle.current = 0
        go(pos.current)
        loop()
      }, 110)
      loop()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [go, loop, resist, hidden, busy])

  // ── Keyboard, when focus is inside the index ─────────────────────────────
  const onKeyDown = (e) => {
    const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }
    let next = null
    if (e.key in keys) next = target.current + keys[e.key]
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    const i = go(next)
    if (e.target.classList.contains('card-button')) {
      setTimeout(() => buttonEls.current[i]?.focus({ preventScroll: true }), 0)
    }
  }

  const activate = (i) => {
    if (i !== active) return go(i)
    onOpen(i)
  }

  const current = projects[active]
  const pad = (v) => String(v).padStart(2, '0')

  return (
    <div
      className={`index${receded ? ' is-receded' : ''}${busy ? ' is-busy' : ''}`}
      style={{ '--cw': `${m.cw}px`, '--step': `${m.step}px` }}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <header className="index-top">
        <a className="brand" href={agency.site} aria-label="Anchovies (opens the live site)">
          <img className="brand-mark" src={agency.mark.src} alt="" width="28" height="28" />
          <span className="brand-name">Anchovies</span>
        </a>
        <p className="label index-title">Index <span aria-hidden="true">·</span> Selected work</p>
        <a className="label contact" href={agency.contact}>
          Contact
        </a>
      </header>

      <section
        ref={stageRef}
        className="stage"
        aria-roledescription="rotary index"
        aria-label="Selected work"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="rig">
          {projects.map((p, i) => (
            <IndexCard
              key={p.id}
              ref={(el) => (cardEls.current[i] = el)}
              buttonRef={(el) => (buttonEls.current[i] = el)}
              project={p}
              index={i}
              count={n}
              active={i === active}
              eager={Math.abs(i - active) <= 1}
              onActivate={() => activate(i)}
              onPreload={() => preload([p.identity, p.stack?.[0], p.feature])}
            />
          ))}
          <div className="ring" aria-hidden="true">
            <span className="ring-rod" />
          </div>
        </div>
      </section>

      <footer className="index-foot">
        <ol className="toc" aria-label="Projects in this index">
          {projects.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={`toc-item label${i === active ? ' is-current' : ''}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => go(i)}
              >
                <span className="toc-num">{p.number}</span>
                <span className="toc-name">{p.name}</span>
              </button>
            </li>
          ))}
        </ol>

        <p className={`label hint${hinted ? ' is-gone' : ''}`} aria-hidden="true">
          {m.mobile ? 'Swipe to flip' : 'Drag or scroll to flip'}
        </p>

        <div className="pager" onKeyDown={onKeyDown}>
          <button
            type="button"
            className="pager-btn"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="Previous project"
          >
            <span aria-hidden="true">↑</span>
          </button>
          <p className="label pager-count" aria-live="polite" aria-atomic="true">
            <span className="sr-only">Project </span>
            {pad(active + 1)}
            <span className="pager-sep" aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {pad(n)}
            <span className="sr-only">: {current.name}</span>
          </p>
          <button
            type="button"
            className="pager-btn"
            onClick={() => go(active + 1)}
            disabled={active === n - 1}
            aria-label="Next project"
          >
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
