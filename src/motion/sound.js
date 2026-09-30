/*
 * SOUND
 * Small, soft sound effects. Most are synthesised in Web Audio from filtered
 * noise and short tones. The typewriter uses real recordings, cut into one
 * sprite (public/assets/sound/typewriter.m4a + .json):
 *   keys, space, carriage return, paper: "WWS_Typewriter.ogg", an Erika 5
 *     (Seidel & Naumann, 1940), by Work With Sounds / Konrad Gutkowski,
 *     CC BY 4.0, via Wikimedia Commons
 *   bell: "406243_stubb_typewriter-ding-near-mono.wav" by _stubb, CC0, via Wikimedia Commons
 * Until the sprite has loaded (or if it can't), the synthesised versions play.
 *
 *   import { sfx } from '../motion/sound.js'
 *   sfx('drawerOpen')
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * (or resumed) on the first pointer or key press. Sound is on by default and
 * the header toggle remembers a visitor's choice. Reduced-motion visitors still
 * get sound unless they switch it off; it's independent of motion.
 */

const KEY = 'anchovies-sound'
let ctx = null
let master = null
let noiseBuf = null
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
})()
const listeners = new Set()

export const soundOn = () => enabled
export function setSound(on) {
  enabled = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  listeners.forEach((f) => f(on))
  if (on) sfx('tick')
}
export function onSoundChange(f) {
  listeners.add(f)
  return () => listeners.delete(f)
}

function init() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.55
  // A gentle low-pass on everything keeps it soft rather than clicky.
  const warm = ctx.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 7000
  master.connect(warm).connect(ctx.destination)
  loadSprite()
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

if (typeof window !== 'undefined') {
  const wake = () => {
    init()
    if (ctx?.state === 'suspended') ctx.resume()
  }
  window.addEventListener('pointerdown', wake, { capture: true })
  window.addEventListener('keydown', wake, { capture: true })
}

// ── Recorded samples ─────────────────────────────────────────────────────

let sprite = null // { buf, map: { name: [start, dur] } }
function loadSprite() {
  const base = `${import.meta.env.BASE_URL}assets/sound/typewriter`
  Promise.all([fetch(`${base}.json`).then((r) => r.json()), fetch(`${base}.m4a`).then((r) => r.arrayBuffer())])
    .then(([map, data]) => new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)).then((buf) => (sprite = { buf, map })))
    .catch(() => {
      /* fall back to the synthesised sounds */
    })
}

// Play one clip from the sprite; `name` may be a prefix ('key' picks one of key0…key11).
function sample(name, { vol = 0.6, rate = 1 } = {}) {
  if (!sprite) return false
  const names = Object.keys(sprite.map).filter((k) => k === name || k.replace(/\d+$/, '') === name)
  if (!names.length) return false
  const [start, dur] = sprite.map[names[Math.floor(Math.random() * names.length)]]
  const src = ctx.createBufferSource()
  src.buffer = sprite.buf
  src.playbackRate.value = rate
  const g = ctx.createGain()
  g.gain.value = vol
  src.connect(g).connect(master)
  src.start(ctx.currentTime, start, dur)
  return true
}

// ── Building blocks ──────────────────────────────────────────────────────

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}

// A burst of filtered noise: paper, slides, rustles.
function noise({ t = 0, dur = 0.2, type = 'bandpass', f = 1200, f2 = null, q = 0.8, vol = 0.3, a = 0.005 }) {
  const now = ctx.currentTime + t
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.playbackRate.value = 0.8 + Math.random() * 0.4
  const filt = ctx.createBiquadFilter()
  filt.type = type
  filt.Q.value = q
  filt.frequency.setValueAtTime(f, now)
  if (f2) filt.frequency.exponentialRampToValueAtTime(f2, now + dur)
  const g = ctx.createGain()
  env(g, now, a, vol, dur)
  src.connect(filt).connect(g).connect(master)
  src.start(now, Math.random() * 0.5)
  src.stop(now + a + dur + 0.05)
}

// A short pitched tone: knocks, clicks, bells.
function tone({ t = 0, f = 440, f2 = null, dur = 0.15, type = 'sine', vol = 0.2, a = 0.002 }) {
  const now = ctx.currentTime + t
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f, now)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + dur)
  const g = ctx.createGain()
  env(g, now, a, vol, dur)
  o.connect(g).connect(master)
  o.start(now)
  o.stop(now + a + dur + 0.05)
}

const jitter = (v, amt = 0.08) => v * (1 + (Math.random() * 2 - 1) * amt)

// ── The library ──────────────────────────────────────────────────────────

