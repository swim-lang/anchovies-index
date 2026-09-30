import { useEffect, useRef, useState } from 'react'
import { sfx } from '../motion/sound.js'

/*
 * THE DESK KIT: things you'd find loose in a studio drawer.
 * A pencil, a black marker and a blue dry-erase marker lie beside a sketch pad.
 * Click one to pick it up (it follows your hand), draw on the pad, click its
 * empty place or press Escape to put it down. Drawn in code, unbranded.
 */

export const TOOLS = {
  pencil: { name: 'Pencil', stroke: { color: '35, 35, 34', alpha: 0.82, width: 1.6, grain: true } },
  marker: { name: 'Black marker', stroke: { color: '20, 20, 20', alpha: 0.96, width: 4.6 } },
  dry: { name: 'Blue dry-erase marker', stroke: { color: '32, 80, 182', alpha: 0.82, width: 8 } },
}

// Tools are drawn lying along x, nib at the right end (x = 200, y = 8).
export function ToolGlyph({ kind, held = false }) {
  if (kind === 'pencil')
    return (
      <svg viewBox="0 0 200 16" className="tool-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-ferrule" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9d9d4" />
            <stop offset=".45" stopColor="#8f8f8a" />
            <stop offset="1" stopColor="#bdbdb7" />
          </linearGradient>
          <linearGradient id="g-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3a37" />
            <stop offset=".35" stopColor="#1d1d1b" />
            <stop offset=".65" stopColor="#262624" />
            <stop offset="1" stopColor="#121211" />
          </linearGradient>
        </defs>
        <rect x="0" y="2.5" width="13" height="11" rx="2.5" fill="#b9b3ab" />
        <rect x="12" y="2" width="12" height="12" fill="url(#g-ferrule)" />
        <path d="M24 2 H168 V14 H24 Z" fill="url(#g-body)" />
        <path d="M168 2 L191 6.6 V9.4 L168 14 Z" fill="#d8bc93" />
        <path d="M186 5.6 L200 8 L186 10.4 Z" fill="#2a2a29" />
      </svg>
    )
  if (kind === 'marker')
    return (
      <svg viewBox="0 0 200 16" className="tool-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-black" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b3b39" />
            <stop offset=".4" stopColor="#141413" />
            <stop offset="1" stopColor="#0a0a0a" />
          </linearGradient>
        </defs>
        <rect x={held ? 34 : 0} y="1" width={held ? 140 : 150} height="14" rx="5" fill="url(#g-black)" />
        <rect x="124" y="1" width="3" height="14" fill="#8a8a86" />
        {held ? (
          <path d="M174 3.5 L190 6.2 L200 8 L190 9.8 L174 12.5 Z" fill="#111" />
        ) : (
          <>
            <rect x="150" y="0" width="46" height="16" rx="6" fill="url(#g-black)" />
            <rect x="152" y="-1" width="30" height="3" rx="1.5" fill="#1a1a19" />
          </>
        )}
      </svg>
    )
  if (kind === 'dry')
    return (
      <svg viewBox="0 0 200 16" className="tool-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".5" stopColor="#e6e5e1" />
            <stop offset="1" stopColor="#c9c8c3" />
          </linearGradient>
          <linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a74cf" />
            <stop offset=".45" stopColor="#2451b1" />
            <stop offset="1" stopColor="#183a86" />
          </linearGradient>
        </defs>
        <rect x={held ? 30 : 0} y="0.5" width={held ? 146 : 152} height="15" rx="6" fill="url(#g-white)" />
        <rect x={held ? 30 : 0} y="0.5" width="9" height="15" rx="4" fill="url(#g-blue)" />
        <rect x="110" y="0.5" width="16" height="15" fill="url(#g-blue)" />
        {held ? (
          <path d="M176 3 L190 5 L200 7 L200 10 L190 11 L176 13 Z" fill="#2451b1" />
        ) : (
          <rect x="150" y="-0.5" width="48" height="17" rx="6" fill="url(#g-blue)" />
        )}
      </svg>
    )
  return null
}

