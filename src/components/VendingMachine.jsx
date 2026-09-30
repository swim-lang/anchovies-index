import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ROWS, COLS, serviceByCode, DESCRIPTIONS_ARE_DRAFT } from '../content/services.js'
import { EASE_IN_OUT, EASE_OUT, prefersReducedMotion, settled } from '../motion/timing.js'
import '../styles/vending.css'
import { sfx } from '../motion/sound.js'
import { cssUrl } from '../lib/cssUrl.js'

/*
 * THE VENDING MACHINE
 * The studio's eighteen services (anchovies.agency/about), one per spiral.
 *   • type a code on the keypad or the keyboard (A–F, then 1–3), or click a pack
 *   • press Vend: the spiral turns a full revolution, the pack tips and drops
 *   • click the pickup flap to take it out: a spec sheet with the service, a
 *     draft description (marked as such), example projects that list that
 *     deliverable (thumbnails that open the case study via onOpenProject), the
 *     /work projects tagged with it, and a mailto to talk about it
 *
 * Props
 *   active         whether the room is on screen (keys are only heard then)
 *   onOpenProject  optional (projectIndex, el): open the case study for
 *                  projects[projectIndex] from projects.js; el is the clicked
 *                  thumbnail <img>. The card stays open underneath.
 * The machine is drawn at a fixed size (W × H) and scaled to fit its room.
 */

const W = 820 // the 640px cabinet, plus the floor to its right where the dish of coins stands, a step apart
const H = 1050
const MAIL = 'andy@anchovies.agency'
const FALL = 'cubic-bezier(0.5, 0, 0.9, 0.5)' // gravity: accelerates, never bounces
const VEND_MS = 2300
const MARK = cssUrl(`${import.meta.env.BASE_URL}assets/brand/anchovies-mark.png`)
// Coins leaning in the dish, back to front. The front one is the one you take.
const PILE = [
  { x: 0, y: 20, r: -14 },
  { x: 10, y: 24, r: 9 },
  { x: 20, y: 19, r: -5 },
  { x: 30, y: 22, r: 12 },
]

