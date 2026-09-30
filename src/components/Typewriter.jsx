import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import '../styles/typewriter.css'
import { sfx } from '../motion/sound.js'

/*
 * THE TYPEWRITER (contact room)
 * A black enamel desk typewriter seen from the front and a little above.
 *   • type on the real keyboard (or the keys on screen) and it types on the sheet
 *   • the carriage steps left with each character; Return or the lever feeds a line
 *   • "Pull the sheet & send" lifts the sheet out and opens a mailto in the
 *     visitor's own mail client. Nothing is sent from here.
 * A visually hidden <textarea> holds the text, so screen readers and phone
 * keyboards work; the paper is drawn from its value.
 */

const EMAIL = 'andy@anchovies.agency'
const SUBJECT = 'Hello from the Index'
const CAL = 'https://cal.com/anchovies/30min?overlayCalendar=true'

const PREFIX = 'To: Anchovies\n' // kept on the sheet
const START = PREFIX + 'From: '
const MAX_CHARS = 2400 // keeps the mailto URL a sensible length

// Stage geometry, in px at scale 1.
const W = 820
const H = 800
const H_FIT = 700 // the top 100px is headroom for the rising sheet, allowed to crop
const CX = 410 // the printing point, horizontally
const SY = 334 // …and the baseline of the line being typed
const PAD_TOP = 44 // top margin on the sheet
const WIDE = { cols: 40, fs: 14, lh: 22, fit: W }
const NARROW = { cols: 28, fs: 16, lh: 24, fit: 560 } // phones: fewer, larger characters

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
]
const KEY_INDEX = Object.fromEntries(ROWS.flat().map((k, i) => [k, i]))

// Key positions on the stage.
const PITCH = 42
const ROW_Y = [490, 536, 582, 628]
const STAGGER = [-12, 0, 8, 18]
const KEYS = []
ROWS.forEach((row, r) => {
  const x0 = CX - ((row.length - 1) * PITCH) / 2 + STAGGER[r]
  row.forEach((k, i) => KEYS.push({ id: k, legend: k, x: x0 + i * PITCH, y: ROW_Y[r], kind: 'char' }))
})
const rowEnd = (r) => CX + ((ROWS[r].length - 1) * PITCH) / 2 + STAGGER[r]
const rowStart = (r) => CX - ((ROWS[r].length - 1) * PITCH) / 2 + STAGGER[r]
KEYS.push({ id: 'back', legend: 'Back', x: rowEnd(0) + 50, y: ROW_Y[0], kind: 'wide' })
KEYS.push({ id: 'enter', legend: 'Return', x: rowEnd(2) + 52, y: ROW_Y[2], kind: 'wide' })
KEYS.push({ id: 'caps', legend: 'Lock', x: rowStart(3) - 52, y: ROW_Y[3], kind: 'wide' })
KEYS.push({ id: ' ', legend: '', x: CX, y: 676, kind: 'space' })

// Typebars: pivots on the front rim of the basket, all aimed at the printing point.
const BARS = 30
const BASKET = { cx: CX, cy: 386, rx: 150, ry: 58 }
const BAR_GEOM = Array.from({ length: BARS }, (_, i) => {
  const t = ((18 + (144 * i) / (BARS - 1)) * Math.PI) / 180
  const px = BASKET.cx + BASKET.rx * Math.cos(t)
  const py = BASKET.cy + BASKET.ry * Math.sin(t)
  const tx = CX
  const ty = SY - 6
  const len = Math.hypot(tx - px, ty - py)
  const deg = (Math.atan2(tx - px, py - ty) * 180) / Math.PI
  return { x: px, y: py, len, deg }
})
// The ribbon runs from each spool to the vibrator at the printing point.
const seg = (a, b) => ({
  x: a.x,
  y: a.y,
  len: Math.hypot(b.x - a.x, b.y - a.y),
  deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
})
const RIBBON = [
  seg({ x: 206, y: 404 }, { x: CX - 18, y: 349 }),
  seg({ x: CX - 18, y: 349 }, { x: CX + 18, y: 349 }),
  seg({ x: CX + 18, y: 349 }, { x: 614, y: 404 }),
]
const SCREWS = [
  { x: 152, y: 394, r: 20 },
  { x: 668, y: 394, r: -35 },
  { x: 122, y: 736, r: 70 },
  { x: 698, y: 736, r: 5 },
]

const barFor = (ch) => {
  const i = KEY_INDEX[ch.toLowerCase()]
  return (i ?? ch.charCodeAt(0)) % BARS
}

