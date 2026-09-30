import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * CLOSE LOOKING
 * The painting, supplied at full resolution (3300 × 4200). It opens fitted to
 * the frame; zoom in until one image pixel is one screen pixel and drag to walk
 * across it. The overview in the corner shows where you are.
 *   drag = pan · wheel / pinch / + − = zoom · double-click = zoom to that spot
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// The Charro border, stitched round the painting a few stitches at a time.
function StitchedBorder({ src, drawn }) {
  const [svg, setSvg] = useState(null)
  useEffect(() => {
    let alive = true
    fetch(src)
      .then((r) => r.text())
      .then((t) => {
        if (!alive) return
        const doc = new DOMParser().parseFromString(t, 'image/svg+xml')
        const vb = doc.documentElement.getAttribute('viewBox')
        const rects = [...doc.querySelectorAll('rect')].map((r) => ({
          x: r.getAttribute('x'),
          y: r.getAttribute('y'),
          w: r.getAttribute('width'),
          h: r.getAttribute('height'),
          t: r.getAttribute('transform'),
        }))
        setSvg({ vb, rects })
      })
    return () => {
      alive = false
    }
  }, [src])
  if (!svg) return null
  const n = svg.rects.length
  return (
    <svg className={`charro${drawn ? ' is-drawn' : ''}`} viewBox={svg.vb} preserveAspectRatio="none" aria-hidden="true">
      {svg.rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} transform={r.t || undefined} fill="#d23737" style={{ transitionDelay: `${(i / n) * 2.4}s` }} />
      ))}
    </svg>
  )
}

