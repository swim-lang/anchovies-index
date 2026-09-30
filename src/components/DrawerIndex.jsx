import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Postcard from './Postcard.jsx'
import Polaroid from './Polaroid.jsx'
import SoundToggle from './SoundToggle.jsx'
import Fridge from './Fridge.jsx'
import PhotoZoom from './PhotoZoom.jsx'
import IndexTray from './IndexTray.jsx'
import { ROOMS } from '../content/rooms.js'
import { RoomVending, RoomTypewriter } from './RoomSlots.jsx'
import { Pad, ToolGlyph, HeldTool, TOOLS } from './Desk.jsx'
import { PROPS, Glyph, PropDefs, CoffeeRing, FORTUNES } from './Props.jsx'
import { prefersReducedMotion, DUR } from '../motion/timing.js'
import { bezier, lerp, tween } from '../motion/tween.js'
import { agency } from '../content/projects.js'
import { team, officePhotos } from '../content/team.js'
import { magnets, workOrder } from '../content/magnets.js'
import { specimens } from '../content/specimens.js'
import { sfx } from '../motion/sound.js'

/*
 * THE CABINET
 * Three card-catalog drawers in CSS 3D:
 *   Selected work: project postcards, a sketch pad, pens, clips, a coin, keys
 *   The studio:    the team's Polaroids and a few things that are very them
 *   Specimens:     colour chips and mark specimens, one per brand
 *
 * One progress value `p` (0 → 1) runs an opening:
 *   0.00 – 0.62  the chosen drawer slides out toward you
 *   0.42 – 1.00  the camera tips over until you look straight down into it
 * At p = 1 the floor is flat to the screen at scale 1, so everything in it can
 * be handled in plain pixels. Each visit lays the drawers out afresh.
 *
 * World axes: the floor lies in x/y, "up" out of a drawer is +z.
 */

const A0 = 86 // camera angle in the front view: nearly straight on (0 = looking straight down)
const ease = bezier(0.45, 0, 0.2, 1)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const easeInOut = (t) => ease(clamp(t))
const rand = (a, b) => a + Math.random() * (b - a)
const pad3 = (v) => String(v).padStart(3, '0')
const pad2 = (v) => String(v).padStart(2, '0')

const DRAWERS = [
  { key: 'work', title: 'Selected work' },
  { key: 'studio', title: 'The studio' },
  { key: 'archive', title: 'The archive' },
  { key: 'specimens', title: 'Specimens' },
  { key: 'junk', title: 'Odds & ends' },
]

function measure() {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const mobile = vw < 720
  const stageH = vh - (mobile ? 116 : 124)
  const gutter = Math.max(16, Math.min(44, vw * 0.032))
  const W = Math.round(mobile ? vw - 20 : Math.min(vw - 2 * gutter, 1480))
  const D = Math.round(stageH - (mobile ? 14 : 26))
  const Hf = mobile ? 84 : 128
  const gap = mobile ? 8 : 12
  const M = mobile ? 10 : 40
  const Mt = mobile ? 22 : 34
  const Mb = mobile ? 18 : 26
  const kit = !mobile && W > 900
  const cw = Math.round(mobile ? Math.min(W * 0.62, 260) : Math.min(W * (kit ? 0.2 : 0.235), 340, D * 0.3 * 1.42))
  const faceH = DRAWERS.length * Hf + (DRAWERS.length - 1) * gap + Mt + Mb
  return {
    vw,
    mobile,
    kit,
    W,
    D,
    Hw: mobile ? 32 : 50,
    Hf,
    gap,
    S: D + 24,
    M,
    Mt,
    Mb,
    cw,
    ch: Math.round(cw / 1.42),
    polaroidH: Math.round(mobile ? D * 0.28 : Math.min(D * 0.45, 380)),
    toolL: Math.round(Math.min(W * 0.13, 200)),
    s: clamp(W / 1352, 0.6, 1.1), // prop scale
    k0: Math.min(1, (0.8 * vw) / (W + 2 * M), (0.66 * stageH) / faceH),
  }
}

const indexOf = (d) => DRAWERS.findIndex((x) => x.key === d)

// Keys hang from their ring. Each key's resting direction, in the drawing (degrees).
const KEY_BASE = { housekeys: [-14, 28], motokeys: [10] }
const KEY_LEN = 180 // effective pendulum length: keys swing, they don't whirl
const zOf = (d, m) => -indexOf(d) * (m.Hf + m.gap)

const byRank = (list, rank) => [...list].sort((a, b) => (rank[a.id] ?? 999) - (rank[b.id] ?? 999))

/* ── What's in each drawer ─────────────────────────────────────────────── */
function contents(m, projects) {
  const list = []
  const add = (key, drawer, kind, w, h, layer, rot, overlap, extra = {}) =>
    list.push({ key, drawer, kind, w: Math.round(w), h: Math.round(h), layer, rot, overlap, ...extra })
  const prop = (drawer, kind, layer = 2, rot = [-180, 180], overlap = 0.3, key = kind) => {
    const [w, h] = PROPS[kind].size
    // Junk is the point of its drawer, so it's shown larger there.
    const k = m.s * (drawer === 'junk' ? (layer === 0 ? 1.5 : 2) : 1)
    add(`${drawer}-${key}`, drawer, 'prop', w * k, h * k, layer, rot, overlap, { sub: kind })
  }

  // Selected work
  if (m.kit) add('pad', 'work', 'pad', m.W * 0.165, Math.min(m.W * 0.165 * 1.3, m.D * 0.58), 0, [-4, 4], 0.05)
  projects.forEach((pr) => add(pr.id, 'work', 'card', m.cw, m.ch, 1, [-8, 8], 0.1))
  if (m.kit) ['pencil', 'marker', 'dry'].forEach((t) => add(`tool-${t}`, 'work', 'tool', m.toolL, m.toolL * 0.08, 2, [-180, 180], 0.25, { sub: t }))
  ;['clip', 'clip2', 'penny', 'housekeys'].forEach((k) => prop('work', k))

  // The studio: the three of you front and centre, office Polaroids around and beneath.
  const lineup = m.mobile ? [[0.3, 0.3], [0.7, 0.42], [0.42, 0.7]] : [[0.3, 0.5], [0.5, 0.47], [0.7, 0.51]]
  team.forEach((t, i) =>
    add(`team-${t.id}`, 'studio', 'polaroid', (m.polaroidH * t.photo.w) / t.photo.h, m.polaroidH, 2, [-7, 7], 0.02, {
      fixed: { x: lineup[i % lineup.length][0] * m.W, y: lineup[i % lineup.length][1] * m.D },
    }),
  )
  officePhotos.forEach((o) => add(`office-${o.id}`, 'studio', 'office', m.polaroidH * 0.62 * 0.84, m.polaroidH * 0.62, 1, [-16, 16], 0.25, { office: o }))

  // Specimens, from the studio's own identity guides and pitches (content/specimens.js):
  // paint chips of each brand's named colours, type cards of its typefaces, and
  // specimen cards of the mark. Newest brands first.
  const rank = Object.fromEntries(workOrder.map((id, i) => [id, i]))
  const byId = Object.fromEntries(magnets.map((mg) => [mg.id, mg]))
  const specs = [...specimens].filter((sp) => byId[sp.id]).sort((a, b) => (rank[a.id] ?? 999) - (rank[b.id] ?? 999))
  // The most characterful colours first: saturated before neutrals, two per brand.
  const chroma = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    return Math.max(r, g, b) - Math.min(r, g, b)
  }
  const chips = specs.flatMap((sp) =>
    [...sp.colors]
      .sort((a, b) => chroma(b.hex) - chroma(a.hex))
      .slice(0, 1)
      .map((c, i) => ({ sp, c, i })),
  )
  const cw = m.cw * (m.mobile ? 0.42 : 0.34)
  const marks = byRank(magnets, rank).filter((mg) => mg.url || mg.project).slice(0, m.mobile ? 2 : 4)
  marks.forEach((mg) => add(`spec-${mg.id}`, 'specimens', 'specimen', m.cw * 0.6, m.cw * 0.6 * 1.3, 1, [-10, 10], 0.18, { mg }))
  // Type cards: the deck's own typography slide where there is one (landscape), else the names (portrait).
  specs
    .filter((sp) => sp.fonts.length)
    .sort((a, b) => !!b.aa - !!a.aa)
    .slice(0, m.mobile ? 4 : 9)
    .forEach((sp) => add(`type-${sp.id}`, 'specimens', 'type', m.cw * 0.68, m.cw * 0.68 * 1.28, 1, [-8, 8], 0.2, { mg: byId[sp.id], sp }))
  chips.slice(0, m.mobile ? 8 : 16).forEach(({ sp, c, i }) => add(`chip-${sp.id}-${i}`, 'specimens', 'chip', cw, cw * 1.72, 2, [-24, 24], 0.2, { mg: byId[sp.id], sp, color: c }))

  // The archive: every brand on /work, on index cards in a tray.
  add('tray', 'archive', 'tray', m.mobile ? m.W * 0.92 : Math.min(m.W * 0.62, 820), m.D * (m.mobile ? 0.6 : 0.8), 1, [0, 0], 0, {
    fixed: { x: m.W * 0.5, y: m.D * 0.5 },
  })

  // Odds & ends: a junk drawer; most of it does something.
  if (!m.mobile) prop('junk', 'notes', 0, [-18, 18], 0.12)
  prop('junk', 'tin', 1, [-30, 30], 0.08)
  ;(m.mobile
    ? ['fork', 'cookie', 'die', 'ball', 'eye', 'cap', 'marble', 'domino']
    : ['fork', 'cookie', 'die', 'ball', 'top', 'band', 'band2', 'battery', 'cap', 'cap2', 'marble', 'eraser', 'binder', 'eye', 'pin', 'candle', 'domino']
  ).forEach((k) => prop('junk', k, 2, [-180, 180], 0.15))
  // …and the stuff every junk drawer collects more than one of.
  if (!m.mobile)
    [['die', 'die2'], ['eye', 'eye2'], ['cap', 'cap3'], ['marble', 'marble2'], ['penny', 'penny'], ['penny', 'penny2'], ['clip', 'clip'], ['battery', 'battery2'], ['housekeys', 'keys']].forEach(([kind, key]) =>
      prop('junk', kind, 2, [-180, 180], 0.2, key),
    )

  return list
}

