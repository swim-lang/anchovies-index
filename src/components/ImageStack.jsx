import { useCallback, useEffect, useRef, useState } from 'react'
import Img from './Img.jsx'
import { prefersReducedMotion } from '../motion/timing.js'

/*
 * IMAGE STACK
 * A loose pile of prints. Each print keeps its own aspect ratio and its own small,
 * fixed rotation, the way a photograph sits on a table.
 *   • click the top print, or drag it aside, to send it to the back
 *   • Previous brings the bottom print back to the top
 *   • View larger opens the top print in the lightbox
 * The images are flat mockups, and they are treated as flat prints.
 */

const TILT = [-1.4, 1.1, -0.5, 1.8, -1] // degrees, per print
const OFFSET = { x: 9, y: -11 } // px per step down the pile
const SEND_DISTANCE = 90 // px of drag that commits a send-to-back
const OUT_MS = 260 // the lift-and-slide beat before dropping to the back

export default function ImageStack({ items, onEnlarge }) {
  const n = items.length
  const [order, setOrder] = useState(() => items.map((_, i) => i)) // order[0] is on top
  const [leaving, setLeaving] = useState(null) // { index, dir } during a send
  const [returning, setReturning] = useState(null) // index rising back to the top
  const [dragX, setDragX] = useState(0)
  const [box, setBox] = useState({ w: 600, h: 520 })
  const stageRef = useRef(null)
  const drag = useRef(null)
  const busy = useRef(false)

  // Fit prints inside the stage without cropping.
  useEffect(() => {
    const el = stageRef.current
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const size = (it) => {
    const maxW = box.w * 0.78
    const maxH = box.h * 0.86
    const a = it.w / it.h
    const w = Math.min(maxW, maxH * a)
    return { w, h: w / a }
  }

  const top = order[0]
  const reduced = prefersReducedMotion()

  const next = useCallback(
    (dir = 1) => {
      if (busy.current) return
      busy.current = true
      const i = order[0]
      if (reduced) {
        setOrder((o) => [...o.slice(1), o[0]])
        busy.current = false
        return
      }
      setLeaving({ index: i, dir })
      setTimeout(() => {
        setOrder((o) => [...o.slice(1), o[0]])
        setLeaving(null)
        setDragX(0)
        setTimeout(() => (busy.current = false), 200)
      }, OUT_MS)
    },
    [order, reduced],
  )

  const prev = useCallback(() => {
    if (busy.current) return
    busy.current = true
    const i = order[n - 1]
    if (reduced) {
      setOrder((o) => [o[n - 1], ...o.slice(0, -1)])
      busy.current = false
      return
    }
    // Slide the bottom print out to the side, then lay it on top.
    setReturning({ index: i, phase: 'out' })
    setTimeout(() => {
      setOrder((o) => [o[n - 1], ...o.slice(0, -1)])
      setReturning({ index: i, phase: 'in' })
      setTimeout(() => setReturning(null), 34) // let the 'on top, still aside' frame commit first
      setTimeout(() => (busy.current = false), 420)
    }, OUT_MS)
  }, [order, n, reduced])

  // ── Drag the top print ───────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (busy.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, t0: e.timeStamp }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.moved) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) return (drag.current = null)
      if (Math.abs(dx) < 6) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDragX(dx)
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) return // a plain click is handled by onClick
    e.currentTarget.dataset.dragged = '1'
    const dx = e.clientX - d.x0
    const fast = Math.abs(dx) / Math.max(1, e.timeStamp - d.t0) > 0.6
    if (Math.abs(dx) > SEND_DISTANCE || (fast && Math.abs(dx) > 30)) next(Math.sign(dx) || 1)
    else setDragX(0)
  }
  const onClick = (e) => {
    if (e.currentTarget.dataset.dragged) {
      delete e.currentTarget.dataset.dragged
      return
    }
    next(1)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next(1)
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  // ── Per-print transform ──────────────────────────────────────────────────
  const styleFor = (i) => {
    const depth = order.indexOf(i)
    const s = size(items[i])
    const tilt = TILT[i % TILT.length] * (depth === 0 ? 0.45 : 1)
    let x = depth * OFFSET.x
    let y = depth * OFFSET.y
    let rot = tilt
    let z = n - depth
    let lift = depth === 0 ? 1 : 0
    let transition = undefined

    if (depth === 0 && dragX && !leaving) {
      x += dragX
      rot = tilt + dragX * 0.02
      transition = 'none'
    }
    if (leaving?.index === i) {
      x = leaving.dir * (s.w * 0.98 + 24)
      y = -10
      rot = tilt + leaving.dir * 4
      z = n + 1
    }
    if (returning?.index === i) {
      x = -(s.w * 0.98 + 24)
      y = -10
      rot = tilt - 4
      if (returning.phase === 'in') {
        z = n + 1
        lift = 1
      }
    }
    return {
      width: `${s.w}px`,
      height: `${s.h}px`,
      transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg)`,
      zIndex: z,
      transition,
      '--lift': lift,
      '--depth': depth,
    }
  }

  const current = items[top]

  return (
    <div className="stack" onKeyDown={onKeyDown}>
      <div className="stack-stage" ref={stageRef}>
        {items.map((it, i) => {
          const isTop = i === top && !leaving
          return (
            <div
              key={it.src}
              className={`print${isTop ? ' is-top' : ''}`}
              style={styleFor(i)}
              aria-hidden={i !== top || undefined}
            >
              <Img image={it} eager={i === 0} draggable={false} className="print-img" />
            </div>
          )
        })}
        {/* One accessible control over the top print; the prints themselves are images. */}
        <button
          type="button"
          className="stack-hit"
          style={{
            width: `${size(current).w}px`,
            height: `${size(current).h}px`,
            transform: `translate(-50%, -50%)`,
          }}
          aria-label={`Show next image. Current: ${current.caption}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null
            setDragX(0)
          }}
          onClick={onClick}
        />
      </div>

      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {String(top + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            <span className="stack-kind"> · {current.label}</span>
          </span>
          <span className="stack-text">{current.caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={prev} aria-label="Previous image">
            <span aria-hidden="true">←</span> Prev
          </button>
          <button type="button" className="text-btn label" onClick={() => next(1)} aria-label="Next image">
            Next <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="text-btn label" onClick={() => onEnlarge(current)}>
            View larger <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>
  )
}