export default function PaintingViewer({ full, preview, caption, border }) {
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const [box, setBox] = useState({ w: 800, h: 600 })
  const view = useRef({ s: 0, x: 0, y: 0 }) // scale (screen px per image px), offset of image top-left
  const [, force] = useState(0)
  const [hiRes, setHiRes] = useState(false)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const [lantern, setLantern] = useState(false)
  const [drawn, setDrawn] = useState(false)

  // Stitch the border once the painting scrolls into view.
  useEffect(() => {
    const el = frameRef.current
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setDrawn(true), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const fit = useCallback((w, h) => Math.min(w / full.w, h / full.h), [full])
  const maxS = () => Math.max(1, fit(box.w, box.h) * 1.01) // up to 100% of the original

  const place = useCallback(
    (s, x, y, w = box.w, h = box.h) => {
      const iw = full.w * s
      const ih = full.h * s
      // Keep the painting in the frame: centred when smaller, edges held when larger.
      x = iw <= w ? (w - iw) / 2 : clamp(x, w - iw, 0)
      y = ih <= h ? (h - ih) / 2 : clamp(y, h - ih, 0)
      view.current = { s, x, y }
      const el = imgRef.current
      if (el) el.style.transform = `translate(${x}px, ${y}px) scale(${s})`
      force((n) => n + 1)
    },
    [box, full],
  )

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect
      setBox({ w, h })
      // Re-fit only if you're looking at the whole painting; otherwise keep your place.
      const v = view.current
      const zoomed = v.s > 0 && v.s > fit(w, h) * 1.01
      if (zoomed) place(v.s, v.x, v.y, w, h)
      else place(fit(w, h), 0, 0, w, h)
    })
    ro.observe(frameRef.current)
    return () => ro.disconnect()
  }, [fit, place])

  const zoomAt = (factor, cx, cy) => {
    const v = view.current
    const s = clamp(v.s * factor, fit(box.w, box.h), maxS())
    const k = s / v.s
    place(s, cx - (cx - v.x) * k, cy - (cy - v.y) * k)
    if (s > fit(box.w, box.h) * 1.4) setHiRes(true) // fetch the full file only when you look closely
  }

  // Wheel zoom (and trackpad pinch, which arrives as ctrl+wheel).
  useEffect(() => {
    const el = frameRef.current
    const onWheel = (e) => {
      const r = el.getBoundingClientRect()
      const zooming = e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)
      if (!zooming) return
      // Only take the wheel once you're looking closely, or asking to zoom; otherwise let the page scroll.
      const fitted = view.current.s <= fit(box.w, box.h) * 1.001
      if (fitted && e.deltaY > 0 && !e.ctrlKey) return
      e.preventDefault()
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const v = view.current
    if (pointers.current.size === 1) gesture.current = { type: 'pan', x0: e.clientX, y0: e.clientY, vx: v.x, vy: v.y }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: v.s }
    }
  }
  const onPointerMove = (e) => {
    if (lantern) {
      const r = frameRef.current.getBoundingClientRect()
      frameRef.current.style.setProperty('--lx', `${e.clientX - r.left}px`)
      frameRef.current.style.setProperty('--ly', `${e.clientY - r.top}px`)
    }
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const v = view.current
    if (g.type === 'pan') place(v.s, g.vx + e.clientX - g.x0, g.vy + e.clientY - g.y0)
    if (g.type === 'pinch' && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const r = frameRef.current.getBoundingClientRect()
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      zoomAt((g.s0 * (d / g.d0)) / v.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
    }
  }
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId)
    gesture.current = null
  }
  const onDoubleClick = (e) => {
    const r = frameRef.current.getBoundingClientRect()
    const atFit = view.current.s <= fit(box.w, box.h) * 1.01
    if (atFit) zoomAt(maxS() / view.current.s, e.clientX - r.left, e.clientY - r.top)
    else place(fit(box.w, box.h), 0, 0)
  }
  const onKeyDown = (e) => {
    const v = view.current
    const c = [box.w / 2, box.h / 2]
    const step = 60
    const k = {
      '+': () => zoomAt(1.4, ...c),
      '=': () => zoomAt(1.4, ...c),
      '-': () => zoomAt(1 / 1.4, ...c),
      ArrowLeft: () => place(v.s, v.x + step, v.y),
      ArrowRight: () => place(v.s, v.x - step, v.y),
      ArrowUp: () => place(v.s, v.x, v.y + step),
      ArrowDown: () => place(v.s, v.x, v.y - step),
      '0': () => place(fit(box.w, box.h), 0, 0),
    }[e.key]
    if (k) (e.preventDefault(), k())
  }

  const v = view.current
  const fitted = v.s <= fit(box.w, box.h) * 1.001
  const pct = Math.round(v.s * 100)
  // Overview rectangle, as fractions of the painting.
  const vis = {
    l: clamp(-v.x / (full.w * v.s), 0, 1),
    t: clamp(-v.y / (full.h * v.s), 0, 1),
    w: clamp(box.w / (full.w * v.s), 0, 1),
    h: clamp(box.h / (full.h * v.s), 0, 1),
  }

  return (
    <div className="painting-block">
      <div
        ref={frameRef}
        className={`painting-frame${fitted ? ' is-fitted' : ''}${lantern ? ' is-lantern' : ''}`}
        tabIndex={0}
        role="img"
        aria-label={`${full.alt}. Zoom with plus and minus, move with the arrow keys.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      >
        <img
          ref={imgRef}
          className="painting-img"
          src={hiRes ? full.src : preview.src}
          width={full.w}
          height={full.h}
          alt=""
          draggable={false}
          style={{ width: full.w, height: full.h }}
        />
        {border && (
          <div
            className="charro-wrap"
            style={{ transform: `translate(${v.x}px, ${v.y}px)`, width: full.w * v.s, height: full.h * v.s }}
          >
            <StitchedBorder src={border} drawn={drawn} />
          </div>
        )}
        {lantern && <div className="lantern" aria-hidden="true" />}
        {!fitted && (
          <div className="painting-map" aria-hidden="true">
            <img src={preview.src} alt="" draggable={false} />
            <span
              style={{
                left: `${vis.l * 100}%`,
                top: `${vis.t * 100}%`,
                width: `${vis.w * 100}%`,
                height: `${vis.h * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="stack-bar">
        <p className="stack-caption">
          <span className="label">
            {pct}%<span className="stack-kind"> · {fitted ? 'double-click or scroll to look closer' : 'drag to move'}</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => zoomAt(1 / 1.5, box.w / 2, box.h / 2)} disabled={fitted}>
            − Out
          </button>
          <button type="button" className="text-btn label" onClick={() => zoomAt(1.5, box.w / 2, box.h / 2)} disabled={v.s >= maxS() * 0.999}>
            + In
          </button>
          <button type="button" className="text-btn label" onClick={() => place(fit(box.w, box.h), 0, 0)} disabled={fitted}>
            Whole painting
          </button>
          <button type="button" className="text-btn label" aria-pressed={lantern} onClick={() => setLantern((l) => !l)}>
            Lantern {lantern ? 'off' : 'on'}
          </button>
        </div>
      </div>
    </div>
  )
}