/* ── A loose, eclectic layout: random each visit, but nothing buried ──── */
function scatter(list, m) {
  const placed = {}
  const byDrawer = {}
  const margin = 12
  const bbox = (w, h, r, x, y) => {
    const a = (r * Math.PI) / 180
    const bw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))
    const bh = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))
    return { l: x - bw / 2, r: x + bw / 2, t: y - bh / 2, b: y + bh / 2, bw, bh }
  }
  const inter = (A, B) => Math.max(0, Math.min(A.r, B.r) - Math.max(A.l, B.l)) * Math.max(0, Math.min(A.b, B.b) - Math.max(A.t, B.t))
  // Big things first, so small things find the gaps.
  const sorted = [...list].sort((a, b) => !!b.fixed - !!a.fixed || a.layer - b.layer || b.w * b.h - a.w * a.h)
  for (const it of sorted) {
    const others = (byDrawer[it.drawer] ||= [])
    if (it.fixed) {
      const r = rand(it.rot[0], it.rot[1])
      others.push({ box: bbox(it.w, it.h, r, it.fixed.x, it.fixed.y), layer: it.layer, overlap: it.overlap })
      placed[it.key] = { x: it.fixed.x, y: it.fixed.y, r }
      continue
    }
    let best = null
    for (let i = 0; i < 260; i++) {
      const r = rand(it.rot[0], it.rot[1])
      const probe = bbox(it.w, it.h, r, 0, 0)
      const x = rand(margin + probe.bw / 2, m.W - margin - probe.bw / 2)
      const y = rand(margin + probe.bh / 2, m.D - margin - probe.bh / 2)
      const B = bbox(it.w, it.h, r, x, y)
      let worst = 0
      for (const o of others) {
        const share = inter(B, o.box) / Math.min(B.bw * B.bh, o.box.bw * o.box.bh)
        // Small things may rest on big ones; like things keep apart.
        const allowed = o.layer === it.layer ? Math.min(it.overlap, o.overlap) : Math.max(it.overlap, o.overlap)
        worst = Math.max(worst, share - allowed)
      }
      if (!best || worst < best.worst) best = { x, y, r, box: B, worst }
      if (worst <= 0) break
    }
    others.push({ box: best.box, layer: it.layer, overlap: it.overlap })
    placed[it.key] = { x: best.x, y: best.y, r: best.r }
  }
  return placed
}

