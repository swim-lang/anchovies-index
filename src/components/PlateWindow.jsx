import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'

/*
 * DRILL THE PLATE (Arc88)
 * Arc88's symbol comes from perforated steel plates used in machining. The
 * plates start solid, with a centre-punch mark where each hole will go. Click to
 * drill them one by one; each finished hole opens onto one of the studio's own
 * photographs. With all four drilled, move and the view shifts behind the holes.
 * The holes are the symbol's own shapes, taken from the supplied SVG.
 */

const VB = { w: 3000, h: 2840.622 }
const DRILL_MS = 900

// Split a path into its subpaths; the first is the plate, the rest are its holes.
function subpaths(d) {
  return d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// A rough centre and radius from the subpath's coordinates (good enough for a punch mark).
function centreOf(sub) {
  const nums = (sub.match(/-?\d*\.?\d+/g) || []).map(Number)
  // Coordinates in these paths are mostly relative; walk them for an absolute bounding box.
  let x = nums[0]
  let y = nums[1]
  let minX = x
  let maxX = x
  let minY = y
  let maxY = y
  const tokens = sub.match(/[a-zA-Z]|-?\d*\.?\d+/g) || []
  let cmd = 'M'
  let buf = []
  const flush = () => {
    const rel = cmd === cmd.toLowerCase()
    const pairs = cmd.toLowerCase() === 'c' ? 6 : cmd.toLowerCase() === 's' || cmd.toLowerCase() === 'q' ? 4 : 2
    while (buf.length >= pairs) {
      const seg = buf.splice(0, pairs)
      const ex = seg[pairs - 2]
      const ey = seg[pairs - 1]
      x = rel ? x + ex : ex
      y = rel ? y + ey : ey
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    buf = []
  }
  tokens.slice(3).forEach((t) => {
    if (/[a-zA-Z]/.test(t)) {
      flush()
      cmd = t
    } else buf.push(Number(t))
  })
  flush()
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, r: Math.max(maxX - minX, maxY - minY) / 2 }
}

export default function PlateWindow({ mark, behind, caption }) {
  const [plates, setPlates] = useState(null) // [{ plate, holes: [{ d, c }] }]
  const [drilled, setDrilled] = useState({})
  const [drilling, setDrilling] = useState(null)
  const [shift, setShift] = useState({ x: 0, y: 0 })
  const wrap = useRef(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    let alive = true
    fetch(mark.src)
      .then((r) => r.text())
      .then((svg) => {
        if (!alive) return
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        const ps = [...doc.querySelectorAll('path')].map((p) => {
          const subs = subpaths(p.getAttribute('d'))
          return { plate: subs[0], holes: subs.slice(1).map((d) => ({ d, c: centreOf(d) })) }
        })
        setPlates(ps)
      })
    return () => {
      alive = false
    }
  }, [mark.src])

  const holes = plates ? plates.flatMap((p, pi) => p.holes.map((h, hi) => ({ ...h, key: `${pi}-${hi}` }))) : []
  const done = holes.length > 0 && holes.every((h) => drilled[h.key])

  const drill = (key) => {
    if (drilling || drilled[key]) return
    sfx('drill')
    if (reduced) return setDrilled((d) => ({ ...d, [key]: true }))
    setDrilling(key)
    setTimeout(() => {
      setDrilled((d) => ({ ...d, [key]: true }))
      setDrilling(null)
    }, DRILL_MS)
  }
  const drillNext = () => {
    const next = holes.find((h) => !drilled[h.key])
    if (next) drill(next.key)
  }

  // Click drills the hole nearest the pointer.
  const onClick = (e) => {
    if (!plates) return
    const svg = e.currentTarget.querySelector('svg')
    const r = svg.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * VB.w
    const py = ((e.clientY - r.top) / r.height) * VB.h
    const open = holes.filter((h) => !drilled[h.key])
    if (!open.length) return
    const nearest = open.reduce((a, b) => (Math.hypot(a.c.x - px, a.c.y - py) < Math.hypot(b.c.x - px, b.c.y - py) ? a : b))
    drill(nearest.key)
  }

  const onMove = (e) => {
    if (reduced || !done) return
    const r = wrap.current.getBoundingClientRect()
    setShift({ x: -(((e.clientX - r.left) / r.width) * 2 - 1) * 220, y: -(((e.clientY - r.top) / r.height) * 2 - 1) * 260 })
  }

  const ph = { w: VB.w * 1.3, h: (VB.w * 1.3 * behind.h) / behind.w }
  const left = holes.filter((h) => !drilled[h.key]).length

  return (
    <div className="plate-block">
      <div
        ref={wrap}
        className={`plate-stage${done ? ' is-done' : ''}`}
        onClick={onClick}
        onPointerMove={onMove}
        onPointerLeave={() => setShift({ x: 0, y: 0 })}
        role="button"
        tabIndex={0}
        aria-label={done ? mark.alt : `Steel plates. ${left} holes left to drill. Press to drill the next.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            drillNext()
          }
        }}
      >
        {plates ? (
          <svg className="plate-svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
            <defs>
              <linearGradient id="plate-steel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2c2d2c" />
                <stop offset=".5" stopColor="#111" />
                <stop offset="1" stopColor="#050505" />
              </linearGradient>
              <clipPath id="plate-outline">
                {plates.map((p, i) => (
                  <path key={i} d={p.plate} />
                ))}
              </clipPath>
              <mask id="plate-holes" maskUnits="userSpaceOnUse">
                <rect width={VB.w} height={VB.h} fill="#fff" />
                {holes.map((h) =>
                  drilled[h.key] || drilling === h.key ? (
                    <path
                      key={h.key}
                      d={h.d}
                      fill="#000"
                      className={drilling === h.key ? 'hole-opening' : ''}
                      style={{ transformBox: 'view-box', transformOrigin: `${h.c.x}px ${h.c.y}px`, animationDuration: `${DRILL_MS}ms` }}
                    />
                  ) : null,
                )}
              </mask>
            </defs>
            {/* What's behind the plate: only ever seen through it */}
            <image
              clipPath="url(#plate-outline)"
              href={behind.src}
              x={(VB.w - ph.w) / 2 + shift.x}
              y={(VB.h - ph.h) / 2 + shift.y}
              width={ph.w}
              height={ph.h}
              preserveAspectRatio="xMidYMid slice"
              className="plate-behind"
            />
            {/* The plates, black, with drilled holes cut out */}
            <g mask="url(#plate-holes)">
              {plates.map((p, i) => (
                <path key={i} d={p.plate} fill="#000" />
              ))}
            </g>
            {/* Centre-punch marks on holes still to drill */}
            {holes
              .filter((h) => !drilled[h.key] && drilling !== h.key)
              .map((h) => (
                <g key={h.key} opacity=".55">
                  <circle cx={h.c.x} cy={h.c.y} r="26" fill="#2b2b2a" />
                  <path d={`M${h.c.x - 60} ${h.c.y} h120 M${h.c.x} ${h.c.y - 60} v120`} stroke="#3a3a39" strokeWidth="8" />
                </g>
              ))}
            {/* The bit, spinning, and swarf flying from it */}
            {drilling &&
              (() => {
                const h = holes.find((x) => x.key === drilling)
                return (
                  <g className="drill-bit" style={{ transformBox: 'view-box', transformOrigin: `${h.c.x}px ${h.c.y}px`, animationDuration: `${DRILL_MS}ms` }}>
                    <circle cx={h.c.x} cy={h.c.y} r="110" fill="url(#pg-steel)" opacity=".9" />
                    <path d={`M${h.c.x} ${h.c.y} m-100 0 a100 100 0 0 1 200 0 M${h.c.x} ${h.c.y} m0 -100 a100 100 0 0 1 0 200`} stroke="#6f706c" strokeWidth="14" fill="none" />
                    {Array.from({ length: 7 }, (_, i) => (
                      <path
                        key={i}
                        className="swarf"
                        d={`M${h.c.x} ${h.c.y} q 40 -30 80 0 t 80 -10`}
                        stroke="#d6d6d2"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        style={{ transformBox: 'view-box', transformOrigin: `${h.c.x}px ${h.c.y}px`, transform: `rotate(${i * 51}deg)`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </g>
                )
              })()}
          </svg>
        ) : (
          <img className="plate-svg" src={mark.src} alt={mark.alt} />
        )}
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            Symbol<span className="stack-kind"> · {done ? 'move to look through' : `${left} of ${holes.length || 4} holes to drill · click the plate`}</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={drillNext} disabled={done || !!drilling}>
            Drill
          </button>
          <button type="button" className="text-btn label" onClick={() => setDrilled({})} disabled={!Object.keys(drilled).length}>
            New plates
          </button>
        </div>
      </div>
    </div>
  )
}
