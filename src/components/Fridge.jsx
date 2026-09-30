import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { magnets, workOrder } from '../content/magnets.js'
import { fridgeContents, wordmarkOf, wordmarkGround } from '../content/fridgeContents.js'
import { prefersReducedMotion } from '../motion/timing.js'
import '../styles/fridge-inside.css'
import { sfx } from '../motion/sound.js'
import { cssUrl } from '../lib/cssUrl.js'

/*
 * THE FRIDGE
 * Every client mark from anchovies.agency/work, as a die-cut fridge magnet at
 * real magnet size against a real-size fridge.
 *   • it opens close in on the top of the fridge, where the magnets are
 *   • scroll or pinch to zoom, drag the fridge to look around, "Whole fridge" to see it all
 *   • slide magnets around; click one to open its case study
 *     (here if it has one, otherwise on anchovies.agency)
 *   • click a door (or its handle) and it swings open; click the open door to shut it,
 *     magnets and all, onto a lit interior stocked with client-branded groceries
 */

const FW = 920 // the fridge, in px at 1:1
const FH = 1840
const FREEZER = 0.3 // share of the height
const HANDLE = 84 // the handle strip on the left, kept clear of magnets
const AREA = 3000 // each magnet's area, px² at 1:1 (≈ 4 cm across on a 70 cm fridge)

// The body's geometry (matches .fridge in styles.css: 8px padding, 8px gaps, a 54px grille).
const PAD = 8
const GAP = 8
const GRILLE = 54
const FREEZER_H = FH * FREEZER
const DOOR_Y = PAD + FREEZER_H + GAP // top of the fridge door
const DOOR_H = FH - 2 * PAD - FREEZER_H - GRILLE - 2 * GAP
const DOORS = {
  freezer: { y: PAD, h: FREEZER_H },
  fridge: { y: DOOR_Y, h: DOOR_H },
}
const OPEN_DEG = 100 // how far a door swings
const TURN = 28 // items in the door bins turn back toward the viewer by this much once it's open

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const byId = Object.fromEntries(magnets.map((m) => [m.id, m]))

// Size every magnet to a similar area, like a set of die-cut magnets.
function sizeOf(mg) {
  const s = Math.sqrt(AREA / (mg.w * mg.h))
  let w = mg.w * s
  let h = mg.h * s
  const cap = mg.w / mg.h > 4 ? 150 : 96 // long wordmarks may run a little wider
  const k = Math.min(1, cap / w, 96 / h)
  w *= k
  h *= k
  return { w: Math.round(w), h: Math.round(h), pad: 0 }
}

/*
 * Newest at the top, oldest at the bottom: each magnet's rank (its place on the
 * work page, with unfinished case studies pushed further down) sets its order
 * down the doors.
 */
function rankOf() {
  const pos = Object.fromEntries(workOrder.map((id, i) => [id, i]))
  const score = (m) => (pos[m.id] ?? workOrder.length) + (m.url || m.project ? 0 : 30)
  const ranked = [...magnets].sort((a, b) => score(a) - score(b))
  return Object.fromEntries(ranked.map((m, i) => [m.id, i / (ranked.length - 1)]))
}

// Which door a point on the front belongs to.
const doorAt = (y) => (y < DOOR_Y - GAP / 2 ? 'freezer' : 'fridge')

// The area of each door a magnet may sit in (clear of the handle and the edges).
const MX0 = HANDLE
const MX1 = FW - PAD - 18
const regionOf = (door) => (door === 'freezer' ? { y0: PAD + 26, y1: PAD + FREEZER_H - 22 } : { y0: DOOR_Y + 26, y1: DOOR_Y + DOOR_H - 26 })

// Keep a magnet wholly on one door.
function settle(p) {
  const door = doorAt(p.y)
  const r = regionOf(door)
  return { ...p, door, x: clamp(p.x, MX0 + p.w / 2, MX1 - p.w / 2), y: clamp(p.y, r.y0 + p.h / 2, r.y1 - p.h / 2) }
}

/*
 * An even cover over both doors: a grid sized so there's a cell per magnet,
 * walked top to bottom in rank order, each magnet jittered inside its cell and
 * given a little tilt. A few rounds of nudging then part any that still touch.
 */
function layout() {
  const rank = rankOf()
  const order = [...magnets].sort((a, b) => rank[a.id] - rank[b.id])
  const n = order.length
  const W = MX1 - MX0
  const regs = ['freezer', 'fridge'].map((door) => ({ door, ...regionOf(door) }))
  const s = Math.sqrt((W * regs.reduce((t, r) => t + r.y1 - r.y0, 0)) / n)
  const cols = Math.max(1, Math.round(W / s))
  const cw = W / cols
  for (const r of regs) r.rows = Math.max(1, Math.round((r.y1 - r.y0) / cw))
  const count = () => cols * regs.reduce((t, r) => t + r.rows, 0)
  while (count() < n) {
    const r = regs.reduce((a, b) => ((a.y1 - a.y0) / a.rows >= (b.y1 - b.y0) / b.rows ? a : b))
    r.rows += 1
  }

  // Cells, row by row; within a row the order is shuffled so the newest aren't always on the left.
  let cells = []
  for (const r of regs) {
    const ch = (r.y1 - r.y0) / r.rows
    for (let row = 0; row < r.rows; row++) {
      const line = []
      const shift = (row % 2 ? 0.22 : -0.22) * cw // a slight brick offset breaks up the columns
      for (let c = 0; c < cols; c++) line.push({ door: r.door, cx: MX0 + cw * (c + 0.5) + shift, cy: r.y0 + ch * (row + 0.5), cw, ch })
      line.sort(() => Math.random() - 0.5)
      cells.push(...line)
    }
  }
  // Spare cells are left empty at even intervals, so no patch goes bare.
  const spare = cells.length - n
  if (spare > 0) {
    const drop = new Set()
    for (let k = 0; k < spare; k++) drop.add(Math.min(cells.length - 1, Math.floor((k + rand(0.2, 0.8)) * (cells.length / spare))))
    cells = cells.filter((_, i) => !drop.has(i)).slice(0, n)
    while (cells.length < n) cells.push(cells[cells.length - 1])
  }

  const out = order.map((mg, i) => {
    const sz = sizeOf(mg)
    const c = cells[i]
    const r = regionOf(c.door)
    const fx = Math.max(0, (c.cw - sz.w - 14) / 2)
    const fy = Math.max(0, (c.ch - sz.h - 14) / 2)
    return {
      id: mg.id,
      door: c.door,
      x: clamp(c.cx + rand(-1, 1) * fx, MX0 + sz.w / 2, MX1 - sz.w / 2),
      y: clamp(c.cy + rand(-1, 1) * fy, r.y0 + sz.h / 2, r.y1 - sz.h / 2),
      r: rand(-7, 7),
      z: i + 1,
      ...sz,
    }
  })

  // Part anything still overlapping (wide wordmarks can outgrow a cell).
  const M = 8
  for (let it = 0; it < 40; it++) {
    let moved = false
    for (let a = 0; a < out.length; a++)
      for (let b = a + 1; b < out.length; b++) {
        const p = out[a]
        const q = out[b]
        if (p.door !== q.door) continue
        const ox = (p.w + q.w) / 2 + M - Math.abs(p.x - q.x)
        const oy = (p.h + q.h) / 2 + M - Math.abs(p.y - q.y)
        if (ox <= 0 || oy <= 0) continue
        moved = true
        if (ox < oy) {
          const d = (ox / 2) * Math.sign(p.x - q.x || 1)
          p.x += d
          q.x -= d
        } else {
          const d = (oy / 2) * Math.sign(p.y - q.y || 1)
          p.y += d
          q.y -= d
        }
      }
    for (const p of out) {
      const r = regionOf(p.door)
      p.x = clamp(p.x, MX0 + p.w / 2, MX1 - p.w / 2)
      p.y = clamp(p.y, r.y0 + p.h / 2, r.y1 - p.h / 2)
    }
    if (!moved) break
  }
  return Object.fromEntries(out.map(({ id, ...p }) => [id, p]))
}