export default function DrawerIndex({
  projects,
  onActiveChange,
  onOpen,
  receded,
  busy,
  hidden,
  cardEls,
  buttonEls,
  startOpen,
}) {
  const [m, setM] = useState(measure)
  const mRef = useRef(m)
  mRef.current = m

  const worldRef = useRef(null)
  const drawerRefs = useRef({})
  const floorRefs = useRef({})
  const shadeRefs = useRef({})
  const cabinetRefs = useRef([])
  const p = useRef(startOpen ? 1 : 0)
  const which = useRef(startOpen ? 'work' : null)
  const [open, setOpen] = useState(startOpen ? 'work' : null) // the drawer that's fully open
  const [moving, setMoving] = useState(null)
  const [peek, setPeek] = useState(null) // a drawer easing out under the pointer
  // Pan across the room: 'cabinet' | 'fridge' | 'vending' | 'typewriter'. ?room=fridge starts there.
  const roomParam = new URLSearchParams(window.location.search).get('room')
  const [view, setView] = useState(() => (ROOMS.some((r) => r.key === roomParam) ? roomParam : 'cabinet'))
  // The entrance greets a fresh arrival (not a deep link to a case study, not ?room=).
  const [entrance, setEntrance] = useState(() => !startOpen && !roomParam)
  /*
   * The overview lays the four objects out as themselves, side by side on one
   * floor, at believable relative sizes (the fridge and vending machine tall,
   * the cabinet low, the typewriter small). Each room is measured where it
   * stands, then moved and scaled so its object lands on its spot.
   */
  const stageRef = useRef(null)
  const roomEls = useRef({})
  const [layout, setLayout] = useState(null) // { [room]: { ox, oy, k, x, y, w, h } }
  const OBJECT = { cabinet: '.cab-face, .drawer-front', fridge: '.fridge', vending: '.vm-body', typewriter: '.tw-front, .tw-deck, .tw-table, .tw-basket, .tw-lever' } // the machine itself: not its mat, not the paper's full track
  const HEIGHT = { cabinet: 0.5, fridge: 1, vending: 1.03, typewriter: 0.26 }
  const SQUEEZE = { cabinet: 0.6 } // on the overview the cabinet is drawn narrower than in its room // relative to the fridge
  const DESK = 0.42 // the typewriter sits on a desk this tall (fridge = 1)
  const measureOverview = useCallback(() => {
    const st = stageRef.current?.getBoundingClientRect()
    if (!st || !st.width) return 'no stage'
    const W = st.width
    const H = st.height
    const obj = {}
    for (const r of ROOMS) {
      const panel = roomEls.current[r.key]
      const els = panel ? [...panel.querySelectorAll(OBJECT[r.key])] : []
      if (!panel || !els.length) return `no ${r.key}`
      const pr = panel.getBoundingClientRect()
      const rs = els.map((e) => e.getBoundingClientRect()).filter((b) => b.width && b.height)
      if (!rs.length) return `empty ${r.key}`
      const l = Math.min(...rs.map((b) => b.left))
      const t = Math.min(...rs.map((b) => b.top))
      const rgt = Math.max(...rs.map((b) => b.right))
      const btm = Math.max(...rs.map((b) => b.bottom))
      // In the panel's own (unscaled) pixels, whatever transform it has now.
      const sx = W / pr.width
      const sy = H / pr.height
      obj[r.key] = { x: (l - pr.left) * sx, y: (t - pr.top) * sy, w: (rgt - l) * sx, h: (btm - t) * sy }
    }
    const floor = H * (W < 720 ? 0.72 : 0.8)
    const gap = W * (W < 720 ? 0.025 : 0.035)
    let F = H * (W < 720 ? 0.4 : 0.64) // the fridge's height on screen
    // Each object's footprint on the floor; the typewriter's is its desk, a bit wider than it.
    const foot = (key, f) => (obj[key].w / obj[key].h) * HEIGHT[key] * f * (SQUEEZE[key] || 1) * (key === 'typewriter' ? 1.25 : 1)
    const PLANT = 0.3 // a floor plant between the vending machine and the desk, this wide (fridge = 1)
    const TIGHT = 0.35 // the plant stands closer to its neighbours than the rooms do to each other
    const widthAt = (f) => ROOMS.reduce((sum, r) => sum + foot(r.key, f), 0) + PLANT * f + gap * (3 + TIGHT * 2)
    F = Math.min(F, (F * (W * 0.94)) / widthAt(F))
    // Keep the tallest thing clear of the title.
    const title = document.getElementById('overview-title')?.getBoundingClientRect()
    if (title) F = Math.min(F, (floor - (title.bottom - st.top) - 28) / 1.03)
    let x = (W - widthAt(F)) / 2
    const out = {}
    ROOMS.forEach((r, i) => {
      const o = obj[r.key]
      const h = HEIGHT[r.key] * F
      const k = h / o.h
      const sx = SQUEEZE[r.key] || 1
      const w = o.w * k * sx
      const fw = foot(r.key, F)
      const desk = r.key === 'typewriter' ? DESK * F : 0
      const ox0 = x + (fw - w) / 2
      const y = floor - desk - h
      out[r.key] = { ox: ox0 - i * W - o.x * k * sx, oy: y - o.y * k, k, sx, x: ox0, y, w, h, floor, fx: x, fw, desk }
      if (r.key === 'vending') {
        x += fw + gap * TIGHT
        out.plant = { x, w: PLANT * F, h: PLANT * F * 2.1 }
        x += PLANT * F + gap * TIGHT
      } else x += fw + gap
    })
    out.floor = floor
    out.F = F
    setLayout(out)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (import.meta.env.DEV) window.__measure = measureOverview
  // Arriving at the overview (first load, or back from a room): the objects wait
  // below the floor, then slide up into place one after another. No zoom-out.
  const [rising, setRising] = useState(true)
  useEffect(() => {
    if (!entrance) return
    setRising(true)
    const up = () => requestAnimationFrame(() => requestAnimationFrame(() => setRising(false)))
    const t1 = setTimeout(() => {
      const r = measureOverview()
      if (r && typeof r === 'object') up()
    }, 60)
    const t2 = setTimeout(() => {
      measureOverview()
      setRising(false)
    }, 600) // a retry, and a timer fallback for when frames aren't painting
    window.addEventListener('resize', measureOverview)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', measureOverview)
    }
  }, [entrance, measureOverview])
  const [jump, setJump] = useState(false) // cut to a room without the pan (from the entrance)
  const roomIdx = ROOMS.findIndex((r) => r.key === view)
  const goRoom = (key) => {
    if (key !== view) sfx('whoosh')
    setView(key)
  }
  const roomNav = (cls) => (
    <nav className={cls} aria-label="Rooms">
      {ROOMS.map((r) => (
        <button key={r.key} type="button" className="label room-link" aria-current={view === r.key ? 'location' : undefined} onClick={() => goRoom(r.key)}>
          {r.short}
        </button>
      ))}
    </nav>
  )
  // From the overview (all four rooms side by side), zoom into the one picked.
  // The logo steps back out to the overview (shutting any open drawer first).
  const toOverview = async () => {
    if (entrance) return
    setHeld(null)
    if (open || which.current) await runTo(0)
    sfx('whoosh')
    setEntrance('back') // 'back': the labels wait for the zoom-out to land
  }
  const pickRoom = (key) => {
    sfx('whoosh')
    setView(key)
    setEntrance(false)
  }

  // Everything loose in the drawers, in floor pixels.
  const spec = useRef(null)
  const items = useRef(null)
  const order = useRef(null)
  const itemEls = useRef({})
  const [flipped, setFlipped] = useState({})
  const [presenting, setPresenting] = useState(null)
  const [held, setHeld] = useState(null)
  const [touched, setTouched] = useState(false)
  const [junk, setJunk] = useState(() => ({
    'junk-die': { face: 1 + Math.floor(Math.random() * 6) },
    'junk-die2': { face: 1 + Math.floor(Math.random() * 6) },
    'junk-cookie': { cracked: false, fortune: 0 },
    'junk-top': { spinning: false },
  }))
  const raf = useRef(0)
  const grab = useRef(null)
  const suppressClick = useRef(false)

  if (!items.current) {
    const list = contents(m, projects)
    spec.current = Object.fromEntries(list.map((it) => [it.key, it]))
    const where = scatter(list, m)
    items.current = {}
    list.forEach((it) => {
      const w = where[it.key]
      items.current[it.key] = { x: w.x, y: w.y, r: w.r, rest: w.r, vx: 0, vy: 0, vr: 0, lift: 0 }
    })
    order.current = {}
    DRAWERS.forEach(({ key }) => {
      order.current[key] = list.filter((it) => it.drawer === key).sort((a, b) => a.layer - b.layer).map((it) => it.key)
    })
  }

  // ── Scene ────────────────────────────────────────────────────────────────
  const paintScene = useCallback(() => {
    const mm = mRef.current
    const { D, S, Hf, Mt, Mb, k0 } = mm
    const t = p.current
    const w = which.current
    const o = w ? easeInOut(t / 0.62) : 0
    const c = w ? easeInOut((t - 0.42) / 0.58) : 0
    const yf = D / 2 - S
    const faceBottom = zOf(DRAWERS.at(-1).key, mm) - 10 - Mb
    const faceTop = Hf - 10 + Mt
    const f0 = { y: yf + o * S * 0.5, z: (faceBottom + faceTop) / 2 }
    const fy = lerp(f0.y, 0, c)
    const fz = lerp(f0.z, w ? zOf(w, mm) : 0, c)
    const a = lerp(A0, 0, c)
    const k = lerp(k0, 1, c)
    if (worldRef.current)
      worldRef.current.style.transform = `scale(${k}) rotateX(${a}deg) translate3d(0px, ${-fy}px, ${-fz}px)`
    const cab = String(1 - clamp((c - 0.05) / 0.45))
    DRAWERS.forEach(({ key: d }) => {
      const od = d === w ? o : 0
      const el = drawerRefs.current[d]
      if (el) {
        el.style.transform = `translate3d(0px, ${-(1 - od) * S}px, ${zOf(d, mm)}px)`
        el.style.setProperty('--dim', d === w ? '1' : cab)
      }
      if (shadeRefs.current[d]) shadeRefs.current[d].style.opacity = String(1 - od)
    })
    cabinetRefs.current.forEach((el) => el && (el.style.opacity = cab))
  }, [])

  const paintItems = useCallback(() => {
    Object.entries(items.current).forEach(([key, s]) => {
      const el = itemEls.current[key]
      if (!el) return
      const sp = spec.current[key]
      const z = 0.8 + order.current[sp.drawer].indexOf(key) * 0.7 + s.lift * 26
      el.style.transform = `translate3d(${s.x - sp.w / 2}px, ${s.y - sp.h / 2}px, ${z}px) rotate(${s.r}deg)`
      el.style.setProperty('--lift', s.lift.toFixed(3))
      el.style.setProperty('--r', `${s.r.toFixed(1)}deg`)
    })
  }, [])

  useLayoutEffect(() => {
    paintScene()
    paintItems()
  }, [paintScene, paintItems, m])

  useEffect(() => {
    const onResize = () => {
      const prev = mRef.current
      const next = measure()
      Object.values(items.current).forEach((s) => {
        s.x = (s.x / prev.W) * next.W
        s.y = (s.y / prev.D) * next.D
      })
      setM(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Opening and closing ─────────────────────────────────────────────────
  const runTo = useCallback(
    async (to, d = which.current) => {
      if (!d) return
      which.current = d
      setPeek(null)
      const from = p.current
      setOpen(null)
      setMoving(d)
      if (from !== to) sfx(to > from ? 'drawerOpen' : 'drawerClose')
      if (from !== to) {
        if (prefersReducedMotion()) {
          p.current = to
          paintScene()
        } else {
          const dur = Math.abs(to - from) * (to > from ? 2300 : 1300) * (DUR.open / 720) // opening is unhurried, so you see it slide out
          await tween({
            duration: Math.max(250, dur),
            ease: bezier(0.3, 0, 0.2, 1),
            update: (e) => {
              p.current = lerp(from, to, e)
              paintScene()
            },
          })
        }
      }
      setMoving(null)
      if (to === 1) setOpen(d)
      else {
        which.current = null
        paintScene()
      }
    },
    [paintScene],
  )

  const closeDrawer = () => {
    setHeld(null)
    runTo(0)
  }

  // A drawer eases out a little under the pointer, so it reads as something to pull.
  const nudged = useRef(false)
  const onFrontEnter = (d) => () => {
    nudged.current = true
    if (!open && !moving && !pull.current) {
      setPeek(d)
      sfx('drawerPeek', { throttle: 250 })
    }
  }
  const onFrontLeave = (d) => () => setPeek((cur) => (cur === d ? null : cur))
  // On arrival, the top drawer shifts once, then settles: it moves, so pull it.
  useEffect(() => {
    if (startOpen || prefersReducedMotion() || entrance || view !== 'cabinet') return
    const t1 = setTimeout(() => !nudged.current && setPeek('work'), 1300)
    const t2 = setTimeout(() => !nudged.current && setPeek(null), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOpen, entrance])

  // Pull a drawer front: dragging down draws it out; release to finish.
  const pull = useRef(null)
  const onFrontDown = (d) => (e) => {
    if (open || moving || (e.pointerType === 'mouse' && e.button !== 0)) return
    which.current = d
    pull.current = { y0: e.clientY, p0: p.current, moved: false, id: e.pointerId }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* not capturable */
    }
  }
  const onFrontMove = (e) => {
    const g = pull.current
    if (!g || g.id !== e.pointerId) return
    const dy = e.clientY - g.y0
    if (Math.abs(dy) > 4) g.moved = true
    if (!g.moved) return
    setPeek(null)
    p.current = clamp(g.p0 + (dy / (mRef.current.mobile ? 240 : 320)) * 0.62, 0, 0.62)
    paintScene()
  }
  const onFrontUp = () => {
    const g = pull.current
    pull.current = null
    if (!g) return
    if (!g.moved || p.current > 0.06) runTo(1)
    else runTo(0)
  }

  // ── Physics for everything loose in the open drawer ─────────────────────
  const loop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const { W, D } = mRef.current
      let active = false
      Object.entries(items.current).forEach(([key, s]) => {
        const sp = spec.current[key]
        const isHeld = grab.current?.key === key && grab.current.dragging
        const edge = Math.min(sp.w, sp.h) * 0.42
        const bouncy = sp.sub === 'ball' || sp.sub === 'marble'
        const bounce = bouncy ? 0.82 : 0.25
        if (s.keys && stepKeys(key, dt, isHeld)) active = true
        if (!isHeld) {
          if (Math.abs(s.vx) + Math.abs(s.vy) > 2 || Math.abs(s.vr) > 0.5) {
            s.x += s.vx * dt
            s.y += s.vy * dt
            s.r += s.vr * dt
            const f = Math.exp(-dt * (bouncy ? 1.1 : 5.5)) // a lined drawer: plenty of friction, except for things that roll
            s.vx *= f
            s.vy *= f
            s.vr *= Math.exp(-dt * (bouncy ? 1.5 : 7))
            active = true
          } else {
            s.vx = s.vy = s.vr = 0
          }
          if (s.x < edge) (s.x = edge), (s.vx = Math.abs(s.vx) * bounce)
          if (s.x > W - edge) (s.x = W - edge), (s.vx = -Math.abs(s.vx) * bounce)
          if (s.y < edge) (s.y = edge), (s.vy = Math.abs(s.vy) * bounce)
          if (s.y > D - edge) (s.y = D - edge), (s.vy = -Math.abs(s.vy) * bounce)
          if (s.lift > 0) {
            s.lift = Math.max(0, s.lift - dt * 5)
            active = true
          }
        } else {
          s.lift = Math.min(1, s.lift + dt * 7)
          active = true
        }
      })
      paintItems()
      if (active || grab.current) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [paintItems])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // Whatever you pick up comes to the top of the pile, and stays there when dropped.
  const toTop = (key) => {
    const d = spec.current[key].drawer
    order.current[d] = [...order.current[d].filter((k) => k !== key), key]
  }

  // A torn-off sheet, crumpled into a ball, drops into the drawer where it landed.
  const [, setBalls] = useState(0)
  const crumple = useCallback(({ clientX, clientY }) => {
    const floor = floorRefs.current.work?.getBoundingClientRect()
    if (!floor) return
    const mm = mRef.current
    const key = `paperball-${Date.now()}`
    const [w, h] = PROPS.paperball.size
    spec.current[key] = { key, drawer: 'work', kind: 'prop', sub: 'paperball', w: w * mm.s, h: h * mm.s, layer: 2, rot: [0, 360], overlap: 1 }
    items.current[key] = {
      x: clamp(clientX - floor.left, 30, mm.W - 30),
      y: clamp(clientY - floor.top, 30, mm.D - 30),
      r: rand(0, 360),
      rest: 0,
      vx: rand(-160, 160),
      vy: rand(-160, 160),
      vr: rand(-200, 200),
      lift: 0.8,
    }
    order.current.work = [...order.current.work, key]
    setBalls((b) => b + 1)
    requestAnimationFrame(() => loop())
    setTimeout(() => loop(), 50)
  }, [loop])

  const onItemDown = (key) => (e) => {
    const sp = spec.current[key]
    if (!open || busy || presenting !== null || sp.drawer !== open || sp.kind === 'stain') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const s = items.current[key]
    const r = e.currentTarget.getBoundingClientRect()
    grab.current = {
      key,
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      ox: s.x,
      oy: s.y,
      dragging: false,
      last: { x: e.clientX, y: e.clientY },
      samples: [],
      el: e.currentTarget,
      rx: e.clientX - (r.left + r.width / 2), // where you took hold, from the centre
      ry: e.clientY - (r.top + r.height / 2),
    }
  }

  // Swing: carrying the ring accelerates it, and each key lags and swings about the
  // ring like a pendulum, twisting on its own long axis as it goes.
  const swing = (key, ax, ay, dt) => {
    const sp = spec.current[key]
    const bases = KEY_BASE[sp.sub]
    const s = items.current[key]
    if (!bases) return
    s.keys ||= bases.map(() => ({ a: 0, va: 0, t: 0, vt: 0 }))
    s.keys.forEach((k, i) => {
      const th = ((s.r + bases[i]) * Math.PI) / 180 + k.a
      // The inertial pull is opposite the ring's acceleration.
      const torque = (Math.cos(th) * -ay - Math.sin(th) * -ax) / KEY_LEN
      k.va = clamp(k.va + torque * dt, -12, 12)
      k.vt += (Math.hypot(ax, ay) / 9000) * dt * (i % 2 ? -1 : 1) * 20
    })
  }
  const paintKeys = (key) => {
    const s = items.current[key]
    const el = itemEls.current[key]
    if (!s?.keys || !el) return
    s.keys.forEach((k, i) => {
      el.style.setProperty(`--k${i}`, `${((k.a * 180) / Math.PI).toFixed(2)}deg`)
      el.style.setProperty(`--t${i}`, Math.max(0.28, Math.abs(Math.cos(k.t))).toFixed(3))
    })
  }
  const stepKeys = (key, dt, held) => {
    const s = items.current[key]
    if (!s.keys) return false
    let moving = false
    s.keys.forEach((k) => {
      k.a += k.va * dt
      k.va *= Math.exp(-dt * (held ? 3.4 : 14)) // on the lining, they stop quickly
      k.t += k.vt * dt
      k.vt += -k.t * (held ? 30 : 80) * dt
      k.vt *= Math.exp(-dt * (held ? 2 : 10))
      if (Math.abs(k.va) > 0.02 || Math.abs(k.vt) > 0.02 || Math.abs(k.t) > 0.01) moving = true
    })
    paintKeys(key)
    return moving
  }

  const onItemMove = (key) => (e) => {
    const g = grab.current
    if (!g || g.key !== key || g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    if (!g.dragging) {
      if (Math.hypot(dx, dy) < 5) return
      g.dragging = true
      sfx(spec.current[key].sub === 'housekeys' ? 'keys' : 'pick')
      // Pick up the birthday candle and it lights.
      if (spec.current[key].sub === 'candle' && !junk[key]?.lit) {
        sfx('crack')
        setJunk((j) => ({ ...j, [key]: { ...j[key], lit: true } }))
      }
      toTop(key)
      setTouched(true)
      loop()
      try {
        g.el.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
    }
    const s = items.current[key]
    const mx = e.clientX - g.last.x
    const my = e.clientY - g.last.y
    s.x = g.ox + dx
    s.y = g.oy + dy
    // Pulled by a point off-centre, it turns a little toward the pull.
    const w = Math.max(spec.current[key].w, 60)
    s.r += ((g.rx * my - g.ry * mx) / (w * w)) * 16
    g.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
    if (g.samples.length > 5) g.samples.shift()
    const dtm = Math.max(0.004, (e.timeStamp - (g.lastT ?? e.timeStamp - 16)) / 1000)
    const vx = mx / dtm
    const vy = my / dtm
    swing(key, (vx - (g.vx ?? 0)) / dtm, (vy - (g.vy ?? 0)) / dtm, dtm)
    // Googly eyes: the pupil lags behind the move.
    if (spec.current[key].sub === 'eye' && itemEls.current[key]) {
      itemEls.current[key].style.setProperty('--ex', `${clamp(-vx * 0.006, -5, 5)}px`)
      itemEls.current[key].style.setProperty('--ey', `${clamp(-vy * 0.006, -5, 5)}px`)
    }
    g.vx = vx
    g.vy = vy
    g.lastT = e.timeStamp
    g.last = { x: e.clientX, y: e.clientY }
    paintItems()
  }

  const onItemUp = (key) => (e) => {
    const g = grab.current
    if (!g || g.key !== key) return
    grab.current = null
    if (!g.dragging) return
    sfx(spec.current[key].sub === 'housekeys' ? 'keys' : 'drop')
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 0)
    const a = g.samples[0]
    const b = g.samples[g.samples.length - 1]
    const s = items.current[key]
    if (a && b && b.t > a.t && e.timeStamp - b.t < 80 && !prefersReducedMotion()) {
      s.vx = clamp(((b.x - a.x) / (b.t - a.t)) * 1000, -2600, 2600)
      s.vy = clamp(((b.y - a.y) / (b.t - a.t)) * 1000, -2600, 2600)
      const w = Math.max(spec.current[key].w, 60)
      s.vr = clamp(((g.rx * s.vy - g.ry * s.vx) / w ** 2) * 24, -120, 120)
      // A thrown die comes up with a new face.
      if (spec.current[key].sub === 'die' && Math.hypot(s.vx, s.vy) > 300) roll(key, false)
    }
    s.rest = s.r
    loop()
  }

  const onClickCapture = (e) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  // ── With a pen in hand: clicking anywhere (but the pad) sets it down there ──
  const onStageDownCapture = (e) => {
    if (!held || open !== 'work') return
    const t = e.target
    if (t.closest?.('.pad-canvas') || t.closest?.('.pad-corner')) return
    const floor = floorRefs.current.work.getBoundingClientRect()
    const key = `tool-${held}`
    const s = items.current[key]
    s.x = clamp(e.clientX - floor.left, 20, mRef.current.W - 20)
    s.y = clamp(e.clientY - floor.top, 20, mRef.current.D - 20)
    s.r = s.rest = rand(-40, 40) + (Math.random() < 0.5 ? 0 : 180)
    toTop(key)
    setHeld(null)
    paintItems()
    if (t.closest?.('.tool')) return // picking up another pen: let that click through
    e.stopPropagation()
    e.preventDefault()
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 350)
  }

  // Keyboard: arrows nudge the focused item, T turns it over.
  const onItemKey = (key) => (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
    if (k) {
      e.preventDefault()
      const s = items.current[key]
      s.x += k[0] * 24
      s.y += k[1] * 24
      s.rest = s.r
      toTop(key)
      loop()
    } else if ((e.key === 'Enter' || e.key === ' ') && spec.current[key].kind === 'office') {
      e.preventDefault()
      enlarge(key)
    } else if ((e.key === 't' || e.key === 'T') && ['card', 'polaroid', 'chip', 'specimen', 'type'].includes(spec.current[key].kind)) {
      e.preventDefault()
      turn(key)
    }
  }

  // Studio photos (not the team) enlarge rather than turn over.
  const [zoom, setZoom] = useState(null) // { key, item, from }
  const enlarge = (key) => {
    const el = itemEls.current[key]
    toTop(key)
    paintItems()
    sfx('pop')
    setZoom({ key, item: spec.current[key].office, from: el.getBoundingClientRect() })
  }

  const turn = (key) => {
    sfx('flip')
    toTop(key)
    paintItems()
    setFlipped((f) => ({ ...f, [key]: !f[key] }))
  }

  // ── The junk drawer's tricks ──
  const spinBy = (key, deg, ms) => {
    const s = items.current[key]
    const r0 = s.r
    toTop(key)
    return tween({
      duration: prefersReducedMotion() ? 1 : ms,
      ease: bezier(0.15, 0.6, 0.2, 1),
      update: (e) => {
        s.r = r0 + deg * e
        s.lift = Math.sin(e * Math.PI) * 0.5
        paintItems()
      },
    }).then(() => (s.rest = s.r))
  }
  const roll = (key, spin = true) => {
    const face = 1 + Math.floor(Math.random() * 6)
    sfx('roll')
    if (spin) spinBy(key, rand(420, 720) * (Math.random() < 0.5 ? -1 : 1), 650)
    setTimeout(() => setJunk((j) => ({ ...j, [key]: { face } })), prefersReducedMotion() ? 0 : spin ? 420 : 500)
  }
  const onPropClick = (key) => () => {
    const sp = spec.current[key]
    if (sp.drawer !== open) return
    if (sp.kind === 'tool') return sfx('pen'), setHeld((h) => (h === sp.sub ? null : sp.sub))
    if (sp.sub === 'die') return roll(key)
    if (sp.sub === 'top') {
      setJunk((j) => ({ ...j, [key]: { spinning: true } }))
      spinBy(key, 2160 + rand(0, 720), 3400).then(() => setJunk((j) => ({ ...j, [key]: { spinning: false } })))
      return
    }
    if (sp.sub === 'ball' || sp.sub === 'marble') {
      const s = items.current[key]
      const a = rand(0, Math.PI * 2)
      s.vx = Math.cos(a) * 1400
      s.vy = Math.sin(a) * 1400
      toTop(key)
      loop()
      return
    }
    if (sp.sub === 'tin') {
      toTop(key)
      paintItems()
      sfx('clink')
      setJunk((j) => ({ ...j, [key]: { opened: !j[key]?.opened } }))
      return
    }
    if (sp.sub === 'candle') {
      sfx(junk[key]?.lit ? 'unstick' : 'crack') // blown out, or struck
      setJunk((j) => ({ ...j, [key]: { ...j[key], lit: !j[key]?.lit } }))
      return
    }
    if (sp.sub === 'binder') {
      sfx('magnet')
      setJunk((j) => ({ ...j, [key]: { open: !j[key]?.open } }))
      return
    }
    if (sp.sub === 'eye') {
      // The pupil whirls round the dome and settles.
      const el = itemEls.current[key]
      sfx('roll')
      if (!el) return
      if (prefersReducedMotion()) return
      const turns = 3 + Math.random() * 2
      tween({
        duration: 1400,
        ease: (t) => 1 - (1 - t) ** 3,
        update: (e) => {
          const a = e * turns * Math.PI * 2
          const r = 5 * (1 - e * 0.6)
          el.style.setProperty('--ex', `${Math.cos(a) * r}px`)
          el.style.setProperty('--ey', `${Math.sin(a) * r}px`)
        },
      }).then(() => {
        el.style.setProperty('--ex', '0px')
        el.style.setProperty('--ey', '4px')
      })
      return
    }
    if (sp.sub === 'band' || sp.sub === 'band2') {
      // Twang: it stretches, lets go, and flies off across the drawer.
      sfx('tear')
      setJunk((j) => ({ ...j, [key]: { snap: true } }))
      setTimeout(() => setJunk((j) => ({ ...j, [key]: { snap: false } })), 260)
      const s = items.current[key]
      const a = rand(0, Math.PI * 2)
      s.vx = Math.cos(a) * 1800
      s.vy = Math.sin(a) * 1800
      toTop(key)
      loop()
      spinBy(key, rand(300, 700), 700)
      return
    }
    if (sp.sub === 'domino') {
      // Tip it over: a flip end over end.
      sfx('drop')
      spinBy(key, 180, 420)
      return
    }
    if (sp.sub === 'cookie') {
      toTop(key)
      paintItems()
      sfx('crack')
      setJunk((j) => {
        const c = j[key]
        return { ...j, [key]: c.cracked ? { cracked: true, fortune: (c.fortune + 1) % FORTUNES.length } : { cracked: true, fortune: Math.floor(Math.random() * FORTUNES.length) } }
      })
    }
  }

  // Pick a postcard up, square it to the view, then hand it to the case-study transition.
  const present = async (i) => {
    const key = projects[i].id
    if (open !== 'work' || busy || presenting !== null) return
    const s = items.current[key]
    setHeld(null)
    setPresenting(key)
    toTop(key)
    if (flipped[key]) {
      setFlipped((f) => ({ ...f, [key]: false }))
      await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : 520))
    }
    s.vx = s.vy = s.vr = 0
    const r0 = ((((s.r + 180) % 360) + 360) % 360) - 180
    s.r = r0
    if (!prefersReducedMotion()) {
      await tween({
        duration: 300,
        ease: bezier(0.3, 0, 0.2, 1),
        update: (e) => {
          s.r = lerp(r0, 0, e)
          s.lift = Math.sin(e * Math.PI) * 0.6
          paintItems()
        },
      })
    }
    s.r = 0
    s.lift = 0
    paintItems()
    onActiveChange(i)
    onOpen(i)
  }

  // After the case study closes, the card settles back to how it was lying.
  useEffect(() => {
    if (busy || presenting === null) return
    const key = presenting
    const s = items.current[key]
    const back = s.rest
    if (prefersReducedMotion()) {
      s.r = back
      paintItems()
      setPresenting(null)
      return
    }
    tween({
      duration: 520,
      ease: bezier(0.3, 0, 0.2, 1),
      update: (e) => {
        s.r = lerp(0, back, e)
        paintItems()
      },
    }).then(() => setPresenting(null))
  }, [busy, presenting, paintItems])

  // Escape puts a pen back down where it came from.
  useEffect(() => {
    if (!held) return
    const onKey = (e) => e.key === 'Escape' && setHeld(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [held])

  // Dev only: window.__drawer(0.5, 'studio') freezes an opening at any point.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__drawer = (v, d = 'work') => {
      which.current = v === 0 ? null : d
      p.current = v
      paintScene()
      setOpen(v === 1 ? d : null)
    }
  }, [paintScene])

  const { W, D, S, Hw, Hf, gap, M, Mt, Mb, cw, ch, toolL } = m
  const N = DRAWERS.length
  const yf = D / 2 - S
  const faceW = W + 2 * M
  const faceH = N * Hf + (N - 1) * gap + Mt + Mb
  const faceBottom = zOf(DRAWERS.at(-1).key, m) - 10 - Mb
  const frontW = W + 26 // a little wider than its opening, so a shut drawer shows no gap
  const panel = (w, h, transform, extra = {}) => ({
    width: `${w}px`,
    height: `${h}px`,
    marginLeft: `${-w / 2}px`,
    marginTop: `${-h / 2}px`,
    transform,
    ...extra,
  })
  // The cabinet face, with an opening for each drawer.
  const holeAt = (top) =>
    `${M - 9}px ${top}px, ${M - 9}px ${top + Hf + 4}px, ${M + W + 9}px ${top + Hf + 4}px, ${M + W + 9}px ${top}px, ${M - 9}px ${top}px`
  const holes = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${DRAWERS.map((_, i) => holeAt(Mt - 2 + i * (Hf + gap))).join(', 0 0, ')}, 0 0)`

  const n = projects.length
  const handlersFor = (key) => ({
    onPointerDown: onItemDown(key),
    onPointerMove: onItemMove(key),
    onPointerUp: onItemUp(key),
    onPointerCancel: onItemUp(key),
    onKeyDown: onItemKey(key),
    'data-presenting': presenting === key || undefined,
  })
  const boxStyle = (key) => ({ width: spec.current[key].w, height: spec.current[key].h })

  const subtitle = {
    work: `Projects · 001–${pad3(n)}`,
    studio: `The team · ${pad2(team.length)}`,
    archive: `Every brand · ${pad3(magnets.length)} cards`,
    specimens: 'Type, colour & marks',
    junk: 'Don’t look too closely',
  }
  const hint = {
    work: held
      ? `Drawing with the ${TOOLS[held].name.toLowerCase()} · click anywhere to set it down`
      : touched
        ? 'Click a card to open it · ↻ turns it over · pick up a pen to draw on the pad'
        : 'Move things around · click a card to open it',
    studio: 'Click us to turn us over · click a photo to see it up close · drag to move',
    archive: 'Flip through the cards · click a card for its work · type a letter to jump',
    specimens: 'Click a chip, type card or specimen to turn it over · drag to move',
    junk: 'Pick up the candle · spin the googly eye · open the tin · crack the cookie · roll the dice',
  }

  const renderItem = (key) => {
    const sp = spec.current[key]
    if (sp.kind === 'card') {
      const i = projects.findIndex((pr) => pr.id === key)
      const pr = projects[i]
      return (
        <Postcard
          key={key}
          ref={(el) => {
            cardEls.current[i] = el
            itemEls.current[key] = el
          }}
          buttonRef={(el) => (buttonEls.current[i] = el)}
          project={pr}
          flipped={!!flipped[key]}
          eager
          style={{ width: `${cw}px`, height: `${ch}px` }}
          onOpen={() => present(i)}
          onTurn={() => turn(key)}
          handlers={handlersFor(key)}
        />
      )
    }
    if (sp.kind === 'polaroid') {
      const t = team.find((x) => `team-${x.id}` === key)
      return (
        <Polaroid
          key={key}
          ref={(el) => (itemEls.current[key] = el)}
          person={t}
          flipped={!!flipped[key]}
          onTurn={() => turn(key)}
          style={{ width: Math.round(sp.w), height: sp.h }}
          handlers={handlersFor(key)}
        />
      )
    }
    if (sp.kind === 'tray')
      return (
        <div key={key} className="loose tray" ref={(el) => (itemEls.current[key] = el)} style={boxStyle(key)}>
          <IndexTray active={open === 'archive'} projects={projects} onOpenProject={(i, el) => (onActiveChange(i), onOpen(i, el))} />
        </div>
      )
    if (sp.kind === 'chip' || sp.kind === 'specimen' || sp.kind === 'type') {
      const mg = sp.mg
      const ink = sp.color?.hex || mg.color || '#111'
      const pi = mg.project ? projects.findIndex((p) => p.id === mg.project) : -1
      const go = (e) => {
        e.stopPropagation()
        sfx('pop')
        if (pi >= 0) (onActiveChange(pi), onOpen(pi, itemEls.current[key]))
        else if (mg.url) window.open(mg.url, '_blank', 'noopener')
      }
      const mark = <span className="spec-mark" style={{ '--mark': `url(${mg.src})`, background: ink, aspectRatio: `${mg.w} / ${mg.h}` }} aria-hidden="true" />
      return (
        <article
          key={key}
          ref={(el) => (itemEls.current[key] = el)}
          className={`polaroid postcard ${sp.kind === 'type' ? 'specimen type' : sp.kind}${flipped[key] ? ' is-flipped' : ''}`}
          style={{ ...boxStyle(key), '--pw': `${sp.w}px`, '--ink-c': ink }}
          aria-label={`${sp.kind === 'chip' ? `Colour chip: ${sp.color.name}` : sp.kind === 'type' ? 'Type specimen' : 'Specimen'}, ${mg.label}`}
          {...handlersFor(key)}
        >
          <div className="pc-turn">
            {sp.kind === 'chip' ? (
              <div className="pola-face chip-front">
                <span className="chip-colour" />
                <span className="chip-name">{sp.color.name}</span>
                <span className="label chip-hex">
                  {mg.label} · {sp.color.hex.toUpperCase()}
                </span>
              </div>
            ) : sp.kind === 'type' && sp.sp.aa ? (
              <div className="pola-face type-front has-aa">
                <span className="label spec-no">Type · {mg.label}</span>
                <img src={`${import.meta.env.BASE_URL}assets/${sp.sp.aa}`} alt={`A and a set in ${sp.sp.fonts[0].family}`} draggable={false} />
                <span className="type-aa-name">{sp.sp.fonts[0].family}</span>
                <span className="label type-meta">
                  {[sp.sp.fonts[0].style, sp.sp.fonts[0].foundry && `by ${sp.sp.fonts[0].foundry}`].filter(Boolean).join(' · ')}
                </span>
              </div>
            ) : sp.kind === 'type' ? (
              <div className="pola-face type-front">
                <span className="label spec-no">Type · {mg.label}</span>
                <span className="type-family">{sp.sp.fonts[0].family}</span>
                <span className="label type-meta">
                  {[sp.sp.fonts[0].style, sp.sp.fonts[0].foundry && `by ${sp.sp.fonts[0].foundry}`].filter(Boolean).join(' · ') || sp.sp.fonts[0].role}
                </span>
                {sp.sp.fonts.slice(1).map((f) => (
                  <span key={f.family} className="type-second">
                    + {f.family}
                    {f.style ? ` ${f.style}` : ''}
                  </span>
                ))}
                {sp.sp.line && <span className="type-line">“{sp.sp.line}”</span>}
              </div>
            ) : (
              <div className="pola-face spec-front">
                <span className="label spec-no">Specimen · {pad3((workOrder.indexOf(mg.id) + 1) || 0)}</span>
                {mark}
                <span className="spec-name">{mg.label}</span>
              </div>
            )}
            <div className="pola-face spec-back" onClick={() => flipped[key] && turn(key)}>
              {sp.kind === 'specimen' ? <span className="chip-colour" /> : mark}
              <span className="spec-name">{mg.label}</span>
              {sp.sp?.colors.length ? (
                <span className="spec-palette" aria-label="Palette">
                  {sp.sp.colors.map((c) => (
                    <span key={c.hex + c.name} style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                  ))}
                </span>
              ) : null}
              <span className="label spec-note">
                {sp.kind === 'chip'
                  ? `${sp.color.name} ${sp.color.hex.toUpperCase()}`
                  : sp.kind === 'type'
                    ? sp.sp.fonts.map((f) => `${f.family}${f.role ? ` (${f.role})` : ''}`).join(' · ')
                    : mg.color ? mg.color.toUpperCase() : 'Black'}
                {sp.sp?.deck ? ` · from the ${sp.sp.deck.replace(/ V\d+$/, '')}` : ''}
              </span>
              {(pi >= 0 || mg.url) && (
                <button type="button" className="label spec-go" onClick={go} tabIndex={flipped[key] ? 0 : -1}>
                  {pi >= 0 ? 'Case study →' : 'anchovies.agency ↗'}
                </button>
              )}
            </div>
          </div>
          <button type="button" className={`pola-button${flipped[key] ? ' is-behind' : ''}`} onClick={() => turn(key)} aria-label={`Turn over: ${mg.label}`} />
        </article>
      )
    }
    if (sp.kind === 'office') {
      const o = sp.office
      return (
        <article
          key={key}
          ref={(el) => (itemEls.current[key] = el)}
          className={`polaroid office postcard${flipped[key] ? ' is-flipped' : ''}`}
          style={{ ...boxStyle(key), '--pw': `${sp.w}px` }}
          aria-label={`${o.video ? 'Video Polaroid' : 'Polaroid'}: ${o.photo.alt}`}
          {...handlersFor(key)}
        >
          <div className="pc-turn">
            <div className="pola-face office-front">
              {o.video ? (
                <video
                  src={o.video}
                  poster={o.photo.src}
                  muted
                  loop
                  playsInline
                  autoPlay={!prefersReducedMotion()}
                  preload={prefersReducedMotion() ? 'none' : 'auto'}
                  aria-label={o.photo.alt}
                />
              ) : o.photo.src ? (
                <img src={o.photo.src} alt={o.photo.alt} draggable={false} />
              ) : (
                <div className="office-slot" aria-hidden="true">
                  <span className="label">{o.id.replace('slot-', '')}</span>
                  <span className="label">Photo to come</span>
                </div>
              )}
            </div>
            <div className="pola-face pola-back office-back">
              {o.caption && <p className="pola-line">{o.caption}</p>}
            </div>
          </div>
          <button type="button" className="pola-button" onClick={() => enlarge(key)} aria-label={`Enlarge: ${o.photo.alt}`} />
        </article>
      )
    }
    if (sp.kind === 'pad')
      return (
        <div key={key} className="loose pad" ref={(el) => (itemEls.current[key] = el)} style={boxStyle(key)} {...handlersFor(key)}>
          <Pad w={sp.w} h={sp.h} held={held} onCrumple={crumple} />
        </div>
      )
    if (sp.kind === 'stain')
      return (
        <div key={key} className="loose stain" ref={(el) => (itemEls.current[key] = el)} style={boxStyle(key)} aria-hidden="true">
          <CoffeeRing size={sp.w} />
        </div>
      )
    if (sp.kind === 'tool')
      return (
        <button
          key={key}
          type="button"
          className={`loose tool${held === sp.sub ? ' is-held' : ''}`}
          ref={(el) => (itemEls.current[key] = el)}
          style={boxStyle(key)}
          onClick={onPropClick(key)}
          aria-pressed={held === sp.sub}
          aria-label={`Pick up the ${TOOLS[sp.sub].name.toLowerCase()}`}
          {...handlersFor(key)}
        >
          <ToolGlyph kind={sp.sub} />
        </button>
      )
    // Props, some of which do something when clicked.
    const info = PROPS[sp.sub]
    const state = junk[key] || {}
    const acts = ['die', 'top', 'cookie', 'ball', 'marble', 'tin', 'eye', 'candle', 'binder', 'band', 'band2', 'domino'].includes(sp.sub) && sp.drawer === 'junk'
    return (
      <div
        key={key}
        className={`loose prop prop-${sp.sub}${state.spinning ? ' is-spinning' : ''}${state.lit ? ' is-lit' : ''}${state.snap ? ' is-snapping' : ''}${acts ? ' is-toy' : ''}`}
        ref={(el) => (itemEls.current[key] = el)}
        style={boxStyle(key)}
        role={acts ? 'button' : 'img'}
        tabIndex={acts ? 0 : -1}
        aria-label={`${info.label}${sp.sub === 'die' ? `, showing ${state.face}` : ''}${info.action ? `. ${info.action}` : ''}`}
        onClick={acts ? onPropClick(key) : undefined}
        {...handlersFor(key)}
        onKeyDown={(e) => {
          if (acts && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onPropClick(key)()
          } else onItemKey(key)(e)
        }}
      >
        <Glyph kind={sp.sub} state={state} />
        {sp.sub === 'cookie' && state.cracked && (
          <span className="fortune" role="status">
            {FORTUNES[state.fortune]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`drawer-index${receded ? ' is-receded' : ''}${busy ? ' is-busy' : ''}${open ? ' is-open' : ''}${held ? ' is-holding' : ''}`}
      style={{ '--cw': `${cw}px`, '--ch': `${ch}px` }}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <header className="index-top">
        <button type="button" className="brand" onClick={toOverview} title="Back to all four rooms">
          <img className="brand-lockup" src={agency.lockup.src} alt="Anchovies" width={agency.lockup.w} height={agency.lockup.h} />
        </button>
        <p className="label index-title">
          {view === 'cabinet' && open ? DRAWERS[indexOf(open)].title : ''}
        </p>
        <div className="top-right">
          {!open && !moving && !entrance && roomNav('room-nav')}
          <SoundToggle />
        </div>
      </header>

      <section
        ref={stageRef}
        className="drawer-stage"
        aria-label="The Anchovies cabinet"
        onClickCapture={onClickCapture}
        onPointerDownCapture={onStageDownCapture}
      >
        {entrance && layout && (
          <div className="overview-props" aria-hidden="true">
            {/* On the wall: Union Station over the cabinet (the studio's own shot), two small ones over the plant */}
            {(() => {
              const c = layout.cabinet
              const w = Math.min(c.w * 0.4, layout.F * 0.27)
              const h = w * 1.3
              return (
                <div className="ov-frame" style={{ left: c.x + c.w * 0.18, top: Math.max(8, c.y - h - layout.F * 0.16), width: w, height: h }}>
                  <img src={`${import.meta.env.BASE_URL}assets/team/office/IMG_4619-poster.webp`} alt="" />
                </div>
              )
            })()}
            {(() => {
              // Two small frames side by side, a little above the plant's leaves.
              const p = layout.plant
              const w = p.w * 0.42
              const h = w * 1.25
              const gap = w * 0.18
              const top = layout.floor - p.h - h * 1.35 - layout.F * 0.05
              const left = p.x + p.w / 2 - w - gap / 2
              return (
                <>
                  <div className="ov-frame is-small" style={{ left, top, width: w, height: h }}>
                    <img src={`${import.meta.env.BASE_URL}assets/team/office/IMG_3059.webp`} alt="" />
                  </div>
                  <div className="ov-frame is-small" style={{ left: left + w + gap, top: top + h * 0.35, width: w, height: h }}>
                    <img src={`${import.meta.env.BASE_URL}assets/team/office/IMG_4961.webp`} alt="" />
                  </div>
                </>
              )
            })()}
            {/* A small plant in a pot, on top of the cabinet */}
            <svg
              className="ov-plant"
              viewBox="0 0 80 100"
              style={{ left: layout.cabinet.x + layout.cabinet.w * 0.66, top: layout.cabinet.y - layout.F * 0.19, width: layout.F * 0.15, height: layout.F * 0.19 }}
            >
              {[
                'M40 62 C 30 50 18 44 8 44 C 20 50 30 56 38 64 Z',
                'M40 62 C 50 48 64 42 74 42 C 62 48 50 56 42 64 Z',
                'M40 62 C 34 44 34 26 42 12 C 44 28 44 46 42 62 Z',
                'M40 62 C 30 40 22 30 12 24 C 26 34 34 46 39 62 Z',
                'M41 62 C 50 42 58 32 70 26 C 58 36 50 48 43 62 Z',
              ].map((d, i) => (
                <path key={i} d={d} fill="url(#ov-leaf)" opacity={0.95 - (i % 2) * 0.1} />
              ))}
              <path d="M24 60 H56 L52 98 H28 Z" fill="#c98563" />
              <path d="M24 60 H56 L55 66 H25 Z" fill="#a8603f" />
            </svg>
            {/* A tall plant between the vending machine and the desk */}
            <svg
              className="ov-plant"
              viewBox="0 0 120 252"
              style={{ left: layout.plant.x, top: layout.floor - layout.plant.h, width: layout.plant.w, height: layout.plant.h }}
            >
              <defs>
                <linearGradient id="ov-pot" x1="0" x2="1">
                  <stop offset="0" stopColor="#3a3935" />
                  <stop offset=".45" stopColor="#5a5852" />
                  <stop offset="1" stopColor="#2e2d2a" />
                </linearGradient>
                <linearGradient id="ov-leaf" x1="0" x2="1">
                  <stop offset="0" stopColor="#2c5433" />
                  <stop offset=".5" stopColor="#4d8a4f" />
                  <stop offset="1" stopColor="#274a2c" />
                </linearGradient>
              </defs>
              {[
                'M60 176 C 50 130 26 86 10 40 C 30 80 50 120 64 172 Z',
                'M60 176 C 58 116 56 58 62 6 C 70 58 68 120 64 176 Z',
                'M62 176 C 74 128 94 88 110 50 C 98 92 80 132 66 178 Z',
                'M58 178 C 42 150 18 136 2 128 C 22 132 46 144 62 176 Z',
                'M64 178 C 82 152 102 142 118 136 C 100 146 84 158 66 180 Z',
                'M60 176 C 48 136 40 98 36 64 C 48 98 58 134 64 174 Z',
                'M62 176 C 76 138 84 104 90 74 C 86 110 76 142 66 176 Z',
              ].map((d, i) => (
                <path key={i} d={d} fill="url(#ov-leaf)" opacity={0.94 - (i % 3) * 0.08} />
              ))}
              <path d="M30 172 H90 L84 248 H36 Z" fill="url(#ov-pot)" />
              <rect x="26" y="166" width="68" height="10" rx="2" fill="#44433f" />
              <ellipse cx="60" cy="249" rx="28" ry="3" fill="rgba(0,0,0,.2)" />
            </svg>
            {/* The desk under the typewriter */}
            <div
              className="ov-desk"
              style={{ left: layout.typewriter.fx, top: layout.floor - layout.typewriter.desk, width: layout.typewriter.fw, height: layout.typewriter.desk }}
            >
              <span className="ov-desk-surface" />
              <span className="ov-desk-top" />
              <span className="ov-desk-leg is-l" />
              <span className="ov-desk-leg is-r" />
            </div>
          </div>
        )}
        <div className={`room is-${view}${jump ? ' is-jump' : ''}${entrance ? ' is-overview' : ''}${entrance && layout ? ' is-laid' : ''}${entrance && rising ? ' is-rising' : ''}`} style={{ '--room': roomIdx }}>
        <div className="room-cabinet" ref={(el) => (roomEls.current.cabinet = el)} style={layout && entrance ? { '--ox': `${layout.cabinet.ox}px`, '--oy': `${layout.cabinet.oy}px`, '--ok': layout.cabinet.k, '--i': 0, '--sx': layout.cabinet.sx } : undefined} aria-hidden={entrance || view !== 'cabinet' || undefined} inert={entrance || view !== 'cabinet' || undefined}>
        <div className="world" ref={worldRef}>
          <div
            className="cab cab-face"
            ref={(el) => (cabinetRefs.current[0] = el)}
            style={panel(faceW, faceH, `translate3d(0px, ${yf + 5}px, ${faceBottom + faceH / 2}px) rotateX(-90deg)`, { clipPath: holes })}
          />
          <div
            className="cab cab-top"
            ref={(el) => (cabinetRefs.current[1] = el)}
            style={panel(faceW, S + 60, `translate3d(0px, ${yf + 5 - (S + 60) / 2}px, ${Hf - 10 + Mt}px)`)}
          />
          <div
            className="cab cab-inside"
            ref={(el) => (cabinetRefs.current[2] = el)}
            style={panel(W + 32, faceH - Mt - Mb, `translate3d(0px, ${yf - S - 20}px, ${faceBottom + Mb + (faceH - Mt - Mb) / 2}px) rotateX(-90deg)`)}
          />

          {DRAWERS.map(({ key: d, title }) => (
            <div
              key={d}
              className="drawer"
              ref={(el) => (drawerRefs.current[d] = el)}
              data-drawer={d}
              data-live={open === d || undefined}
              data-peek={peek === d || undefined}
            >
              <div className="drawer-slide">
                <div className="drawer-floor" ref={(el) => (floorRefs.current[d] = el)} style={panel(W, D, 'translate3d(0px, 0px, 0px)')}>
                  <span className="drawer-shade" ref={(el) => (shadeRefs.current[d] = el)} aria-hidden="true" />
                  {order.current[d].map(renderItem)}
                </div>
                <div className="drawer-wall" style={panel(Hw, D, `translate3d(${-W / 2}px, 0px, ${Hw / 2}px) rotateY(90deg)`)} />
                <div className="drawer-wall" style={panel(Hw, D, `translate3d(${W / 2}px, 0px, ${Hw / 2}px) rotateY(-90deg)`)} />
                <div className="drawer-wall" style={panel(W, Hw, `translate3d(0px, ${-D / 2}px, ${Hw / 2}px) rotateX(-90deg)`)} />
                <div className="drawer-wall is-front-inner" style={panel(W, Hw, `translate3d(0px, ${D / 2}px, ${Hw / 2}px) rotateX(90deg)`)} />
                <button
                  type="button"
                  className="drawer-front"
                  style={panel(frontW, Hf + 10, `translate3d(0px, ${D / 2 + 4}px, ${Hf / 2 - 10}px) rotateX(-90deg)`)}
                  onPointerDown={onFrontDown(d)}
                  onPointerMove={onFrontMove}
                  onPointerUp={onFrontUp}
                  onPointerCancel={onFrontUp}
                  onPointerEnter={onFrontEnter(d)}
                  onPointerLeave={onFrontLeave(d)}
                  onFocus={onFrontEnter(d)}
                  onBlur={onFrontLeave(d)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      runTo(1, d)
                    }
                  }}
                  tabIndex={open || moving ? -1 : 0}
                  aria-label={`Open the drawer: ${title}`}
                >
                  <span className="label-holder">
                    <span className="label-card">
                      <span className="label-card-name">{title}</span>
                      <span className="label">{subtitle[d]}</span>
                    </span>
                  </span>
                  <span className="pull-wrap">
                    <span className="pull" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
        <div className="room-fridge" ref={(el) => (roomEls.current.fridge = el)} style={layout && entrance ? { '--ox': `${layout.fridge.ox}px`, '--oy': `${layout.fridge.oy}px`, '--ok': layout.fridge.k, '--i': 1 } : undefined} aria-hidden={entrance || view !== 'fridge' || undefined} inert={entrance || view !== 'fridge' || undefined}>
          <Fridge projects={projects} active={view === 'fridge'} onOpen={(i, el) => (onActiveChange(i), onOpen(i, el))} />
        </div>
        <div className="room-vending" ref={(el) => (roomEls.current.vending = el)} style={layout && entrance ? { '--ox': `${layout.vending.ox}px`, '--oy': `${layout.vending.oy}px`, '--ok': layout.vending.k, '--i': 2 } : undefined} aria-hidden={entrance || view !== 'vending' || undefined} inert={entrance || view !== 'vending' || undefined}>
          <RoomVending active={view === 'vending' && !hidden} onOpenProject={(i, el) => (onActiveChange(i), onOpen(i, el))} />
        </div>
        <div className="room-typewriter" ref={(el) => (roomEls.current.typewriter = el)} style={layout && entrance ? { '--ox': `${layout.typewriter.ox}px`, '--oy': `${layout.typewriter.oy}px`, '--ok': layout.typewriter.k, '--i': 3 } : undefined} aria-hidden={entrance || view !== 'typewriter' || undefined} inert={entrance || view !== 'typewriter' || undefined}>
          <RoomTypewriter active={view === 'typewriter' && !hidden} />
        </div>
        </div>
        {entrance && (
          <div
            className={`overview${entrance === 'back' ? ' is-back' : ''}`}
            role="group"
            aria-labelledby="overview-title"
            style={layout ? { '--floor': `${layout.fridge.y + layout.fridge.h}px` } : undefined}
          >
            <h1 id="overview-title" className="overview-title">
              Where to first?
            </h1>
            {ROOMS.map((r, i) => (
              <button
                key={r.key}
                type="button"
                className="overview-room"
                style={layout ? { '--i': i, left: layout[r.key].x, top: layout[r.key].y, width: layout[r.key].w, height: layout[r.key].h } : { '--i': i, visibility: 'hidden' }}
                onClick={() => pickRoom(r.key)}
                autoFocus={i === 0}
              >
                <span className="overview-label" style={layout ? { top: layout.floor - layout[r.key].y + 16 } : undefined}>
                  <span className="overview-name">{r.title}</span>
                  <span className="overview-what">{r.what}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer className="index-foot drawer-foot">
        <p className="label hint">
          {entrance
            ? 'Pick a room to step into'
            : view !== 'cabinet'
            ? ROOMS[roomIdx].hint
            : open
              ? hint[open]
              : m.mobile
                ? 'Pull a drawer open'
                : 'Pull a handle down, or click a drawer, to open it'}
        </p>
        <div className="drawer-actions">
          {view === 'cabinet' && open && (
            <button type="button" className="pill label" onClick={closeDrawer} disabled={busy}>
              <span aria-hidden="true">↑</span> Close drawer
            </button>
          )}
        </div>
      </footer>

      {!open && !moving && !entrance && roomNav('room-nav is-mobile')}
      {zoom && (
        <PhotoZoom
          item={zoom.item}
          from={zoom.from}
          onClose={() => {
            const k = zoom.key
            setZoom(null)
            itemEls.current[k]?.querySelector('.pola-button')?.focus({ preventScroll: true })
          }}
        />
      )}
      <HeldTool kind={held} length={toolL} />
      <PropDefs />
    </div>
  )
}