// A brass token struck with the two-fish mark: milled edge, raised rim, and the
// mark in relief (a highlight and a shadow either side of the fill).
function Token() {
  return (
    <span className="vm-token">
      <span className="vm-token-mark">
        <span className="vm-token-lo" />
        <span className="vm-token-hi" />
        <span className="vm-token-fill" />
      </span>
    </span>
  )
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3']

// A restrained set of printed stocks, arranged so no two neighbours match.
const TONES = [
  ['paper', 'ink', 'kraft'],
  ['stone', 'clay', 'paper'],
  ['ink', 'kraft', 'sage'],
  ['kraft', 'paper', 'stone'],
  ['sage', 'ink', 'clay'],
  ['paper', 'stone', 'ink'],
]
const look = (code) => {
  const r = ROWS.indexOf(code[0])
  const c = Number(code[1]) - 1
  return { tone: TONES[r][c], shape: (r + c) % 2 ? 'box' : 'bag', n: r * 3 + c + 1 }
}

const mailto = (s) =>
  `mailto:${MAIL}?subject=${encodeURIComponent(`${s.name} (from the Anchovies Index)`)}`

// ── the coil ───────────────────────────────────────────────────────────────
// Seen end-on: the front loop of wire, its cut end, and the loops behind it
// receding. Both halves turn together.
const R = 49
const C = 52
const pt = (deg, r = R) => {
  const a = (deg * Math.PI) / 180
  return [+(C + r * Math.cos(a)).toFixed(2), +(C + r * Math.sin(a)).toFixed(2)]
}
const A0 = 62
const [X0, Y0] = pt(A0)
const [X1, Y1] = pt(A0 + 338)
const [XB, YB] = pt(A0 - 26, R * 0.9)
const FRONT = `M${X0} ${Y0} A${R} ${R} 0 1 1 ${X1} ${Y1}`
const RUN_BACK = `M${X0} ${Y0} L${XB} ${YB}`

// Loops further back sit a touch higher (the eye is a little above the shelf)
// and a little smaller, so the spiral reads as running away from the glass.
const LOOPS = [1, 2, 3].map((k) => ({ cy: C - 2.2 * k, r: R * (1 - 0.045 * k), o: 0.5 - 0.13 * k }))

function Coil({ side, innerRef }) {
  if (side === 'back') {
    return (
      <svg className="vm-coil vm-coil--back" viewBox="0 0 104 104" aria-hidden="true" focusable="false">
        {LOOPS.map((l) => (
          <circle key={l.cy} cx={C} cy={l.cy} r={l.r} className="vm-wire vm-wire--far" style={{ opacity: l.o }} />
        ))}
        <g ref={innerRef} className="vm-coil-turn">
          <path d={RUN_BACK} className="vm-wire vm-wire--far" />
        </g>
      </svg>
    )
  }
  return (
    <svg ref={innerRef} className="vm-coil vm-coil--front" viewBox="0 0 104 104" aria-hidden="true" focusable="false">
      <path d={FRONT} className="vm-wire vm-wire--shadow" />
      <path d={FRONT} className="vm-wire" />
      <circle cx={X1} cy={Y1} r="1.9" className="vm-wire-end" />
    </svg>
  )
}

// ── the pack ───────────────────────────────────────────────────────────────
function Pack({ s, innerRef }) {
  const { tone, shape } = look(s.code)
  return (
    <span ref={innerRef} className={`vm-pack vm-pack--${shape} vm-tone--${tone}`} aria-hidden="true">
      <span className="vm-pack-code">{s.code}</span>
      <span className="vm-pack-name">{s.name}</span>
    </span>
  )
}

export default function VendingMachine({ active = true, onOpenProject }) {
  const [scale, setScale] = useState(0.6)
  const [code, setCode] = useState('')
  const [note, setNote] = useState(null) // a transient LED message
  const [phase, setPhase] = useState('idle') // idle | vending
  const [trayItem, setTrayItem] = useState(null)
  const [emptySlot, setEmptySlot] = useState(null)
  const [flapOpen, setFlapOpen] = useState(false)
  const [card, setCard] = useState(null)
  const [down, setDown] = useState(null) // key shown pressed
  const [credit, setCredit] = useState(false) // a coin is in
  const [coin, setCoin] = useState('ledge') // ledge: a coin is waiting in the dish | gone: it's in the machine
  const [coinUsed, setCoinUsed] = useState(false) // stops the glint hint after the first coin

  const roomRef = useRef(null)
  const cabinetRef = useRef(null)
  const trayRef = useRef(null)
  const flapRef = useRef(null)
  const cardRef = useRef(null)
  const packRefs = useRef({})
  const coilRefs = useRef({})
  const coinRef = useRef(null)
  const slotRef = useRef(null)
  const firstKeyRef = useRef(null)
  const coinBusy = useRef(false)
  const coinArrives = useRef(false)
  const drag = useRef(null)
  const timers = useRef({})
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  // Latest state for handlers that outlive a render (keyboard, async vend).
  const st = useRef({})
  st.current = { code, phase, trayItem, card, emptySlot, credit, coin }

  // Update the ref at once too, so keys pressed faster than React renders
  // still see the latest code, credit and phase.
  const now = (key, set) => (v) => {
    st.current[key] = typeof v === 'function' ? v(st.current[key]) : v
    set(st.current[key])
  }
  const setCodeNow = now('code', setCode)
  const setCreditNow = now('credit', setCredit)
  const setPhaseNow = now('phase', setPhase)

  const later = (name, fn, ms) => {
    clearTimeout(timers.current[name])
    timers.current[name] = setTimeout(fn, ms)
  }
  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  // ── fit the machine to the room ──
  useLayoutEffect(() => {
    const el = roomRef.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      const padX = w < 560 ? 32 : 64
      const s = Math.min((w - padX) / W, (h - 32) / H, 1.15)
      setScale(Math.max(0.2, +s.toFixed(4)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const flash = useCallback((msg, ms = 1900) => {
    setNote(msg)
    later('note', () => setNote(null), ms)
  }, [])

  const showDown = (k) => {
    setDown(k)
    later('down', () => setDown(null), 140)
  }

  // ── keypad ──
  const press = useCallback(
    (ch) => {
      showDown(ch)
      sfx('button')
      const { code: cur, phase: ph, credit: paid } = st.current
      if (ph === 'vending') return
      if (!paid) {
        flash('INSERT COIN')
        return
      }
      setNote(null)
      if (/^[A-F]$/.test(ch)) {
        setCodeNow(ch)
        return
      }
      if (!cur) {
        flash('LETTER FIRST, A–F')
        return
      }
      const next = cur[0] + ch
      if (!serviceByCode[next]) {
        flash(`NO ${next}. NUMBERS 1–3`)
        return
      }
      setCodeNow(next)
    },
    [flash]
  )

  const back = useCallback(() => {
    showDown('CLR')
    if (st.current.phase === 'vending') return
    setNote(null)
    setCodeNow((c) => c.slice(0, -1))
  }, [])

  const clear = useCallback(() => {
    showDown('CLR')
    if (st.current.phase === 'vending') return
    setNote(null)
    setCodeNow('')
  }, [])

  const choose = useCallback(
    (c) => {
      if (st.current.phase === 'vending') return
      if (!st.current.credit) {
        flash(`${c} · INSERT COIN FIRST`)
        return
      }
      setNote(null)
      setCodeNow(c)
    },
    [flash]
  )

  // ── vend ──
  const vend = useCallback(async () => {
    showDown('VEND')
    const { code: cur, phase: ph, trayItem: inTray, card: open, credit: paid } = st.current
    if (ph === 'vending') return
    if (inTray || open) {
      flash('PLEASE TAKE YOUR ITEM FIRST')
      return
    }
    if (!paid) {
      flash('INSERT COIN')
      return
    }
    if (cur.length < 2) {
      flash(cur ? 'NOW A NUMBER, 1–3' : 'ENTER A CODE FIRST')
      return
    }
    const s = serviceByCode[cur]
    if (!s) {
      flash('NO SUCH CODE')
      return
    }

    sfx('whirr')
    setNote(null)
    setCreditNow(false) // the coin is spent
    setPhaseNow('vending')
    const pack = packRefs.current[s.code]
    const coils = coilRefs.current[s.code] || []
    const reduce = prefersReducedMotion()

    if (!reduce && pack && cabinetRef.current) {
      const k = scaleRef.current || 1
      const cab = cabinetRef.current.getBoundingClientRect()
      const pr = pack.getBoundingClientRect()
      const fall = Math.round((cab.bottom - pr.top) / k + 30)
      const slot = pack.closest('.vm-slot')
      slot?.classList.add('is-dropping')

      const turn = coils.filter(Boolean).map((el) =>
        el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
          duration: VEND_MS * 0.58,
          easing: EASE_IN_OUT,
        })
      )
      const p = 'perspective(420px)'
      const drop = pack.animate(
        [
          { offset: 0, transform: `${p} translateY(0) scale(1) rotateX(0deg)`, easing: EASE_IN_OUT },
          { offset: 0.56, transform: `${p} translateY(2px) scale(1.06) rotateX(0deg)`, easing: EASE_OUT },
          { offset: 0.7, transform: `${p} translateY(5px) scale(1.07) rotateX(-30deg)`, easing: FALL },
          { offset: 1, transform: `${p} translateY(${fall}px) scale(1.07) rotateX(-72deg)` },
        ],
        { duration: VEND_MS, fill: 'forwards' }
      )
      await settled([drop, ...turn], VEND_MS)
      pack.style.visibility = 'hidden'
      drop.cancel()
      slot?.classList.remove('is-dropping')
    } else if (pack) {
      pack.style.visibility = 'hidden'
    }

    setEmptySlot(s.code)
    setTrayItem(s)
    setCodeNow('')
    setPhaseNow('idle')
    sfx('thud')
    // A fresh coin drops into the coin return, ready for the next go.
    later('coin', () => {
      coinArrives.current = true
      setCoin('ledge')
    }, reduce ? 0 : 900)
    if (!reduce && trayRef.current) {
      trayRef.current.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(1.5px)' }, { transform: 'translateY(0)' }],
        { duration: 220, easing: EASE_OUT }
      )
    }
  }, [flash])

  // ── the coin ──
  // Click it (or press Enter/Space) and it rolls into the slot; or drag it there.
  const insertCoin = useCallback(async (from) => {
    const s = st.current
    if (s.credit || s.coin !== 'ledge' || coinBusy.current) return
    coinBusy.current = true
    const el = coinRef.current
    const slot = slotRef.current
    const hadFocus = el && document.activeElement === el
    if (!prefersReducedMotion() && el && slot) {
      const k = scaleRef.current || 1
      const cur = from || { x: 0, y: 0 }
      const er = el.getBoundingClientRect()
      const sr = slot.getBoundingClientRect()
      const dx = (sr.left + sr.width / 2 - (er.left + er.width / 2)) / k + cur.x
      const dy = (sr.top + sr.height / 2 - (er.top + er.height / 2)) / k + cur.y
      if (!from) sfx('roll')
      const spin = from ? 0 : -540
      const a = el.animate(
        [
          { offset: 0, transform: `translate(${cur.x}px, ${cur.y}px) rotate(0deg) scaleX(1)`, easing: EASE_OUT },
          { offset: 0.66, transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scaleX(1)`, easing: EASE_IN_OUT },
          { offset: 0.82, transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scaleX(0.16)`, opacity: 1 },
          { offset: 1, transform: `translate(${dx}px, ${dy + 12}px) rotate(${spin}deg) scaleX(0.16)`, opacity: 0 },
        ],
        { duration: from ? 560 : 1150, fill: 'forwards' }
      )
      await settled([a], 1150)
    }
    sfx('clink')
    setCoinUsed(true)
    setCoin('gone')
    setCreditNow(true)
    setNote(null)
    coinBusy.current = false
    if (hadFocus) requestAnimationFrame(() => firstKeyRef.current?.focus({ preventScroll: true }))
  }, [])

  const coinDown = (e) => {
    if (st.current.credit || coinBusy.current || e.button > 0) return
    drag.current = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false, id: e.pointerId }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* fine without capture */
    }
  }
  const coinMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const k = scaleRef.current || 1
    d.dx = (e.clientX - d.x0) / k
    d.dy = (e.clientY - d.y0) / k
    if (!d.moved && Math.hypot(d.dx, d.dy) > 4) d.moved = true
    if (d.moved) e.currentTarget.style.transform = `translate(${d.dx}px, ${d.dy}px)`
  }
  const coinUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.moved) return
    d.suppress = true
    drag.current = { suppress: true }
    const el = e.currentTarget
    const sr = slotRef.current?.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    const k = scaleRef.current || 1
    const near =
      sr && Math.hypot(sr.left + sr.width / 2 - (er.left + er.width / 2), sr.top + sr.height / 2 - (er.top + er.height / 2)) / k < 34
    if (near) {
      el.style.transform = ''
      insertCoin({ x: d.dx, y: d.dy })
    } else {
      // Not quite: it slides back to the ledge.
      el.style.transform = ''
      if (!prefersReducedMotion()) {
        el.animate([{ transform: `translate(${d.dx}px, ${d.dy}px)` }, { transform: 'translate(0, 0)' }], {
          duration: 420,
          easing: EASE_OUT,
        })
      }
    }
  }
  const coinClick = () => {
    if (drag.current?.suppress) {
      drag.current = null
      return
    }
    insertCoin()
  }

  // After each vend a new coin slides onto the front of the pile.
  useLayoutEffect(() => {
    if (coin !== 'ledge' || !coinArrives.current) return
    coinArrives.current = false
    sfx('clink')
    if (prefersReducedMotion() || !coinRef.current) return
    coinRef.current.animate(
      [
        { transform: 'translateY(-22px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 520, easing: EASE_OUT }
    )
  }, [coin])

  // ── the pickup flap and the card ──
  const take = useCallback(() => {
    const { trayItem: item, phase: ph } = st.current
    if (ph === 'vending') {
      flash('ONE MOMENT…', 1200)
      return
    }
    if (!item) {
      flash('THE TRAY IS EMPTY')
      return
    }
    setFlapOpen(true)
    sfx('flap')
    later('card', () => {
      setCard(item)
      setTrayItem(null)
    }, prefersReducedMotion() ? 0 : 300)
  }, [flash])

  const restock = (c) => {
    const pack = c && packRefs.current[c]
    setEmptySlot(null)
    if (!pack) return
    pack.style.visibility = ''
    if (!prefersReducedMotion()) {
      pack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300, easing: EASE_OUT, fill: 'backwards' })
    }
  }

  const closeCard = useCallback(() => {
    setCard(null)
    setFlapOpen(false)
    restock(st.current.emptySlot)
    requestAnimationFrame(() => flapRef.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (card) cardRef.current?.focus({ preventScroll: true })
  }, [card])

  // Keep Tab inside the open card.
  const trapTab = (e) => {
    if (e.key !== 'Tab') return
    const f = [...e.currentTarget.querySelectorAll('a[href], button')]
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    const at = document.activeElement
    if (e.shiftKey && (at === first || at === e.currentTarget)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && at === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // ── keyboard, only while the room is on screen ──
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const k = e.key
      if (st.current.card) {
        if (k === 'Escape') {
          e.preventDefault()
          closeCard()
        }
        return
      }
      if (/^[a-f]$/i.test(k)) {
        e.preventDefault()
        press(k.toUpperCase())
      } else if (/^[0-9]$/.test(k)) {
        e.preventDefault()
        press(k)
      } else if (k === 'Enter') {
        if (t && /^(BUTTON|A)$/.test(t.tagName)) return // let the focused control act
        e.preventDefault()
        vend()
      } else if (k === 'Backspace') {
        e.preventDefault()
        back()
      } else if (k === 'Escape' && st.current.code) {
        clear()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, press, vend, back, clear, closeCard])

  // ── the LED ──
  const selected = code.length === 2 ? serviceByCode[code] : null
  let msg
  if (note) msg = note
  else if (phase === 'vending') msg = 'VENDING…'
  else if (trayItem) msg = 'TAKE YOUR ITEM BELOW'
  else if (card) msg = 'THANK YOU'
  else if (selected) msg = `${selected.name.toUpperCase()} · PRESS VEND`
  else if (code) msg = 'NOW A NUMBER, 1–3'
  else if (!credit) msg = 'INSERT COIN'
  else msg = 'ENTER A CODE'
  const shown = (code + '__').slice(0, 2)

  return (
    <div className="vm-room" ref={roomRef} style={{ '--vm-mark': MARK }}>
      <svg className="vm-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="vm-wire-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f4f1" />
            <stop offset="0.35" stopColor="#a9a9a5" />
            <stop offset="0.55" stopColor="#ecece8" />
            <stop offset="1" stopColor="#7d7d79" />
          </linearGradient>
        </defs>
      </svg>

      <div className="vm-stage" style={{ width: W * scale, height: H * scale }}>
        <div className="vm" lang="en" style={{ transform: `scale(${scale})` }} role="group" aria-label="Services vending machine">
          <div className="vm-body" aria-hidden="true" />

          <div className="vm-sign">
            <span className="label">Anchovies · Denver</span>
            <span className="vm-sign-title">Services</span>
            <span className="label">A1–F3</span>
          </div>

          {/* the window */}
          <div className="vm-window">
            <div className="vm-cabinet" ref={cabinetRef}>
              <div className="vm-light" aria-hidden="true" />
              <div className="vm-rows">
                {ROWS.map((r) => (
                  <div className="vm-row" key={r} role="group" aria-label={`Row ${r}`}>
                    {COLS.map((c) => {
                      const s = serviceByCode[r + c]
                      const on = code === s.code
                      return (
                        <div className={`vm-slot${on ? ' is-selected' : ''}`} key={s.code}>
                          <Coil
                            side="back"
                            innerRef={(el) => ((coilRefs.current[s.code] ||= [])[0] = el)}
                          />
                          <button
                            type="button"
                            className="vm-pack-btn"
                            onClick={() => choose(s.code)}
                            aria-label={`${s.code}, ${s.name}. Select this code`}
                            aria-pressed={on}
                            disabled={emptySlot === s.code}
                          >
                            <Pack s={s} innerRef={(el) => (packRefs.current[s.code] = el)} />
                          </button>
                          <Coil
                            side="front"
                            innerRef={(el) => ((coilRefs.current[s.code] ||= [])[1] = el)}
                          />
                          <span className="vm-tag" aria-hidden="true">
                            {s.code}
                          </span>
                        </div>
                      )
                    })}
                    <span className="vm-shelf" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
            <div className="vm-glass" aria-hidden="true" />
          </div>

          {/* the control panel */}
          <div className="vm-panel">
            <div className="vm-led" role="status" aria-live="polite" aria-atomic="true">
              <span className="sr-only">{code ? `Code ${code}. ` : ''}</span>
              <span className="vm-led-code" aria-hidden="true">
                {shown}
              </span>
              <span className="vm-led-msg">{msg}</span>
            </div>

            <div className="vm-keypad" role="group" aria-label="Keypad">
              {KEYS.map((k) => (
                <button
                  type="button"
                  key={k}
                  ref={k === 'A' ? firstKeyRef : undefined}
                  className={`vm-key${down === k ? ' is-down' : ''}`}
                  onClick={() => press(k)}
                  aria-label={`Key ${k}`}
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                className={`vm-key vm-key--clr${down === 'CLR' ? ' is-down' : ''}`}
                onClick={clear}
                aria-label="Clear code"
              >
                CLR
              </button>
              <button
                type="button"
                className={`vm-key vm-key--vend${down === 'VEND' ? ' is-down' : ''}`}
                onClick={vend}
                aria-label={selected ? `Vend ${selected.code}, ${selected.name}` : 'Vend'}
                disabled={phase === 'vending'}
              >
                Vend
              </button>
            </div>
            <p className="vm-hint label">Coin, letter, number, vend</p>

            <div className={`vm-coin${credit ? ' has-credit' : ''}`}>
              <span className="vm-coin-slot" ref={slotRef} aria-hidden="true" />
              <span className="vm-coin-text" aria-hidden="true">
                {credit ? 'Credit 1' : 'Insert'}
                <br />
                {credit ? 'Thank you' : 'coin'}
              </span>
              <span className="vm-coin-return" aria-hidden="true" />
            </div>
          </div>

          {/* the pickup */}
          <div className="vm-tray" ref={trayRef}>
            <div className="vm-tray-cavity">
              {trayItem && (
                <span className="vm-tray-item">
                  <Pack s={trayItem} />
                </span>
              )}
            </div>
            <button
              type="button"
              ref={flapRef}
              className={`vm-flap${flapOpen ? ' is-open' : ''}${trayItem ? ' has-item' : ''}`}
              onClick={take}
              aria-label={trayItem ? `Pickup flap: take out ${trayItem.name}` : 'Pickup flap (empty)'}
            >
              <span className="label">Push</span>
            </button>
          </div>

          <div className="vm-plate" aria-hidden="true">
            <span className="vm-lock" />
            <span className="label">The Anchovies Index</span>
          </div>

          <span className="vm-foot vm-foot--l" aria-hidden="true" />
          <span className="vm-foot vm-foot--r" aria-hidden="true" />

          {/* a dish of coins on the floor, by the coin slot */}
          <div className={`vm-dish${coinUsed ? '' : ' has-hint'}`}>
            <span className="vm-dish-back" aria-hidden="true" />
            {PILE.slice(0, coin === 'ledge' ? PILE.length : PILE.length - 1).map((c, i, list) => {
              const style = { left: c.x, bottom: c.y, '--r': `${c.r}deg` }
              return coin === 'ledge' && i === list.length - 1 ? (
                <button
                  key={i}
                  type="button"
                  ref={coinRef}
                  className="vm-coin-btn"
                  style={style}
                  aria-label="Insert coin"
                  onClick={coinClick}
                  onPointerDown={coinDown}
                  onPointerMove={coinMove}
                  onPointerUp={coinUp}
                  onPointerCancel={coinUp}
                >
                  <Token />
                </button>
              ) : (
                <span key={i} className="vm-coin-rest" style={style} aria-hidden="true">
                  <Token />
                </span>
              )
            })}
            <span className="vm-dish-front" aria-hidden="true">
              <span className="label">Take one</span>
            </span>
          </div>
        </div>
      </div>

      {card && (
        <div className="vm-card-layer">
          <div className="vm-scrim" onClick={closeCard} aria-hidden="true" />
          <div
            className={`vm-card${card.examples.length || card.projects.length ? '' : ' vm-card--solo'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vm-card-title"
            tabIndex={-1}
            ref={cardRef}
            onKeyDown={trapTab}
          >
            <header className="vm-card-head label">
              <span>The Anchovies Index</span>
              <span>Service sheet</span>
            </header>

            <div className="vm-card-main">
              <p className="vm-card-code" aria-hidden="true">
                {card.code}
              </p>
              <h2 className="vm-card-title" id="vm-card-title">
                <span className="sr-only">{card.code}: </span>
                {card.name}
              </h2>
              {card.description && (
                <div className="vm-card-about">
                  {DESCRIPTIONS_ARE_DRAFT && <p className="vm-card-draft label">Draft description, for review</p>}
                  <p className="vm-card-desc">{card.description}</p>
                </div>
              )}
            </div>

            {(card.examples.length > 0 || card.projects.length > 0) && (
              <div className="vm-card-side">
                {card.examples.length > 0 && (
                  <section className="vm-card-examples" aria-label="Examples">
                    <p className="label">Examples</p>
                    <ul className={`vm-ex-grid vm-ex-grid--${card.examples.length}`}>
                      {card.examples.map((ex) => {
                        const pic = (
                          <>
                            <span className="vm-ex-img">
                              <img src={ex.image.src} alt="" loading="lazy" decoding="async" />
                            </span>
                            <span className="vm-ex-text">
                              <span className="vm-ex-name">{ex.name}</span>
                              {ex.caption && <span className="vm-ex-cap label">{ex.caption}</span>}
                            </span>
                          </>
                        )
                        return (
                          <li key={ex.id}>
                            {onOpenProject ? (
                              <button
                                type="button"
                                className="vm-ex"
                                aria-label={`Open the ${ex.name} case study`}
                                onClick={(e) =>
                                  onOpenProject(ex.projectIndex, e.currentTarget.querySelector('img') || e.currentTarget)
                                }
                              >
                                {pic}
                              </button>
                            ) : (
                              <div className="vm-ex">{pic}</div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )}

                {card.projects.length > 0 && (
                  <section className="vm-card-work" aria-label={`Projects tagged ${card.workTag}`}>
                    <p className="label">
                      Tagged “{card.workTag}” on anchovies.agency/work · {card.projects.length}
                    </p>
                    <ul className="vm-card-list">
                      {card.projects.map((p) => (
                        <li key={p.slug}>
                          <a href={`https://anchovies.agency/work/${p.slug}`} target="_blank" rel="noopener noreferrer">
                            {p.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            <footer className="vm-card-foot">
              <p className="vm-card-source label">Service name listed on anchovies.agency/about</p>
              <div className="vm-card-actions">
                <a className="vm-card-cta" href={mailto(card)}>
                  Talk to us about this
                </a>
                <button type="button" className="vm-card-done" onClick={closeCard}>
                  Close
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
