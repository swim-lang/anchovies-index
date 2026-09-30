import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'

/*
 * A TWO-SIDED PRINTED OBJECT: a business card, or a hang tag on a string.
 * Both sides are the studio's own flat artwork, so turning it over is honest.
 *   • drag sideways → turn it; let go and it settles face-up on the nearer side
 *   • click / Turn over → a clean half turn
 *   • hang: the tag also swings on its string when you push it
 * The light across the surface follows the turn, so the stock reads as stock.
 */

export default function FlipObject({ front, back, hang = false, label, captions }) {
  const objRef = useRef(null)
  const state = useRef({ ry: 0, vy: 0, sway: 0, vs: 0, tilt: 0 })
  const raf = useRef(0)
  const drag = useRef(null)
  const [side, setSide] = useState('front')
  const reduced = prefersReducedMotion()

  const paint = useCallback(() => {
    const s = state.current
    const el = objRef.current
    if (!el) return
    el.style.setProperty('--ry', `${s.ry.toFixed(2)}deg`)
    el.style.setProperty('--sway', `${s.sway.toFixed(2)}deg`)
    el.style.setProperty('--tilt', `${s.tilt.toFixed(2)}deg`)
    // Light: brightest when a face is square to you, a glance of sheen as it turns.
    const a = (((s.ry % 360) + 360) % 360) * (Math.PI / 180)
    el.style.setProperty('--glance', Math.abs(Math.sin(a)).toFixed(3))
    const showingBack = Math.cos(a) < 0
    setSide((prev) => (prev === (showingBack ? 'back' : 'front') ? prev : showingBack ? 'back' : 'front'))
  }, [])

  const settle = useCallback(() => {
    cancelAnimationFrame(raf.current)
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = state.current
      let busy = false
      if (!drag.current) {
        // Turn: a damped spring toward the nearest face.
        const target = Math.round(s.ry / 180) * 180
        const k = 60
        s.vy += (-k * (s.ry - target) - 11 * s.vy) * dt
        s.ry += s.vy * dt
        if (Math.abs(s.ry - target) > 0.05 || Math.abs(s.vy) > 0.05) busy = true
        else (s.ry = target), (s.vy = 0)
        // Tilt eases back to level.
        s.tilt += (0 - s.tilt) * Math.min(1, dt * 8)
        if (Math.abs(s.tilt) > 0.05) busy = true
      }
      if (hang) {
        // A pendulum on the string: under-damped, so it swings and settles.
        s.vs += (-26 * s.sway - 1.6 * s.vs) * dt
        s.sway += s.vs * dt
        if (Math.abs(s.sway) > 0.05 || Math.abs(s.vs) > 0.05) busy = true
        else (s.sway = 0), (s.vs = 0)
      }
      paint()
      if (busy || drag.current) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    // If frames stop, still come to rest square to the viewer.
    setTimeout(() => {
      if (drag.current) return
      const s = state.current
      s.ry = Math.round(s.ry / 180) * 180
      s.vy = s.vs = s.sway = s.tilt = 0
      paint()
    }, 2600)
  }, [hang, paint])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const turn = (dir = 1) => {
    const s = state.current
    if (reduced) {
      s.ry = Math.round(s.ry / 180) * 180 + 180 * dir
      paint()
      return
    }
    s.vy += 900 * dir // a flick of the wrist
    if (hang) s.vs += 60 * dir
    settle()
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { x0: e.clientX, y0: e.clientY, ry0: state.current.ry, lastX: e.clientX, t: e.timeStamp, moved: false, v: 0 }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < 4) return
      d.moved = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      settle()
    }
    const s = state.current
    const w = objRef.current.getBoundingClientRect().width || 300
    s.ry = d.ry0 + (dx / w) * 180
    s.tilt = Math.max(-10, Math.min(10, (e.clientY - d.y0) * -0.05))
    const dt = Math.max(1, e.timeStamp - d.t)
    d.v = ((e.clientX - d.lastX) / w) * 180 * (1000 / dt)
    if (hang) s.vs += (e.clientX - d.lastX) * 0.9
    d.lastX = e.clientX
    d.t = e.timeStamp
    paint()
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) return turn(1)
    state.current.vy = Math.max(-1400, Math.min(1400, d.v * 0.6))
    settle()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') (e.preventDefault(), turn(-1))
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') (e.preventDefault(), turn(1))
  }

  const current = side === 'front' ? front : back

  return (
    <div className={`flip-block${hang ? ' is-hang' : ''}`}>
      <div className="flip-stage">
        {hang && <span className="flip-string" aria-hidden="true" />}
        <div
          ref={objRef}
          className="flip-object"
          style={{ aspectRatio: `${front.w} / ${front.h}` }}
          role="button"
          tabIndex={0}
          aria-label={`${label}, ${side} showing. Press to turn over.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <div className="flip-turn">
            <div className="flip-face">
              <img src={front.src} width={front.w} height={front.h} alt={front.alt} draggable={false} />
              <span className="flip-light" aria-hidden="true" />
              {hang && <span className="flip-hole" aria-hidden="true" />}
            </div>
            <div className="flip-face is-back">
              <img src={back.src} width={back.w} height={back.h} alt={back.alt} draggable={false} />
              <span className="flip-light" aria-hidden="true" />
              {hang && <span className="flip-hole" aria-hidden="true" />}
            </div>
          </div>
        </div>
      </div>

      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {side === 'front' ? 'Front' : 'Back'}
            <span className="stack-kind"> · {label}</span>
          </span>
          <span className="stack-text">{captions?.[side] ?? current.alt}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => turn(1)}>
            Turn over <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>
    </div>
  )
}