// Soft-wrap at the margin, breaking at the last space where there is one.
function wrap(text, cols) {
  const out = []
  for (let line of text.split('\n')) {
    while (line.length > cols) {
      const at = line.lastIndexOf(' ', cols)
      if (at > 0) {
        out.push(line.slice(0, at))
        line = line.slice(at + 1)
      } else {
        out.push(line.slice(0, cols))
        line = line.slice(cols)
      }
    }
    out.push(line)
  }
  return out
}

// Deterministic unevenness in the ink, per character.
const noise = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Sound comes from the shared library (motion/sound.js), switched on and off in the header.

export default function Typewriter({ active = true }) {
  const rootRef = useRef(null)
  const viewportRef = useRef(null)
  const taRef = useRef(null)
  const keyRefs = useRef({})
  const barRefs = useRef([])
  const timers = useRef([])
  const valueRef = useRef(START)

  const [value, setValue] = useState(START)
  const [scale, setScale] = useState(1)
  const [narrow, setNarrow] = useState(false)
  const [focused, setFocused] = useState(false)
  const [returning, setReturning] = useState(false)
  const [caps, setCaps] = useState(false)
  const [pull, setPull] = useState('in') // in | out
  const [feed, setFeed] = useState(0)
  const [ding, setDing] = useState(0)
  const [status, setStatus] = useState('')

  const pullRef = useRef(pull)
  useEffect(() => {
    pullRef.current = pull
  }, [pull])

  const { cols, fs, lh } = narrow ? NARROW : WIDE
  const lines = useMemo(() => wrap(value, cols), [value, cols])
  const col = lines[lines.length - 1].length
  const sheetTop = SY - PAD_TOP - lines.length * lh

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Fit the stage into the room.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const fit = (w, h) => {
      if (!w || !h) return
      const isNarrow = w < 640
      const f = isNarrow ? NARROW.fit : WIDE.fit
      setNarrow(isNarrow)
      setScale(Math.max(0.2, Math.min(w / f, h / H_FIT, 1.2)))
    }
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width, entry.contentRect.height))
    ro.observe(el)
    fit(el.clientWidth, el.clientHeight) // don't wait for a painted frame (background tabs)
    return () => ro.disconnect()
  }, [])

  const focusPaper = useCallback(() => {
    const ta = taRef.current
    if (!ta) return
    ta.focus({ preventScroll: true })
    const end = ta.value.length
    ta.setSelectionRange(end, end)
  }, [])

  // On screen with a mouse or trackpad: be ready to type straight away.
  // (Not on touch, where focusing would raise the phone keyboard.)
  // Off screen: let go of the keyboard.
  useEffect(() => {
    const ta = taRef.current
    if (!active) {
      if (ta && document.activeElement === ta) ta.blur()
      return
    }
    if (!window.matchMedia?.('(pointer: fine)').matches) return
    const tryFocus = () => {
      if (document.activeElement === taRef.current) return
      const el = document.activeElement
      const typingElsewhere =
        el && el !== document.body && (el.matches('input, textarea, select') || el.isContentEditable)
      if (!typingElsewhere) focusPaper()
    }
    // try again after the room has finished arriving, in case it was still hidden
    const a = setTimeout(tryFocus, 60)
    const b = setTimeout(tryFocus, 700)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [active, focusPaper])

  const pressKey = useCallback((id) => {
    const el = keyRefs.current[id]
    if (!el || prefersReducedMotion()) return
    el.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(3px)', offset: 0.3 }, { transform: 'translateY(0)' }],
      { duration: 170, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    )
  }, [])

  const strike = useCallback(
    (ch) => {
      const reduced = prefersReducedMotion()
      const lower = ch.toLowerCase()
      if (ch === ' ') pressKey(' ')
      else if (KEY_INDEX[lower] != null) pressKey(lower)
      if (ch !== ' ' && !reduced) {
        const i = barFor(ch)
        const bar = barRefs.current[i]
        const { deg } = BAR_GEOM[i]
        bar?.animate(
          [
            { transform: `rotate(${deg}deg) scaleY(0.2)` },
            { transform: `rotate(${deg}deg) scaleY(1)`, offset: 0.42 },
            { transform: `rotate(${deg}deg) scaleY(0.2)` },
          ],
          { duration: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        )
      }
      sfx(ch === ' ' ? 'space' : 'key')
    },
    [pressKey],
  )

  // Every change to the text comes through here, from the textarea or the keys.
  const commit = useCallback(
    (next) => {
      if (pullRef.current !== 'in') return
      if (!next.startsWith(PREFIX)) return
      if (next.length > MAX_CHARS) next = next.slice(0, MAX_CHARS)
      const prev = valueRef.current
      if (next === prev) return
      const { cols: c } = narrow ? NARROW : WIDE
      const before = wrap(prev, c)
      const after = wrap(next, c)

      if (next.length > prev.length) {
        const ch = next[next.length - 1]
        if (ch === '\n') {
          pressKey('enter')
          sfx('carriage')
        } else strike(ch)
        const colBefore = before[before.length - 1].length
        const colAfter = after[after.length - 1].length
        if (after.length === before.length && colBefore < c - 6 && colAfter >= c - 6) {
          setDing((d) => d + 1)
          sfx('bell')
        }
      } else {
        pressKey('back')
        sfx('key')
      }

      if (after.length !== before.length) {
        setReturning(true)
        later(() => setReturning(false), 460)
      }
      valueRef.current = next
      setValue(next)
    },
    [narrow, later, pressKey, strike],
  )

  const type = useCallback(
    (str) => {
      const prev = valueRef.current
      if (str === '\b') commit(prev.slice(0, -1))
      else commit(prev + str)
      const ta = taRef.current
      if (ta && document.activeElement === ta) {
        const end = valueRef.current.length
        requestAnimationFrame(() => ta.setSelectionRange(end, end))
      }
    },
    [commit],
  )

  // While the room is on screen, typing types from anywhere: even with focus
  // left on a header button (Space/Enter are taken so the button doesn't fire).
  // Only another text field outside the typewriter keeps its keys. Escape, Tab
  // and the arrows are never touched.
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return
      const ta = taRef.current
      const t = e.target
      if (!ta || t === ta) return // the textarea handles its own keys
      const isField =
        t instanceof Element && (t.matches('input, textarea, select') || t.isContentEditable)
      if (isField && !rootRef.current?.contains(t)) return
      let str = null
      if (e.key === 'Enter') str = '\n'
      else if (e.key === 'Backspace') str = '\b'
      else if (e.key.length === 1) str = e.key
      if (str == null) return
      e.preventDefault()
      e.stopPropagation()
      type(str)
      focusPaper()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, type, focusPaper])

  const onTextKeyDown = (e) => {
    const k = e.key
    // Typing stays inside the typewriter; Escape, Tab and navigation keys still reach the app.
    if (k.length === 1 || k === 'Enter' || k === 'Backspace' || k === 'Delete') e.nativeEvent.stopPropagation()
  }

  const onKeyPointer = (id) => (e) => {
    e.preventDefault() // keep focus where it is; don't raise a phone keyboard
    if (id === 'caps') {
      setCaps((c) => !c)
      pressKey('caps')
      return
    }
    if (id === 'back') return type('\b')
    if (id === 'enter') return type('\n')
    type(caps ? id.toUpperCase() : id)
  }

  const send = () => {
    if (pullRef.current !== 'in') return
    const reduced = prefersReducedMotion()
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(valueRef.current)}`
    sfx('paperOut')
    setPull('out')
    setStatus('')
    later(
      () => {
        window.location.href = href
        setStatus('Your mail app should open with this note. Nothing is sent until you send it there.')
        later(() => setPull('in'), reduced ? 400 : 1400)
      },
      reduced ? 160 : 760,
    )
  }



  return (
    <div
      ref={rootRef}
      className={[
        'tw-room',
        focused && 'is-focused',
        returning && 'is-returning',
        pull === 'out' && 'is-pulled',
        caps && 'is-caps',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div ref={viewportRef} className="tw-viewport">
        <div
          className="tw-stage"
          style={{ width: W, height: H, '--s': scale }}
          onClick={(e) => {
            // Tap or click the machine to type (keys and lever type for themselves).
            if (!e.target.closest('.tw-key, .tw-lever')) focusPaper()
          }}
        >
          <div className="tw-mat" aria-hidden="true" />
          <div className="tw-shadow" aria-hidden="true" />
          <div className="tw-contact" aria-hidden="true" />
          <i className="tw-foot tw-foot-l" aria-hidden="true" />
          <i className="tw-foot tw-foot-r" aria-hidden="true" />
          <div className="tw-rail" aria-hidden="true" />

          {/* Carriage: paper table, sheet, platen, knobs and lever travel together. */}
          <div
            className="tw-carriage"
            style={{ left: CX, fontSize: fs, '--col': col, '--cols': cols, '--lh': `${lh}px` }}
            aria-hidden="true"
          >
            <div className="tw-table" />
            <div className="tw-sheet-clip">
              <div className="tw-sheet-track" style={{ transform: `translateY(${sheetTop}px)` }}>
                <div
                  key={feed}
                  className={`tw-sheet${feed ? ' is-fed' : ''}`}
                  style={{ minHeight: PAD_TOP + lines.length * lh + 420 }}
                >
                  {lines.map((line, li) => (
                    <div className="tw-line" key={li}>
                      {Array.from(line).map((ch, ci) => {
                        if (ch === ' ') return ' '
                        const n = li * 131 + ci * 17 + ch.charCodeAt(0)
                        const a = noise(n)
                        const b = noise(n + 7.1)
                        return (
                          <span
                            key={ci}
                            style={{
                              opacity: 0.74 + a * 0.26,
                              transform: `translateY(${((b - 0.5) * 0.9).toFixed(2)}px)`,
                            }}
                          >
                            {ch}
                          </span>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="tw-sheet-curl" />
            </div>
            <div className="tw-platen" />
            <div className="tw-bail">
              <i />
              <i />
            </div>
            <div className="tw-knob tw-knob-l" />
            <div className="tw-knob tw-knob-r" />
            <button
              type="button"
              className="tw-lever"
              tabIndex={-1}
              aria-hidden="true"
              title="Carriage return"
              onPointerDown={(e) => {
                e.preventDefault()
                type('\n')
              }}
            >
              <span />
            </button>
          </div>

          {/* Body */}
          <div className="tw-deck" aria-hidden="true">
            <div className="tw-spool tw-spool-l" />
            <div className="tw-spool tw-spool-r" />
            <div
              className="tw-basket"
              style={{
                left: BASKET.cx - BASKET.rx - 136,
                width: BASKET.rx * 2,
                height: BASKET.ry,
                top: BASKET.cy - 378,
              }}
            />
          </div>
          <div className="tw-front" aria-hidden="true" />
          <div className="tw-plate" aria-hidden="true">
            <span>The Index</span>
            <small>Nº 1</small>
          </div>
          {SCREWS.map((sc, i) => (
            <i
              key={i}
              className="tw-screw"
              aria-hidden="true"
              style={{ left: sc.x, top: sc.y, '--r': `${sc.r}deg` }}
            />
          ))}

          <div className="tw-ribbon" aria-hidden="true">
            {RIBBON.map((r, i) => (
              <i
                key={i}
                style={{ left: r.x, top: r.y, width: r.len, transform: `rotate(${r.deg}deg)` }}
              />
            ))}
          </div>

          <div className="tw-keys" aria-hidden="true">
            {KEYS.map((k) => (
              <button
                key={k.id}
                type="button"
                tabIndex={-1}
                className={`tw-key tw-key-${k.kind}${k.id === 'caps' && caps ? ' is-on' : ''}`}
                style={{ left: k.x, top: k.y }}
                onPointerDown={onKeyPointer(k.id)}
              >
                <span
                  className="tw-cap"
                  ref={(el) => {
                    keyRefs.current[k.id] = el
                  }}
                >
                  {k.legend}
                </span>
              </button>
            ))}
          </div>

          <div className="tw-bars" aria-hidden="true">
            {BAR_GEOM.map((b, i) => (
              <i
                key={i}
                ref={(el) => {
                  barRefs.current[i] = el
                }}
                className="tw-bar"
                style={{
                  left: b.x - 1.5,
                  top: b.y - b.len,
                  height: b.len,
                  transform: `rotate(${b.deg}deg) scaleY(0.2)`,
                }}
              />
            ))}
          </div>

          <div className="tw-guide" style={{ left: CX }} aria-hidden="true">
            <span className="tw-caret" />
          </div>

          {ding > 0 && (
            <span key={ding} className="tw-ding label" aria-hidden="true">
              ding
            </span>
          )}

          <label htmlFor="tw-text" className="sr-only">
            Note to Anchovies
          </label>
          <textarea
            id="tw-text"
            ref={taRef}
            className="tw-textarea"
            style={{ left: CX, top: SY - 20 }}
            value={value}
            maxLength={MAX_CHARS}
            readOnly={pull !== 'in'}
            spellCheck={false}
            autoCapitalize="sentences"
            aria-describedby="tw-help"
            onChange={(e) => commit(e.target.value)}
            onKeyDown={onTextKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>

      <div className="tw-actions">
        <p id="tw-help" className="sr-only">
          <span className="tw-hint-fine">Type anywhere. Return starts a new line.</span>
          <span className="tw-hint-touch">Tap the paper to type.</span>
        </p>
        <div className="tw-buttons">
          <button type="button" className="tw-btn tw-btn-primary label" onClick={send} disabled={pull !== 'in'}>
            Pull the sheet &amp; send
          </button>
          <a className="tw-btn label" href={CAL} target="_blank" rel="noopener">
            Book a call
          </a>
        </div>
        <p className="tw-status label" role="status" aria-live="polite">
          {status}
        </p>
        {/* Required by the recording's licence (CC BY 4.0) */}
        <p className="tw-credit">
          Typewriter sounds: “WWS Typewriter”, Erika 5 recorded by Konrad Gutkowski / Work With Sounds,{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">
            CC BY 4.0
          </a>
          ; bell by _stubb, CC0. Both via Wikimedia Commons, trimmed.
        </p>
      </div>
    </div>
  )
}