/* (paper clips now live in Props.jsx) */
export function PaperClip() {
  return (
    <svg viewBox="0 0 40 110" className="clip-svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-wire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e4e4e0" />
          <stop offset=".5" stopColor="#8e8e89" />
          <stop offset="1" stopColor="#c7c7c2" />
        </linearGradient>
      </defs>
      <path
        d="M28 30 V86 a10 10 0 0 1 -20 0 V16 a14 14 0 0 1 28 0 V92 a18 18 0 0 1 -36 0"
        transform="translate(2 4)"
        fill="none"
        stroke="url(#g-wire)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/*
 * The sketch pad. It draws only while a tool is in hand.
 * Its bottom-right corner lifts when you hover it; drag the corner away and
 * the top sheet tears off (taking the drawing with it), leaving a clean one.
 */
export function Pad({ w, h, held, onCrumple }) {
  const canvasRef = useRef(null)
  const sheetRef = useRef(null)
  const drawing = useRef(null)
  const peel = useRef(null)
  const [peeking, setPeeking] = useState(false)
  const [tearing, setTearing] = useState(false)

  useEffect(() => {
    const c = canvasRef.current
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const prev = c.width ? c.toDataURL() : null
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    if (prev) {
      const im = new Image()
      im.onload = () => ctx.drawImage(im, 0, 0, w, h)
      im.src = prev
    }
  }, [w, h])

  // Map the pointer into the pad's own coordinates. The pad lies at an angle, and inside the
  // 3D drawer the browser's offsetX/Y aren't reliable, so undo the rotation about its centre.
  const point = (e) => {
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const host = c.closest('.loose')
    const deg = parseFloat(host ? getComputedStyle(host).getPropertyValue('--r') : '0') || 0
    const a = (-deg * Math.PI) / 180
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    return {
      x: w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
      y: h / 2 + dx * Math.sin(a) + dy * Math.cos(a),
      p: e.pressure || 0.5,
    }
  }

  const segment = (a, b) => {
    const tool = TOOLS[held]?.stroke
    if (!tool) return
    sfx(held === 'pencil' ? 'pencil' : 'slide', { throttle: 70 })
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tool.width * (held === 'pencil' ? 0.55 + b.p * 0.9 : 1)
    if (tool.grain) {
      // Graphite catches the tooth of the paper: vary the density along the line.
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2))
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = `rgba(${tool.color}, ${tool.alpha * (0.55 + Math.random() * 0.45)})`
        ctx.beginPath()
        ctx.moveTo(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n)
        ctx.lineTo(a.x + ((b.x - a.x) * (i + 1)) / n, a.y + ((b.y - a.y) * (i + 1)) / n)
        ctx.stroke()
      }
      return
    }
    ctx.strokeStyle = `rgba(${tool.color}, ${tool.alpha})`
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  const onDown = (e) => {
    if (!held) return // no pen in hand: let the pad itself be picked up
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const p = point(e)
    drawing.current = p
    segment(p, { ...p, x: p.x + 0.1 })
  }
  const onMove = (e) => {
    if (!drawing.current) return
    const p = point(e)
    segment(drawing.current, p)
    drawing.current = p
  }
  const onUp = () => (drawing.current = null)

  // ── Tearing off the top sheet ──
  const setSheet = (t) => sheetRef.current && (sheetRef.current.style.transform = t)
  const onCornerDown = (e) => {
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    peel.current = { x0: e.clientX, y0: e.clientY }
    setTearing(true)
  }
  const onCornerMove = (e) => {
    const g = peel.current
    if (!g) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    // The sheet is held at its top edge, so it swings from there as the corner is pulled.
    setSheet(`translate(${dx * 0.6}px, ${Math.max(0, dy) * 0.6}px) rotate(${dx * 0.05 + Math.max(0, dy) * -0.02}deg)`)
    g.dx = dx
    g.dy = dy
    g.x1 = e.clientX
    g.y1 = e.clientY
  }
  const onCornerUp = () => {
    const g = peel.current
    peel.current = null
    if (!g) return
    const el = sheetRef.current
    const far = Math.hypot(g.dx || 0, g.dy || 0) > 70
    if (far) {
      sfx('tear')
      setTimeout(() => sfx('crumple'), 200)
      // Torn off and crumpled: the sheet balls up as it goes, and lands in the drawer.
      el.style.transition = 'transform .42s cubic-bezier(.4,0,.6,1), opacity .42s, border-radius .42s, filter .42s'
      setSheet(`translate(${(g.dx || 60) * 1.4}px, ${(g.dy || 60) * 1.4 + 40}px) rotate(${(g.dx || 60) * 1.8}deg) scale(0.14)`)
      el.style.borderRadius = '42%'
      el.style.filter = 'brightness(0.92) contrast(1.2)'
      el.style.opacity = '0.2'
      const at = { clientX: g.x1 ?? 0, clientY: g.y1 ?? 0 }
      setTimeout(() => {
        onCrumple?.(at)
        const c = canvasRef.current
        c.getContext('2d').clearRect(0, 0, c.width, c.height)
        el.style.transition = 'none'
        setSheet('none')
        el.style.opacity = '1'
        el.style.borderRadius = ''
        el.style.filter = ''
        setTearing(false)
        setPeeking(false)
      }, 430)
    } else {
      el.style.transition = 'transform .35s cubic-bezier(.3,0,.2,1)'
      setSheet('none')
      setTimeout(() => {
        el.style.transition = ''
        setTearing(false)
      }, 360)
    }
  }

  return (
    <>
      <span className="pad-under" aria-hidden="true" />
      <div ref={sheetRef} className={`pad-sheet${peeking || tearing ? ' is-peeling' : ''}`}>
        <canvas
          ref={canvasRef}
          className={`pad-canvas${held ? ' is-live' : ''}`}
          style={{ width: w, height: h }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label={held ? `Sketch pad. Drawing with the ${TOOLS[held].name.toLowerCase()}.` : 'Sketch pad. Pick up a pencil or marker to draw.'}
          role="img"
        />
        <span className="pad-curl" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="pad-corner"
        aria-label="Tear off the top sheet"
        onPointerEnter={() => setPeeking(true)}
        onPointerLeave={() => !peel.current && setPeeking(false)}
        onPointerDown={onCornerDown}
        onPointerMove={onCornerMove}
        onPointerUp={onCornerUp}
        onPointerCancel={onCornerUp}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            peel.current = { x0: 0, y0: 0, dx: 90, dy: 40 }
            setTearing(true)
            onCornerUp()
          }
        }}
      />
    </>
  )
}

/* The tool in your hand: follows the pointer, nib at the cursor. */
export function HeldTool({ kind, length }) {
  const ref = useRef(null)
  useEffect(() => {
    const move = (e) => {
      const el = ref.current
      if (!el) return
      el.style.opacity = '1'
      el.style.transform = `translate(${e.clientX - length}px, ${e.clientY - length * 0.04}px) rotate(135deg)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [length])
  if (!kind) return null
  return (
    <div
      ref={ref}
      className="held-tool"
      style={{ width: length, height: length * 0.08, transformOrigin: `${length}px ${length * 0.04}px` }}
      aria-hidden="true"
    >
      <ToolGlyph kind={kind} held />
    </div>
  )
}