/* ─── Packaging ──────────────────────────────────────────────────────────── */

// Brand colours for a pack: its ground, the ink printed on the ground, and the ink printed on white.
function toneOf(mg) {
  if (!mg.color) return { '--c': '#ebe6dc', '--on': '#161616', '--print': '#161616', '--c-deep': '#cfc8ba' }
  const hex = mg.color.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return { '--c': mg.color, '--on': lum > 0.4 ? '#1c1a17' : '#fbfaf6', '--print': mg.color, '--c-deep': `color-mix(in srgb, ${mg.color} 78%, #000)` }
}

// A band printed in a wordmark panel's own ground colour, with legible ink on it.
function groundStyle(item, mg) {
  const g = item.print === 'wordmark' && wordmarkGround(mg.id)
  if (!g) return undefined
  const [r, gg, b] = [1, 3, 5].map((i) => parseInt(g.slice(i, i + 2), 16))
  return { background: g, '--on': 0.299 * r + 0.587 * gg + 0.114 * b > 150 ? '#1c1a17' : '#fbfaf6' }
}

const Mark = ({ mg, className = '' }) => <span className={`fx-mark ${className}`} style={{ '--mark': cssUrl(mg.src) }} aria-hidden="true" />

// How a pack names its brand: the mark (default), the wordmark panel from the work page, or the name set in type.
function Brand({ mg, item, on = false }) {
  const wm = item.print === 'wordmark' && wordmarkOf(mg.id)
  if (wm) return <img className="fx-wm" src={wm} alt="" draggable={false} />
  if (item.print === 'name') return <span className={`fx-name ${on ? 'is-on' : 'is-ink'}`}>{mg.label}</span>
  return <Mark mg={mg} className={on ? 'is-on' : 'is-ink'} />
}

// A printed surface wrapped round a cylinder: curved top and bottom edges (seen a
// little from above), the tub's own shading across it, and a light ink texture.
const Wrap = ({ className = '', style, children }) => (
  <span className={`fx-wrap ${className}`} style={style}>
    {children}
  </span>
)

// Glass highlights shared by bottles and jars: a bright refraction line, a softer
// band beside it, and a thin rim light on the far edge.
function GlassLights({ W, y0, y1 }) {
  return (
    <g pointerEvents="none">
      <rect x={W * 0.17} y={y0} width={W * 0.07} height={y1 - y0} rx={W * 0.035} fill="#fff" opacity=".22" />
      <rect x={W * 0.2} y={y0 + 4} width="1.6" height={y1 - y0 - 8} rx=".8" fill="#fff" opacity=".85" />
      <rect x={W * 0.86} y={y0 + 6} width="1.2" height={y1 - y0 - 12} rx=".6" fill="#fff" opacity=".45" />
    </g>
  )
}

