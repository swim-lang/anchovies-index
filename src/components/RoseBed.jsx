import { useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'

/*
 * KEEP GROWING (Tagawa Gardens)
 * Tagawa's roots are in roses, and its motto is "Keep Growing". Click the bed
 * to plant: a stem rises, leaves unfurl, a flower opens — a rose, tulip, daisy,
 * poppy, lavender, coneflower or bellflower, whatever comes up. Drawn in the brand's
 * deep green on cream, in a single-weight line to sit beside the gardener, who
 * stands at the end of the bed exactly as supplied.
 */

const GREEN = '#224526' // from the supplied gardener SVG
const CREAM = '#f3efe3'
const VB = { w: 1000, h: 440 }
const GROUND = 392
const rand = (a, b) => a + Math.random() * (b - a)
const W = 6 // line weight
const KINDS = ['rose', 'tulip', 'daisy', 'poppy', 'lavender', 'coneflower', 'bell']

function makeRose(x, kind = KINDS[Math.floor(Math.random() * KINDS.length)]) {
  const h = rand(150, 290)
  const lean = rand(-26, 26)
  const top = { x: x + lean, y: GROUND - h }
  const c1 = { x: x + rand(-30, 30), y: GROUND - h * 0.35 }
  const c2 = { x: top.x - lean * 0.5 + rand(-20, 20), y: GROUND - h * 0.75 }
  const stem = `M${x} ${GROUND} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${top.x} ${top.y + 14}`
  // Leaves along the stem, alternating sides.
  const leaves = [0.34, 0.56, 0.72].slice(0, h > 220 ? 3 : 2).map((t, i) => {
    const y = GROUND - h * t
    const xx = x + (top.x - x) * t
    const side = i % 2 ? 1 : -1
    return { x: xx, y, side, a: rand(20, 40) * side }
  })
  return { id: Math.random().toString(36).slice(2), kind, x, top, stem, leaves, size: rand(0.85, 1.25), sway: rand(3, 6), delay: rand(0, 2) }
}

const line = { fill: CREAM, stroke: GREEN, strokeWidth: W, strokeLinejoin: 'round', strokeLinecap: 'round' }
const open = { ...line, fill: 'none' }

// Each flower is drawn around (0, 0), where the stem ends.
function Head({ kind }) {
  switch (kind) {
    case 'tulip':
      return (
        <>
          <path {...line} d="M-19 0 C -24 -24 -14 -40 -10 -44 L 0 -30 L 10 -44 C 14 -40 24 -24 19 0 C 10 10 -10 10 -19 0 Z" />
          <path {...open} d="M0 -30 C -5 -16 -5 -4 0 6" />
        </>
      )
    case 'daisy':
      return (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} {...line} cx="0" cy="-21" rx="6.5" ry="13" transform={`rotate(${i * 36})`} />
          ))}
          <circle cx="0" cy="0" r="9" fill={GREEN} />
        </>
      )
    case 'poppy':
      return (
        <>
          {[[-12, -12], [12, -12], [12, 10], [-12, 10]].map(([x, y], i) => (
            <circle key={i} {...line} cx={x} cy={y} r="15" />
          ))}
          <circle cx="0" cy="-1" r="7" fill={GREEN} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} {...open} strokeWidth={W * 0.55} d="M0 -1 L 0 -13" transform={`rotate(${a} 0 -1)`} />
          ))}
        </>
      )
    case 'lavender':
      return (
        <>
          {Array.from({ length: 7 }, (_, j) => (
            <ellipse key={j} {...line} strokeWidth={W * 0.8} cx={j % 2 ? 5 : -5} cy={6 - j * 10} rx="6" ry="8" />
          ))}
        </>
      )
    case 'coneflower':
      return (
        <>
          {[-70, -40, -12, 12, 40, 70].map((a) => (
            <path key={a} {...line} d="M0 2 C -7 14 -6 30 0 36 C 6 30 7 14 0 2 Z" transform={`rotate(${a})`} />
          ))}
          <path d="M-14 4 C -14 -16 14 -16 14 4 Z" fill={GREEN} stroke={GREEN} strokeWidth={W} strokeLinejoin="round" />
        </>
      )
    case 'bell':
      return (
        <>
          <path {...line} d="M0 -4 C -10 -4 -16 8 -16 24 L -10 20 L -5 27 L 0 21 L 5 27 L 10 20 L 16 24 C 16 8 10 -4 0 -4 Z" />
          <path {...open} d="M0 21 L 0 32" strokeWidth={W * 0.7} />
        </>
      )
    default: // rose
      return (
        <>
          <path {...open} d="M-4 20 C -12 27 -20 26 -24 19 M4 20 C 12 27 20 26 24 19" />
          <path {...line} d="M-24 -10 C -30 6 -18 20 0 22 C 18 20 30 6 24 -10 C 16 -2 -16 -2 -24 -10 Z" />
          <path {...open} d="M-24 -10 C -33 -21 -24 -33 -13 -27" />
          <path {...open} d="M24 -10 C 33 -21 24 -33 13 -27" />
          <path {...line} d="M-16 -8 C -20 -31 20 -31 16 -8 C 8 -2 -8 -2 -16 -8 Z" />
          <path {...open} d="M-7 -16 C -3 -25 9 -21 5 -13 C 1 -8 -6 -11 -2 -16" />
        </>
      )
  }
}

