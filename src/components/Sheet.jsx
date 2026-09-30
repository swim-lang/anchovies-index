import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'

/*
 * A SHEET YOU CAN HANDLE
 * The letterhead photographed flat, cropped to its edges and treated as one
 * object on the table:
 *   • move over it  → it tilts slightly toward you and light rakes across the paper
 *   • press & hold  → you pick it up (it lifts, the shadow opens out); drag to turn it
 *   • Loupe         → a magnifier for the small print
 * It has one side only, because only one side was photographed.
 */

const TILT = { rest: 7, held: 20 } // degrees at the sheet's edge
const LOUPE = { size: 190, zoom: 2.6 }

export default function Sheet({ image, caption }) {
  const stageRef = useRef(null)
  const sheetRef = useRef(null)
  const [held, setHeld] = useState(false)
  const [loupe, setLoupe] = useState(false)
  const [lens, setLens] = useState(null) // { x, y } in sheet px
  const hold = useRef(null)
  const reduced = prefersReducedMotion()

  const setTilt = (nx, ny, amount) => {
    const el = sheetRef.current
    if (!el) return
    el.style.setProperty('--ry', `${(nx * amount).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${(-ny * amount).toFixed(2)}deg`)
    // Light comes from the side you tip toward you.
    el.style.setProperty('--lx', `${50 + nx * 45}%`)
    el.style.setProperty('--ly', `${50 + ny * 45}%`)
  }

  const rest = () => {
    setTilt(0, 0, 0)
    setLens(null)
  }

  const onPointerMove = (e) => {
    const r = sheetRef.current.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
    if (!reduced) setTilt(nx, ny, hold.current?.lifted ? TILT.held : TILT.rest)
    if (loupe) {
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      setLens(x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y, w: r.width, h: r.height } : null)
    }
  }

  // Press and hold to pick the sheet up. A quick tap toggles it instead.
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    hold.current = { t: e.timeStamp, lifted: false }
    hold.current.timer = setTimeout(() => {
      if (!hold.current) return
      hold.current.lifted = true
      setHeld(true)
      stageRef.current.setPointerCapture?.(e.pointerId)
    }, 180)
  }
  const onPointerUp = (e) => {
    const h = hold.current
    hold.current = null
    if (!h) return
    clearTimeout(h.timer)
    if (h.lifted) setHeld(false)
    else if (e.timeStamp - h.t < 180) setHeld((v) => !v)
  }

  useEffect(() => () => clearTimeout(hold.current?.timer), [])

  const onKeyDown = (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
    if (k && !reduced) {
      e.preventDefault()
      setTilt(k[0], k[1], held ? TILT.held : TILT.rest)
    }
  }

  return (
    <div className="sheet-block">
      <div
        ref={stageRef}
        className={`sheet-stage${held ? ' is-held' : ''}${loupe ? ' is-loupe' : ''}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => !hold.current?.lifted && rest()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={sheetRef}
          className={`sheet${image.src.endsWith('.webp') || image.src.endsWith('.png') ? ' is-cutout' : ''}`}
          style={{ aspectRatio: `${image.w} / ${image.h}`, '--sheet-src': `url(${image.src})` }}
          role="img"
          aria-label={image.alt}
        >
          <img src={image.src} width={image.w} height={image.h} alt="" draggable={false} loading="lazy" />
          <span className="sheet-light" aria-hidden="true" />
          {loupe && lens && (
            <span
              className="loupe"
              aria-hidden="true"
              style={{
                width: LOUPE.size,
                height: LOUPE.size,
                transform: `translate(${lens.x - LOUPE.size / 2}px, ${lens.y - LOUPE.size / 2}px)`,
                backgroundImage: `url(${image.src})`,
                backgroundSize: `${lens.w * LOUPE.zoom}px ${lens.h * LOUPE.zoom}px`,
                backgroundPosition: `${-(lens.x * LOUPE.zoom - LOUPE.size / 2)}px ${-(lens.y * LOUPE.zoom - LOUPE.size / 2)}px`,
              }}
            />
          )}
        </div>
      </div>

      <div className="stack-bar">
        <p className="stack-caption">
          <span className="label">
            Print<span className="stack-kind"> · Letterhead, photographed</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls" onKeyDown={onKeyDown}>
          <button type="button" className="text-btn label" aria-pressed={held} onClick={() => setHeld((v) => !v)}>
            {held ? 'Put down' : 'Pick up'}
          </button>
          <button
            type="button"
            className="text-btn label"
            aria-pressed={loupe}
            onClick={() => {
              setLoupe((v) => !v)
              setLens(null)
            }}
          >
            Loupe {loupe ? 'on' : 'off'}
          </button>
        </div>
      </div>
    </div>
  )
}