// A glass bottle: body, shoulders, neck and cap from a few numbers, filled to `level`.
const BOTTLES = {
  juice: { W: 90, H: 270, nw: 24, nh: 14, sh: 42, ch: 26, level: 74, liquid: ['#b8600f', '#e99a34', '#f3ad4c', '#a9540c'] },
  sauce: { W: 58, H: 176, nw: 16, nh: 22, sh: 22, ch: 22, level: 58, liquid: ['#4a0c06', '#8f1f0e', '#a8301a', '#520e07'] },
  sparkling: { W: 72, H: 262, nw: 22, nh: 30, sh: 44, ch: 22, level: 60, liquid: ['#9db6bc', '#d5e5e8', '#e8f1f2', '#93adb3'] },
  coldbrew: { W: 74, H: 250, nw: 26, nh: 20, sh: 30, ch: 24, level: 52, liquid: ['#140a05', '#2e190d', '#3b2214', '#120904'] },
  kombucha: { W: 70, H: 240, nw: 22, nh: 34, sh: 40, ch: 20, level: 72, liquid: ['#6f3a15', '#b87a3f', '#c98f52', '#673412'] },
}
function bottlePath({ W, H, nw, nh, sh, ch }) {
  const l = (W - nw) / 2
  const r = (W + nw) / 2
  const y = ch + nh
  return `M${l} ${ch}h${nw}v${nh}C${r} ${y + sh * 0.5} ${W - 3} ${y + sh * 0.4} ${W - 3} ${y + sh}V${H - 14}q0 12-12 12H15q-12 0-12-12V${y + sh}C3 ${y + sh * 0.4} ${l} ${y + sh * 0.5} ${l} ${y}z`
}
function Bottle({ kind = 'juice' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const b = BOTTLES[kind]
  const d = bottlePath(b)
  const l = (b.W - b.nw) / 2
  return (
    <svg className="fx-svg" viewBox={`0 0 ${b.W} ${b.H}`} aria-hidden="true">
      <defs>
        <clipPath id={`b${id}`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`j${id}`} x1="0" x2="1">
          {b.liquid.map((c, i) => (
            <stop key={i} offset={[0, 0.32, 0.55, 1][i]} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`d${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        <linearGradient id={`c${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#1c1c1b" />
          <stop offset=".35" stopColor="#5b5c5a" />
          <stop offset=".6" stopColor="#2c2d2b" />
          <stop offset="1" stopColor="#151514" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#b${id})`}>
        <rect width={b.W} height={b.H} fill="#dfe8ea" opacity=".45" />
        <rect y={b.level} width={b.W} height={b.H} fill={`url(#j${id})`} />
        <rect y={b.level} width={b.W} height={b.H} fill={`url(#d${id})`} />
        {/* the meniscus, and the liquid's edge seen through the glass */}
        <ellipse cx={b.W / 2} cy={b.level} rx={b.W / 2} ry="2.4" fill="#fff" opacity=".35" />
        {kind === 'sparkling' && (
          <g fill="#fff" opacity=".7">
            <circle cx="22" cy="120" r="1.4" />
            <circle cx="30" cy="160" r="1" />
            <circle cx="48" cy="140" r="1.2" />
            <circle cx="40" cy="200" r="1" />
            <circle cx="26" cy="226" r="1.3" />
          </g>
        )}
        <GlassLights W={b.W} y0={b.ch + b.nh + b.sh * 0.5} y1={b.H - 8} />
        {/* the thick glass base */}
        <rect y={b.H - 10} width={b.W} height="10" fill="#fff" opacity=".22" />
      </g>
      <path d={d} fill="none" stroke="rgba(40,50,55,.12)" strokeWidth=".8" />
      <rect className="fx-cap" x={l - 3} y="2" width={b.nw + 6} height={b.ch} rx="3" fill={`url(#c${id})`} />
      <ellipse cx={b.W / 2} cy="3" rx={b.nw / 2 + 3} ry="1.8" fill="#fff" opacity=".22" />
      <path d={[0.35, 0.55, 0.75].map((k) => `M${l - 3} ${2 + b.ch * k}h${b.nw + 6}`).join('')} stroke="rgba(255,255,255,.1)" strokeWidth="1" />
    </svg>
  )
}

// A wedge of hard cheese in a waxed rind, seen from the front and a little above.
function CheeseWedge() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg className="fx-svg" viewBox="0 0 164 104" aria-hidden="true">
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc98" />
          <stop offset="1" stopColor="#dcb865" />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".05" />
          <stop offset="1" stopColor="#000" stopOpacity=".38" />
        </linearGradient>
      </defs>
      <path d="M6 94 146 30 158 22 20 88z" fill="#f8e8b8" />
      <path d="M6 94 146 30v66H6z" fill={`url(#f${id})`} />
      <path d="M146 30 158 22v68l-12 6z" className="fx-rind" />
      <path d="M146 30 158 22v68l-12 6z" fill={`url(#r${id})`} />
      <path d="M147 32 157 25" stroke="#fff" strokeOpacity=".3" />
      <path d="M6 94 146 30" fill="none" stroke="rgba(255,255,255,.7)" />
      <g fill="#c99d3e" opacity=".5">
        <ellipse cx="112" cy="58" rx="5" ry="4" />
        <ellipse cx="128" cy="84" rx="4" ry="3" />
        <ellipse cx="60" cy="86" rx="3" ry="2.5" />
        <ellipse cx="96" cy="80" rx="2.5" ry="2" />
      </g>
    </svg>
  )
}

// A glass jar under a screw lid: headspace, contents, glass lights.
const LIDS = {
  metal: ['#7f8281', '#e6e8e7', '#a9acab', '#696b6a'],
  gold: ['#6a5a3a', '#cdb67e', '#8e7847', '#5a4a2c'],
  black: ['#0c0c0c', '#4a4a48', '#1d1d1c', '#070707'],
}
function JarGlass({ fill = '#7a2a1c', lid = 'metal', contents = 'jam' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const body = 'M10 42q0-12 12-12h66q12 0 12 12v80q0 14-14 14H24q-14 0-14-14z'
  return (
    <svg className="fx-svg" viewBox="0 0 110 140" aria-hidden="true">
      <defs>
        <clipPath id={`c${id}`}>
          <path d={body} />
        </clipPath>
        <linearGradient id={`s${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".38" />
          <stop offset=".2" stopColor="#000" stopOpacity=".05" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".06" />
          <stop offset=".8" stopColor="#000" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`l${id}`} x1="0" x2="1">
          {LIDS[lid].map((c, i) => (
            <stop key={i} offset={[0, 0.35, 0.7, 1][i]} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="110" height="140" fill="#dfe8ea" opacity=".4" />
        <rect y="40" width="110" height="100" fill={fill} />
        {contents === 'pickles' && (
          <g opacity=".92">
            <ellipse cx="34" cy="92" rx="11" ry="36" transform="rotate(-8 34 92)" fill="#5f6d27" />
            <ellipse cx="58" cy="90" rx="12" ry="38" transform="rotate(5 58 90)" fill="#6b7a2e" />
            <ellipse cx="80" cy="94" rx="10" ry="34" transform="rotate(12 80 94)" fill="#56631f" />
            <circle cx="47" cy="62" r="2.6" fill="#e6e0b0" />
            <circle cx="70" cy="116" r="2.2" fill="#e6e0b0" />
          </g>
        )}
        {contents === 'jam' && <ellipse cx="46" cy="80" rx="18" ry="30" fill="#fff" opacity=".04" />}
        <ellipse cx="55" cy="40" rx="45" ry="2.5" fill="#fff" opacity=".25" />
        <rect width="110" height="140" fill={`url(#s${id})`} />
        <GlassLights W={110} y0={36} y1={130} />
        <rect y="126" width="110" height="10" fill="#fff" opacity=".18" />
      </g>
      <path d={body} fill="none" stroke="rgba(40,50,55,.12)" strokeWidth=".8" />
      <rect x="13" y="8" width="84" height="24" rx="4" fill={`url(#l${id})`} />
      <ellipse cx="55" cy="8" rx="42" ry="4" fill={`url(#l${id})`} />
      <ellipse cx="55" cy="7.5" rx="38" ry="2.6" fill="#fff" opacity=".18" />
      <path d="M13 16h84M13 21h84M13 26h84" stroke="rgba(0,0,0,.12)" />
    </svg>
  )
}

function TakeoutPail() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg className="fx-svg" viewBox="0 0 150 150" aria-hidden="true">
      <defs>
        <linearGradient id={`p${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".16" />
          <stop offset=".3" stopColor="#000" stopOpacity="0" />
          <stop offset=".75" stopColor="#000" stopOpacity=".02" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <path d="M40 44Q75 2 110 44" fill="none" stroke="#8d8e8a" strokeWidth="2.2" />
      <path d="M16 46h118l-15 100H31z" fill="#f4f2ec" />
      <path d="M16 46h118l-15 100H31z" fill={`url(#p${id})`} />
      <path d="M22 46 36 20h78l14 26z" fill="#e9e7e0" />
      <path d="M36 20 52 46M114 20 98 46M75 20v26" stroke="rgba(0,0,0,.1)" />
      <path d="M16 46h118" stroke="rgba(0,0,0,.14)" />
      <path d="M40 52 47 140M110 52 103 140" stroke="rgba(0,0,0,.06)" />
    </svg>
  )
}

/*
 * True 3D bottles and jars for the door bins: each is a stack of rings (a
 * rounded heel, the body, a shoulder that curves in over several rings, a neck
 * and a bevelled cap), every ring a circle of flat slices turned about the
 * axis with preserve-3d. Shading runs smoothly across each slice, from the
 * light at its left edge to its right, so the facets read as one curve; slices
 * overlap a little so no seams show. On top: a specular strip, a rim light on
 * the far side, the glass showing the liquid inside, and the label printed
 * round the front. About ninety elements a bottle.
 */
const SLICES = 16
const LIGHT = -40 // degrees round the axis the key light comes from
// The label faces this way round the axis: the bins turn their contents only part way
// to the viewer, so the print is set round to meet them.
const LABEL_AT = 22.5

const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180

// Light and shade for a slice facing angle `a`, `half` degrees either side.
function lightFor(a, half, { gloss = true } = {}) {
  const dark = (x) => (0.04 + 0.52 * (1 - Math.max(0, Math.cos(((x - LIGHT) * Math.PI) / 180)))).toFixed(3)
  const near = (x, c, r) => Math.max(0, 1 - Math.abs(x - c) / r)
  const layers = []
  if (gloss) {
    // The specular strip and the rim light, each spread across the slices it falls on.
    const spec = (x) => (0.6 * near(x, -24, 16)).toFixed(3)
    const rim = (x) => (0.32 * near(x, 84, 26)).toFixed(3)
    layers.push(`linear-gradient(90deg, rgba(255,255,255,${spec(a - half)}), rgba(255,255,255,${spec(a)}), rgba(255,255,255,${spec(a + half)}))`)
    layers.push(`linear-gradient(90deg, rgba(255,255,255,${rim(a - half)}), rgba(255,255,255,${rim(a + half)}))`)
  }
  layers.push(`linear-gradient(90deg, rgba(8, 12, 16, ${dark(a - half)}), rgba(8, 12, 16, ${dark(a + half)}))`)
  return layers
}

// What fills a ring between y0 and y1: empty glass above the level, the liquid below it.
function fillFor(y0, y1, level, glass, liquid) {
  const h = y1 - y0
  const deep = liquid.replace(/[\d.]+\)$/, '1)')
  if (level >= y1) return `linear-gradient(${glass}, ${glass})`
  if (level <= y0) return `linear-gradient(180deg, ${liquid}, ${deep})`
  const cut = (((level - y0) / h) * 100).toFixed(1)
  return `linear-gradient(180deg, ${glass} 0 ${cut}%, rgba(255,255,255,0.5) ${cut}%, ${liquid} calc(${cut}% + 2px), ${deep})`
}

// One ring: a frustum from radius r0 at its top to r1 at its bottom.
function Ring({ r0, r1 = r0, top, h, n = SLICES, paint, round }) {
  const rm = (r0 + r1) / 2
  const rMax = Math.max(r0, r1)
  const w = 2 * rMax * Math.tan(Math.PI / n) * 1.12 // a little overlap hides the seams
  const slant = Math.hypot(h, r1 - r0)
  const tilt = (Math.atan2(r1 - r0, h) * 180) / Math.PI
  const k = r0 / rMax
  const k1 = r1 / rMax
  const clip = r0 === r1 ? undefined : `polygon(${((1 - k) / 2) * 100}% 0, ${((1 + k) / 2) * 100}% 0, ${((1 + k1) / 2) * 100}% 100%, ${((1 - k1) / 2) * 100}% 100%)`
  const half = 180 / n
  return Array.from({ length: n }, (_, i) => {
    const a = norm((i * 360) / n)
    return (
      <i
        key={i}
        className="fx-slice"
        style={{
          top: top + h / 2 - slant / 2,
          width: w,
          height: slant + 0.6,
          marginLeft: -w / 2,
          clipPath: clip,
          borderRadius: round,
          transform: `rotateY(${a}deg) translateZ(${rm}px) rotateX(${tilt}deg)`,
          background: paint(a, half, w),
        }}
      >
        {paint.content?.(a, half, w)}
      </i>
    )
  })
}

// A flat disc (a cap's top, a shadow on the bin floor).
const Disc = ({ r, y, background, className = '' }) => (
  <i className={`fx-disc ${className}`} style={{ top: y - r, width: 2 * r, height: 2 * r, marginLeft: -r, background }} />
)

// Shapes, in px before the bins' 1.4× scale. Glass and liquid are nearly opaque: overlapping
// translucent slices would show their seams as stripes. Label runs lab[0]..lab[1] down the body.
const SOLIDS = {
  sparkling: { r: 34, H: 262, nr: 11, ch: 22, nh: 30, sh: 44, level: 62, liquid: 'rgba(200, 222, 227, 0.97)', glass: 'rgba(214, 230, 234, 0.9)', cap: '#233cf1', lab: [104, 160] },
  sauce: { r: 27, H: 176, nr: 8, ch: 22, nh: 22, sh: 22, level: 60, liquid: 'rgba(143, 31, 14, 0.97)', glass: 'rgba(214, 228, 232, 0.9)', cap: '#1f1f1e', lab: [70, 116] },
  lemonade: { r: 36, H: 250, nr: 13, ch: 24, nh: 20, sh: 30, level: 58, liquid: 'rgba(244, 233, 170, 0.97)', glass: 'rgba(222, 234, 236, 0.9)', cap: '#e8d35c', lab: [88, 152] },
  kombucha: { r: 33, H: 240, nr: 11, ch: 20, nh: 34, sh: 40, level: 74, liquid: 'rgba(184, 122, 63, 0.97)', glass: 'rgba(214, 228, 232, 0.9)', cap: '#d98f97', lab: [104, 158] },
  mustard: { r: 42, H: 112, nr: 40, ch: 20, nh: 0, sh: 0, jar: true, level: 30, liquid: 'rgba(201, 152, 31, 0.97)', glass: 'rgba(214, 228, 232, 0.9)', cap: '#a9acab', lab: [44, 92] },
}
const SHOULDER_RINGS = 4
const HEEL = 8

function Solid({ kind, mg, item }) {
  const s = SOLIDS[kind]
  const wm = item.print === 'wordmark' && wordmarkOf(mg.id)
  const bodyTop = s.ch + s.nh + s.sh
  const step = 360 / SLICES
  const labelArc = (a) => Math.abs(a - LABEL_AT) < step * 2.5 // five slices round LABEL_AT
  // The body: glass and liquid, with the label round the front slices.
  const body = (a, half, w) => {
    const layers = lightFor(a, half)
    if (labelArc(a)) {
      const k = Math.round((a - LABEL_AT) / step) + 2 // 0…4 from left to right
      const span = 5 * w
      const ly = s.lab[0] - bodyTop
      const lh = s.lab[1] - s.lab[0]
      if (wm) layers.push(`${cssUrl(wm)} ${(span * 0.14 - k * w).toFixed(1)}px ${ly + 5}px / ${(span * 0.72).toFixed(1)}px auto no-repeat`)
      layers.push(`linear-gradient(#f4f1e8, #eeeae0) 0 ${ly}px / 100% ${lh}px no-repeat`)
    }
    layers.push(fillFor(bodyTop, s.H, s.level, s.glass, s.liquid))
    return layers.join(', ')
  }
  // The product word (and the name, when there's no wordmark) rides on the middle slice.
  body.content = (a) =>
    Math.abs(a - LABEL_AT) < 1 ? (
      <span className="fx-slice-print" style={{ top: s.lab[1] - bodyTop - (wm ? 20 : 34) }}>
        {!wm && <span className="fx-slice-name">{mg.label}</span>}
        <span className="fx-slice-word">{item.word}</span>
      </span>
    ) : null
  const glassPaint = (y0, y1) => (a, half) => [...lightFor(a, half), fillFor(y0, y1, s.level, s.glass, s.liquid)].join(', ')
  const capPaint = (a, half) => [...lightFor(a, half), `linear-gradient(${s.cap}, ${s.cap})`].join(', ')
  // The shoulder follows a quarter circle: flat by the neck, upright where it meets the body.
  const neckY = s.ch + s.nh
  const shoulder = []
  for (let j = 0; j < SHOULDER_RINGS && s.sh > 0; j++) {
    const t0 = j / SHOULDER_RINGS
    const t1 = (j + 1) / SHOULDER_RINGS
    const rad = (t) => s.nr + (s.r - s.nr) * Math.sqrt(1 - (1 - t) ** 2)
    const y0 = neckY + s.sh * t0
    const y1 = neckY + s.sh * t1
    shoulder.push(<Ring key={j} r0={rad(t0)} r1={rad(t1)} top={y0} h={y1 - y0} n={j < 2 ? 12 : SLICES} paint={glassPaint(y0, y1)} />)
  }
  const capR = s.jar ? s.nr : s.nr + 2
  return (
    <span className="fx-solid" style={{ width: 2 * s.r, height: s.H }} aria-hidden="true">
      <Disc r={s.r * 1.25} y={s.H} className="fx-solid-shadow" />
      <Ring r0={s.r} top={bodyTop} h={s.H - bodyTop - HEEL} paint={body} />
      <Ring r0={s.r} r1={s.r - 5} top={s.H - HEEL} h={HEEL} n={12} paint={glassPaint(s.H - HEEL, s.H)} round="0 0 4px 4px" />
      {shoulder}
      {s.nh > 0 && <Ring r0={s.nr} top={s.ch} h={s.nh} n={10} paint={glassPaint(s.ch, neckY)} />}
      <Ring r0={capR} top={3} h={s.ch - 3} n={12} paint={capPaint} round="0 0 2px 2px" />
      <Ring r0={capR - 3} r1={capR} top={0} h={3} n={12} paint={capPaint} />
      <Disc r={capR - 3} y={0} background={`radial-gradient(circle at 40% 40%, rgba(255,255,255,0.45), rgba(255,255,255,0) 60%), ${s.cap}`} />
    </span>
  )
}

// One pack's artwork. Branded packs print the mark, wordmark or name, and a product word.
function Pack({ item, mg }) {
  const w = <span className="fx-word">{item.word}</span>
  switch (item.kind) {
    case 'pint':
      return (
        <>
          <span className="fx-pint-lid" />
          <Wrap className="fx-pint-body">
            <Brand mg={mg} item={item} on />
            {w}
          </Wrap>
        </>
      )
    case 'yogurt':
      return (
        <>
          <span className="fx-yogurt-lid" />
          <Wrap className="fx-yogurt-body">
            <Brand mg={mg} item={item} />
            {w}
          </Wrap>
        </>
      )
    case 'soup':
      return (
        <>
          <span className="fx-deli-lid" />
          <Wrap className="fx-deli-body" style={{ '--soup': item.fill }}>
            <span className="fx-deli-sticker">
              <Brand mg={mg} item={item} />
              {w}
            </span>
          </Wrap>
        </>
      )
    case 'pizza':
      return (
        <span className="fx-pizza-box fx-card">
          <span className="fx-pizza-band" style={{ background: wordmarkGround(mg.id) || 'var(--c-deep)' }}>
            <Brand mg={mg} item={item} on />
          </span>
          <span className="fx-pizza-pie" />
          {w}
        </span>
      )
    case 'peas':
      return (
        <span className="fx-bag">
          <Brand mg={mg} item={item} on />
          <span className="fx-bag-window" />
          {w}
        </span>
      )
    case 'pops':
      return (
        <span className="fx-pops-box fx-card">
          <Brand mg={mg} item={item} on />
          <span className="fx-pops-row">
            <i />
            <i />
            <i />
          </span>
          {w}
        </span>
      )
    case 'milk':
      return (
        <>
          <span className="fx-milk-fin" />
          <span className="fx-milk-slope" />
          <span className="fx-milk-body fx-card">
            <Brand mg={mg} item={item} />
            <span className="fx-milk-band">{w}</span>
          </span>
        </>
      )
    // In the door bins: true 3D bottles and jars.
    case 'sauce':
    case 'sparkling':
    case 'lemonade':
    case 'kombucha':
    case 'mustard':
      return <Solid kind={item.kind} mg={mg} item={item} />
    case 'juice':
      return (
        <>
          <Bottle kind={item.kind} />
          <Wrap className={`fx-label fx-${item.kind}-label`}>
            <Brand mg={mg} item={item} />
            {w}
          </Wrap>
        </>
      )
    case 'jar':
    case 'pickles':
      return (
        <>
          <JarGlass
            fill={item.fill || (item.kind === 'pickles' ? '#aea66e' : item.kind === 'mustard' ? '#b98d1c' : '#5a1622')}
            lid={item.lid || (item.kind === 'pickles' ? 'gold' : 'metal')}
            contents={item.kind === 'pickles' ? 'pickles' : 'jam'}
          />
          <Wrap className="fx-label fx-jar-label">
            <Brand mg={mg} item={item} />
            {w}
          </Wrap>
        </>
      )
    case 'eggs':
      return (
        <span className="fx-egg-box">
          <span className="fx-egg-lid" />
          <span className="fx-egg-band fx-card" style={groundStyle(item, mg)}>
            <Brand mg={mg} item={item} on />
            {w}
          </span>
        </span>
      )
    case 'takeout':
      return (
        <>
          <TakeoutPail />
          <span className="fx-takeout-print">
            <Brand mg={mg} item={item} />
          </span>
        </>
      )
    case 'butter':
      return (
        <>
          <span className="fx-butter-top" />
          <span className="fx-butter-front fx-card">
            <Brand mg={mg} item={item} on />
            {w}
          </span>
        </>
      )
    case 'cheese':
      return (
        <>
          <CheeseWedge />
          <span className="fx-cheese-sticker">
            <Brand mg={mg} item={item} />
          </span>
        </>
      )
    case 'dumplings':
      return (
        <span className="fx-dumpling-box fx-card">
          <Brand mg={mg} item={item} on />
          <span className="fx-dumpling-plate">
            <i />
            <i />
            <i />
          </span>
          {w}
        </span>
      )
    case 'freezer-bag':
      return (
        <span className="fx-zipbag">
          <span className="fx-zip" />
          <span className="fx-zipbag-panel">
            <Brand mg={mg} item={item} />
            {w}
          </span>
          <span className="fx-berries" />
        </span>
      )
    // ── Unbranded: the ice trays are kit, not groceries ──
    case 'ice-tray':
      return (
        <>
          <span className="fx-tray" />
          <span className="fx-tray" />
        </>
      )
    default:
      return null
  }
}

function Produce({ kind }) {
  switch (kind) {
    case 'lettuce':
      return (
        <span className="fx-lettuce" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )
    case 'carrots':
      return (
        <span className="fx-carrots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )
    case 'lemons':
      return (
        <span className="fx-lemons" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )
    case 'apples':
      return (
        <span className="fx-apples" aria-hidden="true">
          <i />
          <i />
        </span>
      )
    default:
      return null
  }
}

const linkNote = (mg) => (mg.project ? 'Case study' : mg.url ? 'anchovies.agency ↗' : 'No case study yet')

/* ─── The fridge ─────────────────────────────────────────────────────────── */

export default function Fridge({ projects, onOpen, active }) {
  const viewRef = useRef(null)
  const [box, setBox] = useState({ w: 1200, h: 700 })
  const [cam, setCam] = useState(null) // { z, x, y }
  const [smooth, setSmooth] = useState(false)
  const [pos, setPos] = useState(() => layout())
  const [hover, setHover] = useState(null)
  const [wobble, setWobble] = useState(null)
  const [panning, setPanning] = useState(false)
  const [open, setOpen] = useState({ freezer: false, fridge: false })
  const [ajar, setAjar] = useState(null) // the door under the pointer eases open a crack
  const [sel, setSel] = useState(null) // the product showing its name
  const [dragDoor, setDragDoor] = useState(null)
  const drag = useRef(null)
  const zTop = useRef(100)
  const reduced = prefersReducedMotion()

  const fitZ = useCallback((b = box) => Math.min((b.h * 0.94) / FH, (b.w * 0.9) / FW), [box])
  const closeUp = useCallback(
    (b = box) => {
      const z = clamp(Math.min(1, (b.w * 0.92) / FW), fitZ(b), 1.2)
      return { z, x: (b.w - FW * z) / 2, y: 18 }
    },
    [box, fitZ],
  )
  const whole = useCallback(
    (b = box) => {
      const z = fitZ(b)
      return { z, x: (b.w - FW * z) / 2, y: (b.h - FH * z) / 2 }
    },
    [box, fitZ],
  )

  // Leaving the room (or showing it in the overview): doors shut, whole fridge in view.
  useEffect(() => {
    if (active) return
    setOpen({ freezer: false, fridge: false })
    setSel(null)
    setCam((c) => (c ? whole() : c))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    const el = viewRef.current
    const ro = new ResizeObserver(([e]) => {
      const b = { w: e.contentRect.width, h: e.contentRect.height }
      setBox(b)
      setCam((c) => c || whole(b)) // first view: the whole fridge
    })
    ro.observe(el)
    // ResizeObserver waits for a painted frame; in a background tab that may not come, so measure once by timer too.
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect()
      if (!r.width) return
      const b = { w: r.width, h: r.height }
      setBox((cur) => (cur.w === b.w && cur.h === b.h ? cur : b))
      setCam((c) => c || whole(b))
    }, 60)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [whole])

  // Keep the fridge in view: smaller than the view, it stays inside; larger, it can't slide away.
  const bound = useCallback(
    // `slack` lets an open compartment be framed away from the fridge's own top or bottom edge.
    (c, slack = 0) => {
      const w = FW * c.z
      const h = FH * c.z
      const range = (size, view, pad) => (size <= view ? [0, view - size] : [view - size - pad, pad])
      const [x0, x1] = range(w, box.w, 40)
      const [y0, y1] = range(h, box.h, 18)
      return { ...c, x: clamp(c.x, x0, x1), y: clamp(c.y, y0 - slack, y1 + slack) }
    },
    [box],
  )

  const go = (c, slack = 0) => {
    setSmooth(!reduced)
    setCam(bound(c, slack))
    setTimeout(() => setSmooth(false), 650)
  }

  const zoomAt = useCallback(
    (factor, sx, sy) => {
      setCam((c) => {
        if (!c) return c
        const z = clamp(c.z * factor, fitZ(), 1.8)
        const k = z / c.z
        return bound({ z, x: sx - (sx - c.x) * k, y: sy - (sy - c.y) * k })
      })
    },
    [bound, fitZ],
  )

  // Wheel and trackpad pinch zoom around the pointer. (The index never scrolls, so the wheel is free.)
  useEffect(() => {
    const el = viewRef.current
    const onWheel = (e) => {
      if (!active) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX - r.left, e.clientY - r.top)
      else setCam((c) => bound({ ...c, x: c.x - e.deltaX }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [active, zoomAt, bound])

  // ── Doors ──
  // Opening a door frames what's behind it: on a wide screen, the compartment and
  // the swung door; on a narrow one, just the compartment (the door hangs off to the right).
  const frame = (which) => {
    const d = DOORS[which]
    const wide = box.w >= 700
    const span = FW * (wide ? 1.5 : 1.06)
    const tall = d.h * (wide ? 1.3 : 1.08)
    const top = wide ? 0 : 64 // clear of the room tabs on a phone
    const room = box.h - (wide ? 72 : 140) - top // and of the controls
    const z = Math.min(1, (box.w * 0.94) / span, (room * 0.96) / tall)
    const x = (box.w - (wide ? span : FW) * z) / 2
    const y = top + room / 2 - (d.y + d.h / 2) * z
    go({ z, x, y }, box.h * 0.3)
  }
  const toggle = (which) => {
    setSel(null)
    if (!open[which]) frame(which)
    sfx(open[which] ? 'doorClose' : 'doorOpen')
    // One door at a time: opening one shuts the other.
    setOpen((o) => (o[which] ? { freezer: false, fridge: false } : { freezer: which === 'freezer', fridge: which === 'fridge' }))
  }
  const anyOpen = open.freezer || open.fridge

  // Escape shuts an open door, before the rest of the app hears it.
  useEffect(() => {
    if (!active || !anyOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape' || document.documentElement.classList.contains('case-open')) return
      e.stopPropagation()
      setOpen({ freezer: false, fridge: false })
      setSel(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, anyOpen])

  // ── Pan the fridge, or slide a magnet ──
  // Which magnet is under the pointer, worked out from the magnets' own positions.
  // Some browsers (Safari especially) hit-test badly inside the doors' 3D layers and
  // hand the press to the fridge instead; this catches those presses.
  const magnetAt = (clientX, clientY) => {
    const r = viewRef.current.getBoundingClientRect()
    const x = (clientX - r.left - cam.x) / cam.z
    const y = (clientY - r.top - cam.y) / cam.z
    let hit = null
    for (const mg of magnets) {
      const p = pos[mg.id]
      if (open[p.door]) continue
      if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(y - p.y) <= p.h / 2 && (!hit || p.z > pos[hit].z)) hit = mg.id
    }
    return hit
  }

  const onViewDown = (e) => {
    if (!cam || (e.pointerType === 'mouse' && e.button !== 0)) return
    if (!e.target.closest?.('.fx-cavity, .fx-back, .fridge-handle, .fridge-controls')) {
      const id = magnetAt(e.clientX, e.clientY)
      if (id) return onMagnetDown(id, viewRef.current.querySelector(`[data-mg="${id}"]`))(e)
    }
    // Doors open from their handles only; a click on the inside of an open door shuts it.
    const leaf = e.target.closest?.('.fx-back')
    const bay = leaf?.closest('.fx-bay.is-open')
    const door = bay ? (bay.classList.contains('is-freezer') ? 'freezer' : 'fridge') : null
    drag.current = { kind: 'pan', x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y, pid: e.pointerId, el: e.currentTarget, moved: false, door }
  }
  const onMagnetDown = (id, el) => (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.stopPropagation()
    e.preventDefault() // no text selection or native drag getting in the way
    const p = pos[id]
    drag.current = { kind: 'magnet', id, x0: e.clientX, y0: e.clientY, px: p.x, py: p.y, pid: e.pointerId, el: el || e.currentTarget, moved: false }
    zTop.current += 1
    setDragDoor(p.door)
    setPos((q) => ({ ...q, [id]: { ...q[id], z: zTop.current } }))
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return
      d.moved = true
      if (d.kind === 'pan') setPanning(true)
      else sfx('unstick')
      try {
        d.el.setPointerCapture(d.pid)
      } catch {
        /* ignore */
      }
    }
    if (d.kind === 'pan') setCam((c) => bound({ ...c, x: d.cx + dx, y: d.cy + dy }, anyOpen ? box.h * 0.3 : 0))
    else
      setPos((q) => {
        const p = q[d.id]
        return {
          ...q,
          [d.id]: {
            ...p,
            x: clamp(d.px + dx / cam.z, MX0 - 24 + p.w / 2, FW - 16 - p.w / 2),
            y: clamp(d.py + dy / cam.z, 24 + p.h / 2, FH - 70 - p.h / 2),
            lifted: true,
          },
        }
      })
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    setPanning(false)
    if (!d) return
    if (d.kind === 'pan' && !d.moved && d.door) toggle(d.door)
    if (d.kind === 'magnet') {
      // Set down wholly on whichever door it was dropped on.
      if (d.moved) sfx('magnet')
      setPos((q) => ({ ...q, [d.id]: { ...settle(q[d.id]), lifted: false } }))
      setDragDoor(null)
      if (!d.moved) openMagnet(d.id, d.el)
    }
  }

  // Open a brand's case study: here if it has one, otherwise the live one in a new tab.
  const openBrand = (id, el) => {
    const mg = byId[id]
    const i = mg.project ? projects.findIndex((p) => p.id === mg.project) : -1
    if (i >= 0) {
      onOpen(i, el)
      return true
    }
    if (mg.url) window.open(mg.url, '_blank', 'noopener')
    return false
  }
  const openMagnet = (id, el) => {
    if (openBrand(id, el)) return
    setWobble(id)
    setTimeout(() => setWobble(null), 450)
  }

  // A product: the first tap shows its brand, the next opens it. (A mouse hover counts as the first.)
  const renderItem = (item, key) => {
    const mg = item.brand && byId[item.brand]
    if (!mg)
      return (
        <span key={key} className={`fx-item fx-${item.kind}${item.tone ? ` is-${item.tone}` : ''}`} aria-hidden="true">
          <span className="fx-contact" />
          <Pack item={item} />
        </span>
      )
    const shown = sel === key
    return (
      <button
        key={key}
        type="button"
        className={`fx-item fx-${item.kind}${shown ? ' is-shown' : ''}`}
        style={toneOf(mg)}
        aria-label={`${mg.label} ${item.word}: ${mg.project ? 'open the case study' : mg.url ? 'open the case study on anchovies.agency (new tab)' : 'no case study yet'}`}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setSel(key)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setSel((s) => (s === key ? null : s))}
        onFocus={() => setSel(key)}
        onBlur={() => setSel((s) => (s === key ? null : s))}
        onClick={(e) => {
          if (shown || e.detail === 0) openBrand(mg.id, e.currentTarget)
          else setSel(key)
        }}
      >
        <span className="fx-contact" aria-hidden="true" />
        <Pack item={item} mg={mg} />
        <span className="fx-tip label" aria-hidden="true">
          {mg.label} · {linkNote(mg)}
        </span>
      </button>
    )
  }

  const z = cam?.z ?? 1
  const zoomedOut = cam && cam.z <= fitZ() * 1.02
  const hoverMg = hover && byId[hover]
  const hoverPos = hover && pos[hover]
  const doorWord = { freezer: 'freezer', fridge: 'fridge' }

  const renderMagnet = (mg) => {
    const p = pos[mg.id]
    const top = DOORS[p.door].y
    const project = mg.project && projects.find((x) => x.id === mg.project)
    return (
      <button
        key={mg.id}
        type="button"
        className={`magnet${p.lifted ? ' is-lifted' : ''}${wobble === mg.id ? ' is-wobbling' : ''}`}
        style={{
          width: p.w,
          height: p.h,
          '--mark': cssUrl(mg.src),
          transform: `translate(${p.x - PAD - p.w / 2}px, ${p.y - top - p.h / 2}px) rotate(${p.r}deg)`,
          zIndex: p.z,
        }}
        data-mg={mg.id}
        onPointerDown={onMagnetDown(mg.id)}
        onPointerEnter={() => setHover(mg.id)}
        onPointerLeave={() => setHover((h) => (h === mg.id ? null : h))}
        onFocus={() => setHover(mg.id)}
        onBlur={() => setHover((h) => (h === mg.id ? null : h))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openMagnet(mg.id, e.currentTarget)
          }
        }}
        aria-label={
          project
            ? `${mg.label}: open the case study`
            : mg.url
              ? `${mg.label}: open the case study on anchovies.agency (new tab)`
              : `${mg.label} (no case study yet)`
        }
      >
        <img src={mg.src} alt="" draggable={false} />
      </button>
    )
  }

  // One compartment: the lit interior, and the door that swings over it.
  const renderBay = (which) => {
    const isOpen = open[which]
    const stock = fridgeContents[which]
    const d = DOORS[which]
    const Face = which === 'freezer' ? 'fridge-freezer' : 'fridge-door'
    return (
      <div
        className={`fx-bay is-${which}${isOpen ? ' is-open' : ''}${reduced ? ' is-instant' : ''}`}
        style={{ height: which === 'freezer' ? d.h : undefined, zIndex: dragDoor === which ? 3 : isOpen ? 2 : 1 }}
      >
        <div className="fx-cavity" inert={!isOpen || undefined} aria-label={`Inside the ${doorWord[which]}`} role="group">
          <div className="fx-liner">
            {/* The liner's walls, ceiling and floor, receding to the back wall. */}
            <span className="fx-wall is-l" aria-hidden="true" />
            <span className="fx-wall is-r" aria-hidden="true" />
            <span className="fx-wall is-t" aria-hidden="true" />
            <span className="fx-wall is-b" aria-hidden="true" />
            <span className="fx-lamp" aria-hidden="true" />
            {stock.shelves.map((row, s) => (
              <div key={s} className={`fx-zone is-${which}-${s}`}>
                <div className="fx-row">{row.map((it, k) => renderItem(it, `${which}-${s}-${k}`))}</div>
                {(which === 'fridge' || s < stock.shelves.length - 1) && <span className={which === 'freezer' ? 'fx-wire' : 'fx-glass'} aria-hidden="true" />}
              </div>
            ))}
            {stock.produce && (
              <div className="fx-crispers" aria-hidden="true">
                {stock.produce.map((drawer, k) => (
                  <div key={k} className="fx-crisper">
                    <div className="fx-crisper-load">
                      {drawer.map((kind) => (
                        <Produce key={kind} kind={kind} />
                      ))}
                    </div>
                    <span className="fx-crisper-front" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fx-leaf" style={{ transform: `rotateY(${isOpen ? OPEN_DEG : ajar === which ? OPEN_DEG * 0.05 : 0}deg)` }}>
          <div className={`${Face} fx-front`} inert={isOpen || undefined}>
            <button
              type="button"
              className={`fridge-handle${which === 'fridge' ? ' is-long' : ''}`}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? 'Close' : 'Open'} the ${doorWord[which]}`}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setAjar(which)}
              onPointerLeave={() => setAjar((a) => (a === which ? null : a))}
              onClick={() => (setAjar(null), toggle(which))}
            />
            {magnets.filter((mg) => pos[mg.id].door === which).map(renderMagnet)}
          </div>
          {/* The door's thickness: its free edge and its hinge edge. */}
          <span className="fx-thick is-free" aria-hidden="true" />
          <span className="fx-thick is-hinge" aria-hidden="true" />
          <div className="fx-back" inert={!isOpen || undefined} style={{ '--turn': `${isOpen ? TURN : 0}deg` }}>
            <span className="fx-back-panel" aria-hidden="true" />
            {stock.door.map((row, b) => (
              // A bin: floor, side walls and a front lip in 3D, standing out from the door liner.
              <div key={b} className={`fx-bin is-${which}-bin-${b}`}>
                <span className="fx-bin-back" aria-hidden="true" />
                <span className="fx-bin-floor" aria-hidden="true" />
                <span className="fx-bin-wall is-l" aria-hidden="true" />
                <span className="fx-bin-wall is-r" aria-hidden="true" />
                <div className="fx-row">{row.map((it, k) => renderItem(it, `${which}-door-${b}-${k}`))}</div>
                <span className="fx-bin-front" aria-hidden="true" />
              </div>
            ))}
            <button
              type="button"
              className="fx-edge"
              aria-expanded={isOpen}
              aria-label={`Close the ${doorWord[which]}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => toggle(which)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={viewRef}
      className={`fridge-view${panning ? ' is-panning' : ''}`}
      onPointerDown={onViewDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {cam && (
        <div
          className={`fridge-cam${smooth ? ' is-smooth' : ''}`}
          style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`, '--cz': cam.z }}
        >
          <div className="fridge fx-body" style={{ width: FW, height: FH }} aria-label="The office fridge, covered in client magnets">
            {renderBay('freezer')}
            {renderBay('fridge')}
            <span className="fridge-grille" aria-hidden="true" />
          </div>
        </div>
      )}

      {hoverMg && hoverPos && cam && !drag.current && !open[hoverPos.door] && (
        <p className="magnet-tip label" style={{ left: cam.x + hoverPos.x * z, top: cam.y + (hoverPos.y + hoverPos.h / 2) * z + 10 }} aria-hidden="true">
          {hoverMg.label} · {linkNote(hoverMg)}
        </p>
      )}

      <div className="fridge-controls fx-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="pager-btn" onClick={() => zoomAt(1 / 1.35, box.w / 2, box.h / 2)} aria-label="Zoom out">
          −
        </button>
        <button type="button" className="pager-btn" onClick={() => zoomAt(1.35, box.w / 2, box.h / 2)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="text-btn label" onClick={() => go(zoomedOut ? closeUp() : whole())}>
          {zoomedOut ? 'Close up' : 'Whole fridge'}
        </button>
        <button type="button" className="text-btn label" onClick={() => setPos(layout())}>
          Shuffle
        </button>
      </div>
    </div>
  )
}