function Rose({ r, fresh }) {
  const s = r.size
  return (
    <g className={`rose${fresh ? ' is-new' : ''}`} style={{ transformOrigin: `${r.x}px ${GROUND}px`, animationDelay: `${r.delay}s`, '--sway': `${r.sway}deg` }}>
      <path className="rose-stem" d={r.stem} fill="none" stroke={GREEN} strokeWidth={W + 1} strokeLinecap="round" pathLength="1" />
      {r.leaves.map((l, i) => (
        <g key={i} className="rose-leaf" style={{ transformOrigin: `${l.x}px ${l.y}px`, animationDelay: `${0.35 + i * 0.12}s` }}>
          <path
            d={`M${l.x} ${l.y} C ${l.x + 18 * l.side} ${l.y - 22} ${l.x + 48 * l.side} ${l.y - 18} ${l.x + 58 * l.side} ${l.y - 4} C ${l.x + 44 * l.side} ${l.y + 10} ${l.x + 18 * l.side} ${l.y + 8} ${l.x} ${l.y} Z`}
            fill={CREAM}
            stroke={GREEN}
            strokeWidth={W}
            strokeLinejoin="round"
          />
          <path d={`M${l.x + 6 * l.side} ${l.y - 1} C ${l.x + 24 * l.side} ${l.y - 8} ${l.x + 40 * l.side} ${l.y - 8} ${l.x + 52 * l.side} ${l.y - 4}`} fill="none" stroke={GREEN} strokeWidth={W * 0.55} strokeLinecap="round" />
        </g>
      ))}
      <g transform={`translate(${r.top.x} ${r.top.y})`}>
        <g className="rose-head" transform={`scale(${s})`} style={{ transformOrigin: '0px 0px' }}>
          <Head kind={r.kind} />
        </g>
      </g>
    </g>
  )
}

export default function RoseBed({ gardener }) {
  const [roses, setRoses] = useState(() => [makeRose(420, 'rose'), makeRose(560)])
  const [newest, setNewest] = useState(null)
  const svgRef = useRef(null)
  const reduced = prefersReducedMotion()

  const plant = (x) => {
    const r = makeRose(Math.max(250, Math.min(VB.w - 40, x)))
    sfx('plant')
    setRoses((list) => [...list.slice(-24), r])
    setNewest(r.id)
  }

  const onClick = (e) => {
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
    plant(p.x)
  }

  return (
    <div className="rose-block">
      <svg
        ref={svgRef}
        className={`rose-bed${reduced ? ' is-still' : ''}`}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`A flower bed with ${roses.length} flowers. Click to plant another.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            plant(rand(280, 960))
          }
        }}
      >
        <rect width={VB.w} height={VB.h} fill={CREAM} />
        {/* The gardener, as supplied */}
        <image href={gardener.src} x="30" y={GROUND - 350} height="350" width={(350 * 3000) / 5528} preserveAspectRatio="xMinYMax meet" />
        {roses.map((r) => (
          <Rose key={r.id} r={r} fresh={r.id === newest && !reduced} />
        ))}
        {/* Soil */}
        <path d={`M0 ${GROUND} H${VB.w}`} stroke={GREEN} strokeWidth={W + 1} />
        {Array.from({ length: 30 }, (_, i) => (
          <path key={i} d={`M${230 + i * 26} ${GROUND + 14 + (i % 3) * 6} h${10 + (i % 4) * 3}`} stroke={GREEN} strokeWidth="3" strokeLinecap="round" opacity=".55" />
        ))}
      </svg>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {roses.length} {roses.length === 1 ? 'flower' : 'flowers'}<span className="stack-kind"> · click the bed to plant one</span>
          </span>
          <span className="stack-text">Keep Growing.</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => plant(rand(280, 960))}>
            Plant a flower
          </button>
          <button
            type="button"
            className="text-btn label"
            onClick={() => {
              setRoses([])
              setNewest(null)
            }}
            disabled={!roses.length}
          >
            Clear the bed
          </button>
        </div>
      </div>
    </div>
  )
}