const SOUNDS = {
  // Cabinet
  drawerOpen: () => {
    noise({ dur: 0.42, type: 'bandpass', f: 380, f2: 900, q: 1.2, vol: 0.22, a: 0.04 }) // runners
    tone({ t: 0.4, f: 140, f2: 90, dur: 0.12, vol: 0.2 }) // hits the stop
    noise({ t: 0.4, dur: 0.06, type: 'lowpass', f: 900, vol: 0.12 })
  },
  drawerClose: () => {
    noise({ dur: 0.34, type: 'bandpass', f: 900, f2: 380, q: 1.2, vol: 0.2, a: 0.03 })
    tone({ t: 0.33, f: 120, f2: 70, dur: 0.16, vol: 0.28 }) // thunk home
    noise({ t: 0.33, dur: 0.08, type: 'lowpass', f: 700, vol: 0.16 })
  },
  drawerPeek: () => noise({ dur: 0.12, type: 'bandpass', f: 500, f2: 650, q: 1.4, vol: 0.06, a: 0.02 }),
  pick: () => noise({ dur: 0.07, type: 'highpass', f: jitter(2600), vol: 0.08 }), // lifting paper
  drop: () => {
    noise({ dur: 0.1, type: 'bandpass', f: jitter(1400), q: 0.7, vol: 0.12 }) // paper settling
    tone({ f: jitter(220), f2: 160, dur: 0.05, vol: 0.05 })
  },
  slide: () => noise({ dur: 0.06, type: 'bandpass', f: jitter(3000), q: 0.6, vol: 0.035 }), // paper dragging (throttled by callers)
  flip: () => noise({ dur: 0.16, type: 'bandpass', f: 1800, f2: 3400, q: 0.9, vol: 0.12, a: 0.02 }), // card turning
  tear: () => {
    for (let i = 0; i < 6; i++) noise({ t: i * 0.025, dur: 0.04, type: 'highpass', f: jitter(2200, 0.3), vol: 0.1 })
  },
  crumple: () => {
    for (let i = 0; i < 9; i++) noise({ t: i * 0.03 + Math.random() * 0.02, dur: 0.05, type: 'bandpass', f: jitter(2400, 0.4), q: 1.5, vol: 0.12 })
  },
  pencil: () => noise({ dur: 0.05, type: 'bandpass', f: jitter(5000), q: 2, vol: 0.025 }), // graphite scratch
  pen: () => tone({ f: 1800, f2: 1400, dur: 0.03, type: 'triangle', vol: 0.05 }), // cap click
  clink: () => {
    tone({ f: jitter(2400), dur: 0.25, type: 'sine', vol: 0.08 })
    tone({ f: jitter(3700), dur: 0.18, type: 'sine', vol: 0.05 })
  },
  keys: () => {
    for (let i = 0; i < 4; i++) tone({ t: i * 0.045, f: jitter(3000, 0.25), dur: 0.12, vol: 0.04 })
  },
  // Case studies
  open: () => noise({ dur: 0.35, type: 'bandpass', f: 600, f2: 2400, q: 0.7, vol: 0.08, a: 0.06 }),
  close: () => noise({ dur: 0.3, type: 'bandpass', f: 2400, f2: 600, q: 0.7, vol: 0.07, a: 0.04 }),
  stamp: () => {
    tone({ f: 180, f2: 110, dur: 0.08, vol: 0.18 })
    noise({ dur: 0.05, type: 'lowpass', f: 1200, vol: 0.1 })
  },
  wax: () => noise({ dur: 0.5, type: 'lowpass', f: 700, f2: 300, vol: 0.08, a: 0.05 }),
  press: () => tone({ f: 150, f2: 80, dur: 0.14, vol: 0.2 }),
  drill: () => {
    noise({ dur: 0.8, type: 'bandpass', f: 1800, f2: 3200, q: 4, vol: 0.06, a: 0.05 })
    tone({ f: 220, f2: 260, dur: 0.8, type: 'sawtooth', vol: 0.015, a: 0.05 })
  },
  plant: () => {
    noise({ dur: 0.12, type: 'lowpass', f: 500, vol: 0.12 }) // soil
    tone({ t: 0.5, f: 880, f2: 1320, dur: 0.18, vol: 0.05 }) // bloom
  },
  // Fridge
  magnet: () => {
    tone({ f: jitter(900), f2: 500, dur: 0.04, type: 'triangle', vol: 0.12 })
    noise({ dur: 0.03, type: 'highpass', f: 3000, vol: 0.05 })
  },
  unstick: () => noise({ dur: 0.05, type: 'highpass', f: 1800, vol: 0.05 }),
  doorOpen: () => {
    noise({ dur: 0.18, type: 'bandpass', f: 1200, f2: 600, q: 1, vol: 0.1 }) // seal unsticking
    tone({ t: 0.05, f: 60, dur: 0.5, vol: 0.025, a: 0.1 }) // the hum
  },
  doorClose: () => {
    tone({ f: 110, f2: 70, dur: 0.18, vol: 0.22 })
    noise({ dur: 0.1, type: 'lowpass', f: 600, vol: 0.12 })
  },
  // Vending machine
  button: () => tone({ f: jitter(1400, 0.03), f2: 1200, dur: 0.04, type: 'square', vol: 0.03 }),
  beep: () => tone({ f: 1760, dur: 0.1, type: 'square', vol: 0.025 }),
  whirr: () => {
    tone({ f: 90, f2: 110, dur: 1.1, type: 'sawtooth', vol: 0.025, a: 0.1 })
    noise({ dur: 1.1, type: 'bandpass', f: 400, q: 2, vol: 0.04, a: 0.1 })
  },
  thud: () => {
    tone({ f: 95, f2: 55, dur: 0.22, vol: 0.32 })
    noise({ dur: 0.1, type: 'lowpass', f: 500, vol: 0.14 })
  },
  flap: () => tone({ f: 300, f2: 180, dur: 0.07, type: 'triangle', vol: 0.08 }),
  // Typewriter
  key: () => {
    if (sample('key', { vol: 0.55, rate: jitter(1, 0.04) })) return
    tone({ f: jitter(1900, 0.15), f2: 900, dur: 0.025, type: 'square', vol: 0.05 })
    noise({ dur: 0.035, type: 'bandpass', f: jitter(3200, 0.2), q: 1.5, vol: 0.14 })
    tone({ t: 0.012, f: 160, f2: 100, dur: 0.05, vol: 0.12 }) // the platen
  },
  space: () => {
    if (sample('space', { vol: 0.5 })) return
    noise({ dur: 0.05, type: 'bandpass', f: 1400, q: 1, vol: 0.12 })
    tone({ f: 120, f2: 90, dur: 0.06, vol: 0.1 })
  },
  bell: () => {
    if (sample('bell', { vol: 0.45 })) return
    tone({ f: 2093, dur: 0.9, vol: 0.09 })
    tone({ f: 4186, dur: 0.5, vol: 0.03 })
  },
  carriage: () => {
    if (sample('carriage', { vol: 0.6 })) return
    noise({ dur: 0.32, type: 'bandpass', f: 700, f2: 1500, q: 2, vol: 0.12, a: 0.02 })
    for (let i = 0; i < 5; i++) tone({ t: 0.03 + i * 0.05, f: 2200, dur: 0.012, type: 'square', vol: 0.02 })
    tone({ t: 0.34, f: 140, f2: 90, dur: 0.1, vol: 0.2 })
  },
  paperOut: () => sample('paperOut', { vol: 0.5 }) || noise({ dur: 0.6, type: 'bandpass', f: 900, f2: 2800, q: 0.8, vol: 0.12, a: 0.05 }),
  // Home page: hovering each object
  rustle: () => {
    // a few sheets of paper shuffled
    for (let i = 0; i < 4; i++) noise({ t: i * 0.05 + Math.random() * 0.02, dur: 0.09, type: 'bandpass', f: jitter(2600, 0.3), q: 0.8, vol: 0.07, a: 0.01 })
  },
  bottles: () => {
    // two glass bottles knocking together in a door bin
    const f = jitter(2300, 0.1)
    tone({ f, dur: 0.4, vol: 0.07 })
    tone({ f: f * 2.76, dur: 0.22, vol: 0.03 })
    tone({ t: 0.09, f: f * 1.12, dur: 0.35, vol: 0.06 })
    tone({ t: 0.09, f: f * 3.1, dur: 0.18, vol: 0.025 })
  },
  vendHum: () => {
    // the machine's motor turning over, short
    tone({ f: 90, f2: 115, dur: 0.55, type: 'sawtooth', vol: 0.022, a: 0.06 })
    noise({ dur: 0.55, type: 'bandpass', f: 420, q: 2, vol: 0.035, a: 0.06 })
  },
  typing: () => {
    // a short run of keys
    for (let i = 0; i < 4; i++) setTimeout(() => SOUNDS.key(), i * (70 + Math.random() * 40))
  },
  // UI
  tick: () => tone({ f: 1200, dur: 0.03, type: 'triangle', vol: 0.05 }),
  whoosh: () => noise({ dur: 0.7, type: 'bandpass', f: 300, f2: 1100, q: 0.6, vol: 0.05, a: 0.2 }), // panning between rooms
  pop: () => tone({ f: 500, f2: 900, dur: 0.07, vol: 0.08 }),
  roll: () => {
    for (let i = 0; i < 5; i++) tone({ t: i * 0.06 + Math.random() * 0.03, f: jitter(700, 0.3), f2: 400, dur: 0.04, type: 'triangle', vol: 0.08 })
  },
  crack: () => {
    noise({ dur: 0.06, type: 'highpass', f: 2500, vol: 0.2 })
    noise({ t: 0.03, dur: 0.08, type: 'bandpass', f: 1800, vol: 0.12 })
  },
}

let last = {}
export function sfx(name, { throttle = 0 } = {}) {
  if (!enabled || !SOUNDS[name]) return
  if (!init()) return
  if (ctx.state === 'suspended') ctx.resume()
  if (throttle) {
    const now = performance.now()
    if (now - (last[name] || 0) < throttle) return
    last[name] = now
  }
  try {
    SOUNDS[name]()
  } catch {
    /* audio is a nicety; never let it break anything */
  }
}
