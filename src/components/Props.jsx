import { useId } from 'react'

/*
 * THINGS IN THE DRAWERS
 * Objects drawn in code as close to real as vectors allow: layered materials
 * (brushed metal, gloss plastic, glass, copper), relief through SVG lighting,
 * and surface grain. None of them are branded.
 *
 * PHOTO-READY: put a cut-out photo (transparent PNG, shot straight down) at
 * /public/assets/props/<kind>.png and add its name to PHOTOS below. That photo
 * then replaces the drawing everywhere. The shot list is in the README.
 *
 * `size` is width × height in floor px at a 1352px-wide drawer; the drawer scales it.
 */

// Filenames of supplied object photos (e.g. 'penny', 'motokeys'). Empty until photos arrive.
export const PHOTOS = []

export const PROPS = {
  // Selected work
  clip: { size: [26, 72], label: 'Paper clip' },
  clip2: { size: [22, 60], label: 'Paper clip' },
  penny: { size: [40, 40], label: 'A penny' },
  housekeys: { size: [124, 84], label: 'House keys on a ring', keys: 2 },
  // The studio
  brush: { size: [236, 20], label: 'Paintbrush' },
  paint: { size: [74, 74], label: 'An open pot of paint' },
  stylus: { size: [230, 16], label: 'A stylus' },
  lighter: { size: [86, 30], label: 'Lighter' },
  pencil: { size: [190, 15], label: 'Pencil' },
  motokeys: { size: [150, 92], label: 'Motorcycle keys on a leather fob', keys: 1 },
  page: { size: [104, 140], label: 'A page torn from a book' },
  sort: { size: [30, 40], label: 'A letterpress sort' },
  // Odds & ends
  tin: { size: [150, 96], label: 'A tin of anchovies', action: 'Open' },
  fork: { size: [44, 196], label: 'A fork' },
  die: { size: [44, 44], label: 'A die', action: 'Roll' },
  ball: { size: [46, 46], label: 'A bouncy ball' },
  top: { size: [60, 60], label: 'A spinning top', action: 'Spin' },
  cookie: { size: [96, 64], label: 'A fortune cookie', action: 'Crack open' },
  band: { size: [70, 44], label: 'A rubber band' },
  band2: { size: [60, 40], label: 'A rubber band' },
  battery: { size: [86, 22], label: 'A battery' },
  cap: { size: [40, 40], label: 'A bottle cap' },
  cap2: { size: [40, 40], label: 'A bottle cap' },
  marble: { size: [30, 30], label: 'A marble' },
  eraser: { size: [70, 30], label: 'An eraser' },
  binder: { size: [52, 40], label: 'A binder clip' },
  notes: { size: [96, 96], label: 'Sticky notes' },
  eye: { size: [34, 34], label: 'A googly eye' },
  pin: { size: [110, 24], label: 'A safety pin' },
  candle: { size: [96, 12], label: 'A birthday candle' },
  domino: { size: [34, 64], label: 'A domino' },
  paperball: { size: [50, 46], label: 'A crumpled sheet from the pad' },
}

// Lines for the fortune cookie: the studio's own, from anchovies.agency/about.
export const FORTUNES = [
  'A brand becomes valuable when the world sees what you always knew.',
  'Taste is strategy disguised as intuition.',
  'Value is a frequency. We help you broadcast at the right one.',
  'Don’t compete. Don’t compare. Just become the only one in the room.',
  'Premium isn’t a price point. It’s a feeling you trigger on sight.',
  'People don’t buy your story. They buy how your story changes them.',
  'World-building first. Design second.',
  'We’re not for everyone.',
]

/* Shared materials. Rendered once, referenced by every object. */
export function PropDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* Brushed metal: long streaks of noise, clipped to the shape */}
        <filter id="pf-brushed" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1 0" result="flat" />
          <feColorMatrix in="n" type="luminanceToAlpha" result="na" />
          <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="-0.22" k4="0.08" result="mix" />
          <feComposite in="mix" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Fine grain for plastic, paper and wax */}
        <filter id="pf-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="luminanceToAlpha" result="na" />
          <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="-0.12" k4="0.05" result="mix" />
          <feComposite in="mix" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Tarnish: soft, blotchy variation for old copper and tin */}
        <filter id="pf-tarnish" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="11" result="n" />
          <feColorMatrix in="n" type="luminanceToAlpha" result="na" />
          <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="-0.28" k4="0.1" result="mix" />
          <feComposite in="mix" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Relief: stamped or cast detail lit from the upper left */}
        <filter id="pf-relief" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="b" />
          <feSpecularLighting in="b" surfaceScale="2.2" specularConstant="1" specularExponent="16" lightingColor="#fff" result="s">
            <feDistantLight azimuth="225" elevation="40" />
          </feSpecularLighting>
          <feComposite in="s" in2="SourceAlpha" operator="in" result="hi" />
          <feOffset in="SourceAlpha" dx="0.5" dy="0.7" result="off" />
          <feComposite in="off" in2="SourceAlpha" operator="out" result="edge" />
          <feFlood floodColor="#000" floodOpacity="0.4" />
          <feComposite in2="edge" operator="in" result="shadow" />
          <feComposite in="SourceGraphic" in2="hi" operator="arithmetic" k2="1" k3="0.55" result="lit" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="lit" />
          </feMerge>
        </filter>
        {/* Common gradients */}
        <linearGradient id="pg-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f2ef" />
          <stop offset=".22" stopColor="#b7b8b4" />
          <stop offset=".5" stopColor="#e9e9e5" />
          <stop offset=".78" stopColor="#8d8e8a" />
          <stop offset="1" stopColor="#c9c9c5" />
        </linearGradient>
        <linearGradient id="pg-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2a6" />
          <stop offset=".3" stopColor="#c69c49" />
          <stop offset=".55" stopColor="#e8cc85" />
          <stop offset=".8" stopColor="#9c7630" />
          <stop offset="1" stopColor="#c7a458" />
        </linearGradient>
        <radialGradient id="pg-copper" cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#f0b184" />
          <stop offset=".45" stopColor="#c07445" />
          <stop offset=".85" stopColor="#8a4a28" />
          <stop offset="1" stopColor="#6d3a1e" />
        </radialGradient>
        <linearGradient id="pg-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset=".35" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// A coffee ring left on the lining. Not movable: it's a stain.
export function CoffeeRing({ size = 118 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="coffee-ring" aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(92,60,30,0.3)" strokeWidth="4.5" strokeDasharray="220 12 40 8 60 6" filter="url(#pf-grain)" />
      <circle cx="60" cy="60" r="47.5" fill="none" stroke="rgba(92,60,30,0.12)" strokeWidth="3" />
    </svg>
  )
}

const PIPS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

// Keys hang from the ring: each key group turns and twists about the ring (set by the physics).
const keyGroup = (i, cx, cy) => ({
  style: {
    transformBox: 'view-box',
    transformOrigin: `${cx}px ${cy}px`,
    transform: `rotate(var(--k${i}, 0deg)) scaleY(var(--t${i}, 1))`,
  },
})

export function Glyph({ kind, state = {} }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '') // React 19 ids carry characters url(#…) can't reference
  const common = { className: 'prop-svg', 'aria-hidden': true }

  if (PHOTOS.includes(kind)) {
    return <img className="prop-photo" src={`${import.meta.env.BASE_URL}assets/props/${kind}.png`} alt="" draggable={false} />
  }

  switch (kind) {
    /* ── Paper clips: two-tone wire so it reads as round steel ── */
    case 'clip':
    case 'clip2': {
      const d = 'M28 30 V86 a10 10 0 0 1 -20 0 V16 a14 14 0 0 1 28 0 V92 a18 18 0 0 1 -36 0'
      return (
        <svg viewBox="0 0 40 110" {...common}>
          <g transform="translate(2 4)" fill="none" strokeLinecap="round">
            <path d={d} stroke={kind === 'clip2' ? '#6e6f6b' : '#8b8c88'} strokeWidth="3.6" />
            <path d={d} stroke={kind === 'clip2' ? '#c9cac6' : '#f4f4f1'} strokeWidth="1.2" transform="translate(-0.5 -0.5)" opacity=".85" />
          </g>
        </svg>
      )
    }

    /* ── US one cent, Union Shield reverse (public-domain design), struck in relief ── */
    case 'penny':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <defs>
            <path id={`arc-${uid}`} d="M15 50 A35 35 0 0 1 85 50" />
          </defs>
          <g filter="url(#pf-tarnish)">
            <circle cx="50" cy="50" r="49" fill="url(#pg-copper)" />
            <circle cx="50" cy="50" r="45.5" fill="none" stroke="#e7a67a" strokeWidth="3" opacity=".6" />
            <circle cx="50" cy="50" r="43.5" fill="#b56b3f" opacity=".35" />
          </g>
          <g filter="url(#pf-relief)" fill="#c47a4b">
            <circle cx="50" cy="50" r="47" fill="none" stroke="#c47a4b" strokeWidth="2.5" />
            <text fontSize="7.2" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing=".6">
              <textPath href={`#arc-${uid}`} startOffset="50%" textAnchor="middle">UNITED STATES OF AMERICA</textPath>
            </text>
            <text x="50" y="30" fontSize="4.6" textAnchor="middle" fontFamily="Georgia, serif" letterSpacing=".4">E · PLURIBUS · UNUM</text>
            {/* Shield: chief, then thirteen stripes */}
            <path d="M34 34 H66 V58 C66 70 58 76 50 80 C42 76 34 70 34 58 Z" fill="#c9804f" />
            <rect x="35.5" y="35.5" width="29" height="8" fill="#b36b3e" />
            {Array.from({ length: 13 }, (_, i) => (
              <rect key={i} x={36 + i * 2.2} y="44" width="1.1" height="30" fill="#a86236" />
            ))}
            {/* Scroll */}
            <path d="M28 52 H72 L69 57 L72 62 H28 L31 57 Z" fill="#d18a58" />
            <text x="50" y="59.4" fontSize="5.6" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fill="#8f4f2a">ONE CENT</text>
          </g>
          <ellipse cx="36" cy="28" rx="18" ry="9" fill="url(#pg-gloss)" transform="rotate(-30 36 28)" opacity=".5" />
        </svg>
      )

    /* ── House keys: a brass and a nickel key on a split ring ── */
    case 'housekeys':
      return (
        <svg viewBox="0 0 124 84" {...common}>
          <Ring cx={20} cy={34} r={14} />
          <g {...keyGroup(0, 20, 34)}>
            <g transform="rotate(-14 20 34)" filter="url(#pf-brushed)">
              <path d="M26 24 C 30 18 44 18 48 24 C 52 30 52 38 48 44 C 44 50 30 50 26 44 C 22 38 22 30 26 24 Z" fill="url(#pg-brass)" stroke="#8a6526" strokeWidth=".7" />
              <circle cx="31" cy="34" r="3.4" fill="#1b1b1a" opacity=".85" />
              <path d="M50 30 H56 V29 H118 L121 32 L118 35 L114 35 L112 38 L108 35 L104 39 L100 35 L96 38 L92 35 L86 38 H56 V38 H50 Z" fill="url(#pg-brass)" stroke="#8a6526" strokeWidth=".6" />
              <path d="M58 32.4 H116" stroke="rgba(90,62,20,0.55)" strokeWidth=".8" />
            </g>
          </g>
          <g {...keyGroup(1, 20, 34)}>
            <g transform="rotate(28 20 34)" filter="url(#pf-brushed)">
              <path d="M28 25 H44 C 48 25 50 27 50 31 V37 C 50 41 48 43 44 43 H28 C 25 43 24 41 24 38 V30 C 24 27 25 25 28 25 Z" fill="url(#pg-steel)" stroke="#6f706c" strokeWidth=".7" />
              <circle cx="30.5" cy="34" r="3" fill="#1b1b1a" opacity=".85" />
              <path d="M50 30.5 H108 L111 33 L108 36 L104 36 L102 38.5 L98 36 L95 39 L91 36 L87 38.5 L84 36 H50 Z" fill="url(#pg-steel)" stroke="#6f706c" strokeWidth=".6" />
              <path d="M54 33.2 H106" stroke="rgba(40,40,40,0.4)" strokeWidth=".8" />
            </g>
          </g>
        </svg>
      )

    /* ── Motorcycle keys: steel ring, stitched leather fob, black-headed ignition key (no logo) ── */
    case 'motokeys':
      return (
        <svg viewBox="0 0 150 92" {...common}>
          <defs>
            <linearGradient id={`lea-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6b4529" />
              <stop offset=".5" stopColor="#4a2d19" />
              <stop offset="1" stopColor="#2c1a0e" />
            </linearGradient>
            <linearGradient id={`rub-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b3b3a" />
              <stop offset=".45" stopColor="#141414" />
              <stop offset="1" stopColor="#0b0b0b" />
            </linearGradient>
          </defs>
          {/* Fob */}
          <g filter="url(#pf-grain)">
            <path d="M40 42 C 30 36 14 30 8 32 C 2 34 2 44 6 48 C 2 54 4 62 10 62 C 18 62 32 52 40 46 Z" fill={`url(#lea-${uid})`} />
          </g>
          <path d="M37 42 C 28 37 15 33 10 35 C 6 37 6 43 9 46 C 6 52 7 58 11 58 C 18 58 29 50 37 45" fill="none" stroke="rgba(235,215,185,0.55)" strokeWidth=".9" strokeDasharray="2 1.8" />
          <circle cx="13" cy="46" r="5" fill="url(#pg-steel)" stroke="#5e5f5b" strokeWidth=".8" />
          <circle cx="13" cy="46" r="2" fill="#9a9b97" />
          <Ring cx={46} cy={44} r={11} />
          <g {...keyGroup(0, 46, 44)}>
            <g transform="rotate(10 46 44)">
              <path d="M54 32 H82 C 90 32 94 38 94 44 C 94 50 90 56 82 56 H54 C 50 56 48 51 48 44 C 48 37 50 32 54 32 Z" fill={`url(#rub-${uid})`} filter="url(#pf-grain)" />
              <path d="M56 35 H80 C 86 35 89 39 90 42" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="57" cy="44" r="3.4" fill="#050505" stroke="#2a2a29" strokeWidth=".6" />
              <g filter="url(#pf-brushed)">
                <path d="M94 40 H140 L145 44 L140 48 L132 48 L129 51 L123 48 L117 51 L111 48 L105 50 L99 48 H94 Z" fill="url(#pg-steel)" stroke="#6f706c" strokeWidth=".6" />
              </g>
              <path d="M97 44 H138" stroke="rgba(40,40,40,0.45)" strokeWidth=".9" />
            </g>
          </g>
        </svg>
      )

    /* ── Paintbrush: lacquered handle, crimped ferrule, bristles with ultramarine on the tip ── */
    case 'brush':
      return (
        <svg viewBox="0 0 236 20" {...common}>
          <defs>
            <linearGradient id={`lac-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8a5a38" />
              <stop offset=".2" stopColor="#e3b98f" />
              <stop offset=".38" stopColor="#6e4226" />
              <stop offset="1" stopColor="#2a160b" />
            </linearGradient>
            <linearGradient id={`bri-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6d5438" />
              <stop offset=".55" stopColor="#8a6d4b" />
              <stop offset=".62" stopColor="#1f3f9e" />
              <stop offset="1" stopColor="#253f93" />
            </linearGradient>
          </defs>
          <path d="M2 10 C 2 7 8 6.5 20 6.5 L150 5 V15 L20 13.5 C8 13.5 2 13 2 10 Z" fill={`url(#lac-${uid})`} />
          <g filter="url(#pf-brushed)">
            <path d="M150 4.2 H182 L186 6 V14 L182 15.8 H150 Z" fill="url(#pg-steel)" />
          </g>
          <path d="M160 4.4 V15.6 M166 4.4 V15.6" stroke="rgba(0,0,0,0.25)" strokeWidth=".8" />
          <path d="M186 6 C 205 5 222 7 234 10 C 222 13 205 15 186 14 Z" fill={`url(#bri-${uid})`} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M188 ${7 + i * 0.8} C 206 ${6.6 + i * 0.9} 220 ${8 + i * 0.5} 232 ${9.6 + i * 0.1}`} stroke="rgba(0,0,0,0.18)" strokeWidth=".35" fill="none" />
          ))}
          <path d="M214 8.4 C 222 8.8 228 9.4 233 10" stroke="rgba(255,255,255,0.45)" strokeWidth=".8" fill="none" />
        </svg>
      )

    /* ── Paint pot, open: white plastic rim, glossy ultramarine surface, a drip over the edge ── */
    case 'paint':
      return (
        <svg viewBox="0 0 74 74" {...common}>
          <defs>
            <radialGradient id={`rim-${uid}`} cx=".5" cy=".5" r=".5">
              <stop offset=".78" stopColor="#d9d9d5" />
              <stop offset=".86" stopColor="#ffffff" />
              <stop offset=".94" stopColor="#c9c9c5" />
              <stop offset="1" stopColor="#a8a8a4" />
            </radialGradient>
            <radialGradient id={`pnt-${uid}`} cx=".42" cy=".38" r=".7">
              <stop offset="0" stopColor="#3f67d8" />
              <stop offset=".6" stopColor="#2141a8" />
              <stop offset="1" stopColor="#14286d" />
            </radialGradient>
          </defs>
          <circle cx="37" cy="37" r="36" fill={`url(#rim-${uid})`} filter="url(#pf-grain)" />
          <circle cx="37" cy="37" r="28" fill={`url(#pnt-${uid})`} />
          <path d="M20 33 C 26 26 38 24 46 28 C 40 30 30 31 24 37 Z" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="46" cy="44" rx="6" ry="3" fill="rgba(255,255,255,0.18)" transform="rotate(-20 46 44)" />
          <path d="M58 22 C 64 20 68 24 66 30 C 65 34 62 33 61 30" fill="#2141a8" />
          <circle cx="37" cy="37" r="28" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
        </svg>
      )

    /* ── A stylus (Apple Pencil-type, unbranded): matte white, a flat side, grey nib ── */
    case 'stylus':
      return (
        <svg viewBox="0 0 230 16" {...common}>
          <defs>
            <linearGradient id={`sty-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".3" stopColor="#f3f3f0" />
              <stop offset=".7" stopColor="#d9d9d5" />
              <stop offset="1" stopColor="#b9b9b5" />
            </linearGradient>
          </defs>
          <g filter="url(#pf-grain)">
            <path d="M8 2 H196 V14 H8 C 3 14 1 11 1 8 C 1 5 3 2 8 2 Z" fill={`url(#sty-${uid})`} />
            <path d="M196 2 L220 6.6 V9.4 L196 14 Z" fill={`url(#sty-${uid})`} />
          </g>
          <path d="M8 10.8 H196" stroke="rgba(0,0,0,0.08)" strokeWidth="1.2" />
          <path d="M8 4 H196" stroke="rgba(255,255,255,0.9)" strokeWidth=".8" />
          <path d="M220 6.6 L229 8 L220 9.4 Z" fill="#8e8e8a" />
        </svg>
      )

    /* ── Disposable lighter: glossy red body, steel hood with vents, ridged wheel ── */
    case 'lighter':
      return (
        <svg viewBox="0 0 86 30" {...common}>
          <defs>
            <linearGradient id={`ltr-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d0503d" />
              <stop offset=".25" stopColor="#f08a74" />
              <stop offset=".45" stopColor="#b73624" />
              <stop offset="1" stopColor="#6a1b10" />
            </linearGradient>
            <pattern id={`whl-${uid}`} width="1.6" height="4" patternUnits="userSpaceOnUse">
              <rect width=".8" height="4" fill="#3a3a38" />
              <rect x=".8" width=".8" height="4" fill="#9a9a96" />
            </pattern>
          </defs>
          <rect x="18" y="3" width="66" height="24" rx="9" fill={`url(#ltr-${uid})`} />
          <rect x="24" y="5" width="52" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
          <g filter="url(#pf-brushed)">
            <path d="M3 5 H22 V25 H3 C 2 25 1 24 1 23 V7 C 1 6 2 5 3 5 Z" fill="url(#pg-steel)" />
          </g>
          {[8, 12, 16].map((x) => [10, 15, 20].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="#3d3d3b" />))}
          <rect x="18" y="8" width="6" height="14" rx="3" fill={`url(#whl-${uid})`} />
          <path d="M24 10 H34 V20 H24 Z" fill="#1d1d1c" />
        </svg>
      )

    /* ── Pencil: cedar, lacquered facets, a gilt grade mark ── */
    case 'pencil':
      return (
        <svg viewBox="0 0 190 15" {...common}>
          <defs>
            <linearGradient id={`pcl-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4d38" />
              <stop offset=".3" stopColor="#4f7c5f" />
              <stop offset=".34" stopColor="#1f3a29" />
              <stop offset=".68" stopColor="#2d523b" />
              <stop offset=".72" stopColor="#173021" />
              <stop offset="1" stopColor="#10231a" />
            </linearGradient>
            <linearGradient id={`ced-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f0d3a6" />
              <stop offset=".5" stopColor="#d6ae78" />
              <stop offset="1" stopColor="#b88a52" />
            </linearGradient>
          </defs>
          <path d="M0 2 H150 V13 H0 Z" fill={`url(#pcl-${uid})`} />
          <path d="M150 2 L178 6.4 V8.6 L150 13 Z" fill={`url(#ced-${uid})`} filter="url(#pf-grain)" />
          <path d="M152 4.2 L170 6.8 M152 10.8 L170 8.2" stroke="rgba(120,80,40,0.35)" strokeWidth=".5" />
          <path d="M173 5.6 L190 7.5 L173 9.4 Z" fill="#2a2a2b" />
          <path d="M175 6.6 L188 7.4" stroke="rgba(255,255,255,0.35)" strokeWidth=".5" />
          <text x="20" y="10.2" fontSize="5.4" fontFamily="Georgia, serif" fill="#d8b766" letterSpacing=".6">2B</text>
        </svg>
      )

    /* ── A page torn from a book: set as grey lines, not real words ── */
    case 'page':
      return (
        <svg viewBox="0 0 168 226" {...common}>
          <g filter="url(#pf-grain)">
            <path
              d="M10 4 H164 V222 H12 L9 214 L13 206 L8 196 L12 188 L7 178 L11 170 L6 160 L11 150 L7 140 L12 131 L8 121 L11 112 L6 102 L10 93 L7 83 L12 74 L7 64 L11 55 L6 46 L10 37 L7 27 L11 18 L8 10 Z"
              fill="#f1ebdd"
            />
          </g>
          <text x="86" y="22" fontSize="6" textAnchor="middle" fontFamily="Georgia, serif" fill="rgba(40,35,25,0.55)" letterSpacing="1.2">
            XII
          </text>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={i === 10 ? 30 : 24} y={36 + i * 8.2} width={i === 9 || i === 21 ? 62 : 128 - (i % 3) * 3} height="2.2" rx="1" fill="rgba(40,35,25,0.26)" />
          ))}
          <text x="150" y="214" fontSize="6" fontFamily="Georgia, serif" fill="rgba(40,35,25,0.5)">147</text>
        </svg>
      )

    /* ── A letterpress sort: cast type metal, face reversed ── */
    case 'sort':
      return (
        <svg viewBox="0 0 30 40" {...common}>
          <g filter="url(#pf-brushed)">
            <rect x="1" y="1" width="28" height="38" rx="1.5" fill="url(#pg-steel)" />
          </g>
          <rect x="1" y="30" width="28" height="2.5" fill="rgba(0,0,0,0.22)" />
          <g filter="url(#pf-relief)">
            <text x="15" y="24" fontSize="22" fontWeight="700" textAnchor="middle" fontFamily="Georgia, serif" fill="#555652" transform="translate(30 0) scale(-1 1)">
              a
            </text>
          </g>
        </svg>
      )

    /* ── A tin of anchovies: tinplate, rolled edge, ribbed lid, pull ring.
          Opened, the lid rolls back to show fillets lying in olive oil. ── */
    case 'tin': {
      const open = !!state.opened
      const fillets = [0, 1, 2, 3, 4, 5]
      return (
        <svg viewBox="0 0 150 96" {...common}>
          <defs>
            <linearGradient id={`tin-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f3f3f0" />
              <stop offset=".35" stopColor="#babbb6" />
              <stop offset=".6" stopColor="#e4e4e0" />
              <stop offset="1" stopColor="#8f908b" />
            </linearGradient>
            <radialGradient id={`oil-${uid}`} cx=".45" cy=".4" r=".7">
              <stop offset="0" stopColor="#d9b25a" />
              <stop offset=".7" stopColor="#a47b2a" />
              <stop offset="1" stopColor="#6e4f17" />
            </radialGradient>
            {/* A cured fillet across its width: dark back, silver skin, then the rusty flesh */}
            <linearGradient id={`fil-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3b221b" />
              <stop offset=".12" stopColor="#6d5a52" />
              <stop offset=".3" stopColor="#b9b6ae" />
              <stop offset=".44" stopColor="#dcdad3" />
              <stop offset=".56" stopColor="#8f969a" />
              <stop offset=".7" stopColor="#9a5a44" />
              <stop offset=".88" stopColor="#7a3a2a" />
              <stop offset="1" stopColor="#40201a" />
            </linearGradient>
            <linearGradient id={`fsh-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".5" stopColor="#fff" stopOpacity=".15" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`roll-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7d7e79" />
              <stop offset=".35" stopColor="#f4f4f1" />
              <stop offset=".6" stopColor="#a9aaa5" />
              <stop offset="1" stopColor="#6c6d68" />
            </linearGradient>
            <clipPath id={`in-${uid}`}>
              <rect x="9" y="9" width="132" height="78" rx="18" />
            </clipPath>
          </defs>
          <g filter="url(#pf-brushed)">
            <rect x="2" y="2" width="146" height="92" rx="24" fill={`url(#tin-${uid})`} />
          </g>
          <rect x="4" y="4" width="142" height="88" rx="22" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
          {/* Inside: oil and fillets */}
          <g clipPath={`url(#in-${uid})`}>
            <rect x="9" y="9" width="132" height="78" fill={`url(#oil-${uid})`} />
            {/* Fillets packed head to tail, as they come */}
            {fillets.map((i) => (
              <g key={i} transform={`translate(${13 + i * 21} ${12 + (i % 2) * 2}) ${i % 2 ? 'rotate(180 10 36)' : ''} rotate(${((i * 7) % 5) - 2} 10 36)`}>
                <path d="M1 3 C 5 0 15 0 19 3 L 18 46 C 17 55 14 60 12 64 L 15 71 L 10 67 L 5 71 L 8 64 C 6 60 3 55 2 46 Z" fill={`url(#fil-${uid})`} />
                {/* lateral line, and the fine dark flecks of the skin */}
                <path d="M9.5 4 C 10 20 10.2 40 9.6 62" stroke="rgba(40,30,28,0.55)" strokeWidth=".7" fill="none" />
                <path d="M6 10 v2 M7 22 v2 M6.5 34 v2 M7 46 v2" stroke="rgba(30,25,25,0.4)" strokeWidth=".8" />
                <path d="M4.5 4 C 5 20 5.5 40 7 60" stroke={`url(#fsh-${uid})`} strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M1 3 C 5 0 15 0 19 3" stroke="rgba(120,50,35,0.6)" strokeWidth="1.2" fill="none" />
              </g>
            ))}
            {/* The oil over them: a warm tint and a few bright pools */}
            <rect x="9" y="9" width="132" height="78" fill="rgba(196,150,50,0.22)" />
            <ellipse cx="58" cy="28" rx="36" ry="7" fill="rgba(255,244,200,0.3)" transform="rotate(-8 58 28)" />
            <ellipse cx="104" cy="70" rx="16" ry="3.5" fill="rgba(255,244,200,0.22)" transform="rotate(-6 104 70)" />
          </g>
          {/* The lid: shrinks toward the far end as it rolls up; the roll grows there */}
          <g className="tin-lid" style={{ transformBox: 'view-box', transformOrigin: '141px 48px', transform: open ? 'scaleX(0.08)' : 'none' }}>
            <g filter="url(#pf-brushed)">
              <rect x="9" y="9" width="132" height="78" rx="18" fill={`url(#tin-${uid})`} />
            </g>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={18 + i * 5} y={16 + i * 5} width={114 - i * 10} height={64 - i * 10} rx={13 - i * 2} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
                <rect x={18.8 + i * 5} y={16.8 + i * 5} width={114 - i * 10} height={64 - i * 10} rx={13 - i * 2} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth=".8" />
              </g>
            ))}
            <circle cx="30" cy="48" r="4.5" fill="url(#pg-steel)" stroke="rgba(0,0,0,0.35)" strokeWidth=".8" />
          </g>
          <rect className="tin-roll" x="128" y="10" width="13" height="76" rx="6.5" fill={`url(#roll-${uid})`} style={{ opacity: open ? 1 : 0 }} />
          {/* Pull ring: sits on the lid, then ends up on the roll */}
          <g className="tin-ring" style={{ transform: open ? 'translate(106px, 0)' : 'none' }}>
            <g filter="url(#pf-brushed)">
              <path d="M30 34 C 14 34 8 40 8 48 C 8 56 14 62 30 62 C 32 62 33 60 33 58 V38 C 33 36 32 34 30 34 Z M28 39 V57 C 18 57 13 54 13 48 C 13 42 18 39 28 39 Z" fill="url(#pg-steel)" stroke="rgba(0,0,0,0.35)" strokeWidth=".7" fillRule="evenodd" />
            </g>
          </g>
          <rect x="7" y="7" width="136" height="82" rx="19" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
        </svg>
      )
    }

    /* ── Fork: stainless, a bright reflection down the middle ── */
    case 'fork':
      return (
        <svg viewBox="0 0 44 196" {...common}>
          <defs>
            <linearGradient id={`frk-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8e8f8b" />
              <stop offset=".3" stopColor="#dcdcd8" />
              <stop offset=".46" stopColor="#ffffff" />
              <stop offset=".6" stopColor="#b3b4b0" />
              <stop offset="1" stopColor="#6d6e6a" />
            </linearGradient>
          </defs>
          <g filter="url(#pf-brushed)">
            <path
              d="M4 4 C 4 2 7 2 7 4 V36 H11 V4 C 11 2 14 2 14 4 V36 H18 V4 C 18 2 21 2 21 4 V36 H25 V4 C 25 2 28 2 28 4 V36 H32 V4 C 32 2 35 2 35 4 V36 C 35 48 30 56 24 62 V150 C 24 156 30 170 32 180 C 33 188 28 194 22 194 C 16 194 11 188 12 180 C 14 170 20 156 20 150 V62 C 14 56 4 48 4 36 Z"
              transform="translate(2 0)"
              fill={`url(#frk-${uid})`}
              stroke="rgba(60,60,58,0.5)"
              strokeWidth=".6"
            />
          </g>
        </svg>
      )

    /* ── Die: white resin, rounded edges, pips drilled and painted ── */
    case 'die':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <defs>
            <radialGradient id={`die-${uid}`} cx=".35" cy=".3" r=".85">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".75" stopColor="#ecebe6" />
              <stop offset="1" stopColor="#c9c8c2" />
            </radialGradient>
          </defs>
          <rect x="3" y="3" width="94" height="94" rx="20" fill={`url(#die-${uid})`} filter="url(#pf-grain)" />
          <rect x="3" y="3" width="94" height="94" rx="20" fill="none" stroke="rgba(0,0,0,0.12)" />
          {(PIPS[state.face || 1] || []).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8.6" fill={state.face === 1 ? '#a3221a' : '#161615'} />
              <circle cx={x - 1.4} cy={y - 1.6} r="8" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" />
              <path d={`M${x - 5} ${y + 5.5} a8 8 0 0 0 10 -10`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </g>
          ))}
        </svg>
      )

    /* ── Bouncy ball: speckled rubber, a hard highlight ── */
    case 'ball':
      return (
        <svg viewBox="0 0 46 46" {...common}>
          <defs>
            <radialGradient id={`bal-${uid}`} cx=".36" cy=".3" r=".75">
              <stop offset="0" stopColor="#ff8a6b" />
              <stop offset=".55" stopColor="#d9321d" />
              <stop offset="1" stopColor="#7a1509" />
            </radialGradient>
          </defs>
          <circle cx="23" cy="23" r="22" fill={`url(#bal-${uid})`} />
          {Array.from({ length: 26 }, (_, i) => {
            const a = i * 2.4
            const r = 4 + ((i * 7) % 16)
            return <circle key={i} cx={23 + Math.cos(a) * r} cy={23 + Math.sin(a) * r} r={0.8 + (i % 3) * 0.4} fill={['#f5d23a', '#2f5fd1', '#ffffff'][i % 3]} opacity=".75" />
          })}
          <ellipse cx="15" cy="12" rx="6" ry="3.5" fill="rgba(255,255,255,0.8)" transform="rotate(-35 15 12)" />
          <circle cx="23" cy="23" r="22" fill="none" stroke="rgba(0,0,0,0.25)" />
        </svg>
      )

    /* ── Spinning top: turned wood, lacquered bands ── */
    case 'top':
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <defs>
            <radialGradient id={`top-${uid}`} cx=".4" cy=".35" r=".8">
              <stop offset="0" stopColor="#ecd0a2" />
              <stop offset="1" stopColor="#9a6934" />
            </radialGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill={`url(#top-${uid})`} filter="url(#pf-grain)" />
          {[25, 21, 17].map((r, i) => (
            <circle key={r} cx="30" cy="30" r={r} fill="none" stroke="rgba(110,70,30,0.25)" strokeWidth=".6" />
          ))}
          <circle cx="30" cy="30" r="22" fill="none" stroke="#a83225" strokeWidth="3.5" />
          <circle cx="30" cy="30" r="13" fill="none" stroke="#1f4b95" strokeWidth="2.6" />
          <circle cx="30" cy="30" r="5" fill="#4b2f16" />
          <circle cx="29" cy="29" r="2" fill="rgba(255,255,255,0.35)" />
          <path d="M12 16 A 24 24 0 0 1 40 8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )

    /* ── Fortune cookie: a folded, toasted disc with the slip showing at the fold.
          Cracked, it lies in two jagged halves. ── */
    case 'cookie': {
      const body = (
        <defs>
          <radialGradient id={`ck-${uid}`} cx=".5" cy=".3" r=".8">
            <stop offset="0" stopColor="#f3d69a" />
            <stop offset=".45" stopColor="#e2b066" />
            <stop offset=".8" stopColor="#c98a3f" />
            <stop offset="1" stopColor="#a4642a" />
          </radialGradient>
          <linearGradient id={`ckf-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9c5d24" />
            <stop offset=".6" stopColor="#c98a3f" />
            <stop offset="1" stopColor="#e6bb74" />
          </linearGradient>
        </defs>
      )
      if (state.cracked)
        return (
          <svg viewBox="0 0 110 70" {...common}>
            {body}
            <g filter="url(#pf-grain)">
              {/* Two broken halves, each still curled, with a jagged edge */}
              <path d="M6 44 C 4 26 18 12 34 12 C 40 12 44 15 46 19 L 42 23 L 45 28 L 40 32 L 44 37 L 38 42 C 32 50 12 56 6 44 Z" fill={`url(#ck-${uid})`} />
              <path d="M104 44 C 106 26 92 12 76 12 C 70 12 66 15 64 19 L 68 23 L 65 28 L 70 32 L 66 37 L 72 42 C 78 50 98 56 104 44 Z" fill={`url(#ck-${uid})`} />
              <path d="M14 26 C 20 18 28 16 36 18" fill="none" stroke="rgba(255,240,205,0.65)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M96 26 C 90 18 82 16 74 18" fill="none" stroke="rgba(255,240,205,0.65)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M46 19 L 42 23 L 45 28 L 40 32 L 44 37 L 38 42" fill="none" stroke="rgba(110,60,15,0.6)" strokeWidth="1.2" />
              <path d="M64 19 L 68 23 L 65 28 L 70 32 L 66 37 L 72 42" fill="none" stroke="rgba(110,60,15,0.6)" strokeWidth="1.2" />
            </g>
            {/* crumbs */}
            {[[50, 50], [57, 55], [60, 46], [53, 58]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={1 + (i % 2) * 0.6} fill="#d6a15a" />
            ))}
          </svg>
        )
      // Whole: a disc folded in half, then bent over at the middle, so from above it's a
      // plump crescent with two rounded wings and a deep crease where the fortune sits.
      return (
        <svg viewBox="0 0 110 70" {...common}>
          {body}
          <g filter="url(#pf-grain)">
            <path d="M6 40 C 2 20 26 4 55 4 C 84 4 108 20 104 40 C 100 54 86 62 72 58 C 64 56 60 50 55 44 C 50 50 46 56 38 58 C 24 62 10 54 6 40 Z" fill={`url(#ck-${uid})`} />
            {/* The crease: the fold dips in toward the middle */}
            <path d="M34 44 C 42 40 50 38 55 44 C 60 38 68 40 76 44 C 68 48 62 50 55 44 C 48 50 42 48 34 44 Z" fill={`url(#ckf-${uid})`} />
            <path d="M30 46 C 40 52 48 52 55 44 C 62 52 70 52 80 46" fill="none" stroke="rgba(110,60,15,0.45)" strokeWidth="1.2" />
            {/* Toasted edges and a glossy top */}
            <path d="M6 40 C 2 20 26 4 55 4 C 84 4 108 20 104 40" fill="none" stroke="rgba(150,85,30,0.5)" strokeWidth="1.6" />
            <path d="M22 16 C 34 9 48 7 60 8" fill="none" stroke="rgba(255,246,220,0.75)" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M70 10 C 80 12 88 16 94 22" fill="none" stroke="rgba(255,246,220,0.45)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* The fortune, poking out of the crease */}
          <path d="M50 42 L 70 35 L 72 39 L 52 46 Z" fill="#fbfaf5" stroke="rgba(0,0,0,0.15)" strokeWidth=".4" />
          <path d="M54 43 L 67 38.5" stroke="#b33a2a" strokeWidth=".7" strokeDasharray="1.4 .9" />
        </svg>
      )
    }

    /* ── Rubber bands: a thin band with a lit edge ── */
    case 'band':
    case 'band2': {
      const d = 'M8 22 C 8 8 30 4 44 8 C 60 12 66 22 60 32 C 52 42 26 40 14 34 C 9 31 8 26 8 22 Z'
      const c = kind === 'band' ? ['#a8845a', '#dcbf96'] : ['#9e2f27', '#e0726a']
      return (
        <svg viewBox="0 0 70 44" {...common}>
          <path d={d} fill="none" stroke={c[0]} strokeWidth="3.2" />
          <path d={d} fill="none" stroke={c[1]} strokeWidth="1" transform="translate(-.4 -.6)" opacity=".8" />
        </svg>
      )
    }

    /* ── AA battery: printed metallic wrap, copper cap, steel terminal ── */
    case 'battery':
      return (
        <svg viewBox="0 0 86 22" {...common}>
          <defs>
            <linearGradient id={`bat-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4a48" />
              <stop offset=".25" stopColor="#8d8d8a" />
              <stop offset=".45" stopColor="#1b1b1a" />
              <stop offset="1" stopColor="#2e2e2c" />
            </linearGradient>
            <linearGradient id={`cop-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9b784" />
              <stop offset=".3" stopColor="#fbe0bf" />
              <stop offset=".5" stopColor="#b8763c" />
              <stop offset="1" stopColor="#7d4a20" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="76" height="18" rx="2.5" fill={`url(#bat-${uid})`} />
          <rect x="54" y="2" width="24" height="18" rx="2" fill={`url(#cop-${uid})`} />
          <g filter="url(#pf-brushed)">
            <rect x="78" y="7" width="6" height="8" rx="1.5" fill="url(#pg-steel)" />
          </g>
          <text x="28" y="14.4" fontSize="6.6" textAnchor="middle" fill="#e6e6e2" fontFamily="Arial, sans-serif" letterSpacing=".4">AA · 1.5V</text>
        </svg>
      )

    /* ── Bottle caps: crimped steel skirt, printed top, scuffs ── */
    case 'cap':
    case 'cap2': {
      const teeth = Array.from({ length: 21 }, (_, i) => {
        const a = (i / 21) * Math.PI * 2
        return `${20 + Math.cos(a) * 19.5},${20 + Math.sin(a) * 19.5} ${20 + Math.cos(a + 0.15) * 17},${20 + Math.sin(a + 0.15) * 17}`
      }).join(' ')
      const top = kind === 'cap' ? '#dcdcd8' : '#2f6b4a'
      return (
        <svg viewBox="0 0 40 40" {...common}>
          <g filter="url(#pf-brushed)">
            <polygon points={teeth} fill="url(#pg-steel)" />
          </g>
          <circle cx="20" cy="20" r="15" fill={top} filter="url(#pf-tarnish)" />
          <circle cx="20" cy="20" r="15" fill="url(#pg-gloss)" opacity=".6" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="rgba(255,255,255,0.25)" />
          <path d="M11 24 l6 -2 M24 12 l5 3" stroke="rgba(255,255,255,0.4)" strokeWidth=".6" />
        </svg>
      )
    }

    /* ── Glass marble: tinted glass, a cat's-eye swirl, a highlight and a caustic ── */
    case 'marble':
      return (
        <svg viewBox="0 0 30 30" {...common}>
          <defs>
            <radialGradient id={`mb-${uid}`} cx=".45" cy=".4" r=".6">
              <stop offset="0" stopColor="rgba(220,240,255,0.35)" />
              <stop offset=".8" stopColor="rgba(120,170,210,0.55)" />
              <stop offset="1" stopColor="rgba(40,80,120,0.85)" />
            </radialGradient>
          </defs>
          <circle cx="15" cy="15" r="14" fill={`url(#mb-${uid})`} />
          <path d="M7 18 C 11 9 17 22 23 11" fill="none" stroke="#e8902a" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
          <path d="M8 13 C 13 18 17 8 22 17" fill="none" stroke="#2c62b8" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
          <ellipse cx="10" cy="8" rx="4" ry="2.2" fill="rgba(255,255,255,0.9)" transform="rotate(-30 10 8)" />
          <path d="M16 25 A 10 10 0 0 0 25 17" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="15" cy="15" r="14" fill="none" stroke="rgba(0,0,0,0.2)" />
        </svg>
      )

    /* ── Eraser: pink rubber, a worn corner ── */
    case 'eraser':
      return (
        <svg viewBox="0 0 70 30" {...common}>
          <path d="M8 2 H64 C 67 2 68 4 68 6 V24 C 68 27 66 28 64 28 H14 C 6 28 2 22 2 15 C 2 8 4 2 8 2 Z" fill="#e7a7a0" filter="url(#pf-grain)" />
          <path d="M8 2 H64 C 67 2 68 4 68 6 V8 H3 C 4 5 5 2 8 2 Z" fill="rgba(255,255,255,0.3)" />
          <path d="M2 15 C 2 22 6 28 14 28 C 9 24 7 19 7 14 Z" fill="rgba(80,40,40,0.18)" />
        </svg>
      )

    /* ── Binder clip: black enamel, steel handles folded back ── */
    case 'binder':
      return (
        <svg viewBox="0 0 52 40" {...common}>
          <defs>
            <linearGradient id={`bnd-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4a48" />
              <stop offset=".35" stopColor="#141413" />
              <stop offset="1" stopColor="#060606" />
            </linearGradient>
          </defs>
          <path d="M6 14 L26 4 L46 14 V36 H6 Z" fill={`url(#bnd-${uid})`} />
          <path d="M9 14 L26 6 L43 14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          {state.open ? (
            <>
              <path d="M14 16 C 12 10 16 4 24 6 M38 16 C 40 10 36 4 28 6" fill="none" stroke="#8b8c88" strokeWidth="2.4" />
              <path d="M6 14 L26 10 L46 14" fill="none" stroke="#000" strokeWidth="2" />
            </>
          ) : (
            <>
              <path d="M14 16 C 10 8 12 0 20 0 M38 16 C 42 8 40 0 32 0" fill="none" stroke="#8b8c88" strokeWidth="2.4" />
              <path d="M14 16 C 10 8 12 0 20 0 M38 16 C 42 8 40 0 32 0" fill="none" stroke="#efefec" strokeWidth=".8" transform="translate(-.4 -.4)" />
            </>
          )}
        </svg>
      )

    /* ── Sticky notes: a small pad, the top sheet lifting at one corner ── */
    case 'notes':
      return (
        <svg viewBox="0 0 96 96" {...common}>
          <rect x="6" y="8" width="86" height="86" fill="#e3d178" />
          <path d="M3 4 H89 V76 C 80 80 76 86 74 90 H3 Z" fill="#f3e48c" filter="url(#pf-grain)" />
          <path d="M74 90 C 76 86 80 80 89 76 C 86 84 82 88 74 90 Z" fill="#d8c56e" />
          <path d="M3 4 H89 V11 H3 Z" fill="rgba(0,0,0,0.05)" />
        </svg>
      )

    /* ── Googly eye: a clear dome over a loose black pupil (it rolls when you move it) ── */
    case 'eye':
      return (
        <svg viewBox="0 0 34 34" {...common}>
          <circle cx="17" cy="17" r="16" fill="#fbfbf8" />
          <circle cx="17" cy="17" r="16" fill="none" stroke="rgba(0,0,0,0.18)" />
          <circle cx="17" cy="17" r="8" fill="#0d0d0d" style={{ transform: 'translate(var(--ex, 0px), var(--ey, 4px))' }} />
          <ellipse cx="11" cy="10" rx="5" ry="3" fill="rgba(255,255,255,0.85)" transform="rotate(-35 11 10)" />
          <circle cx="17" cy="17" r="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        </svg>
      )

    /* ── Safety pin: sprung steel, a coil and a clasp ── */
    case 'pin':
      return (
        <svg viewBox="0 0 110 24" {...common}>
          <g fill="none" strokeLinecap="round">
            <path d="M14 7 H96 M14 17 H90" stroke="#8b8c88" strokeWidth="2" />
            <path d="M14 7 H96 M14 17 H90" stroke="#f1f1ee" strokeWidth=".7" transform="translate(0 -.5)" />
            <path d="M14 7 C 4 7 4 17 14 17" stroke="#8b8c88" strokeWidth="2" />
            <circle cx="10" cy="12" r="3.4" stroke="#8b8c88" strokeWidth="1.6" />
          </g>
          <g filter="url(#pf-brushed)">
            <path d="M92 3 H104 C 107 3 108 6 108 9 V15 C 108 19 106 21 102 21 H92 Z" fill="url(#pg-steel)" stroke="#6f706c" strokeWidth=".6" />
          </g>
          <path d="M90 17 L 96 17" stroke="#6f706c" strokeWidth="2" />
        </svg>
      )

    /* ── Birthday candle: twisted, striped wax; a blackened wick ── */
    case 'candle':
      return (
        <svg viewBox="0 0 96 12" {...common}>
          <defs>
            <pattern id={`cs-${uid}`} width="10" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
              <rect width="10" height="12" fill="#f4f0e6" />
              <rect width="4" height="12" fill="#e25a7a" />
            </pattern>
            <linearGradient id={`cg-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".5" />
              <stop offset=".5" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity=".25" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="82" height="8" rx="3" fill={`url(#cs-${uid})`} />
          <rect x="2" y="2" width="82" height="8" rx="3" fill={`url(#cg-${uid})`} />
          <path d="M84 6 H91" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="92" cy="6" r="1.4" fill="#2a2a2a" />
          {state.lit && (
            <g className="candle-flame">
              <defs>
                <radialGradient id={`fl-${uid}`} cx=".3" cy=".5" r=".7">
                  <stop offset="0" stopColor="#fffbe6" />
                  <stop offset=".35" stopColor="#ffe08a" />
                  <stop offset=".75" stopColor="#ff9a2e" />
                  <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="6" r="14" fill="rgba(255,190,90,0.18)" />
              <path className="candle-flame-body" d="M91 6 C 94 1.5 100 1 112 6 C 100 11 94 10.5 91 6 Z" fill={`url(#fl-${uid})`} />
              <path d="M92 6 C 94 4.6 97 4.6 100 6 C 97 7.4 94 7.4 92 6 Z" fill="rgba(80,120,255,0.55)" />
            </g>
          )}
        </svg>
      )

    /* ── Domino: black, a brass spinner, white drilled pips ── */
    case 'domino':
      return (
        <svg viewBox="0 0 34 64" {...common}>
          <defs>
            <linearGradient id={`dm-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a3a39" />
              <stop offset=".5" stopColor="#141414" />
              <stop offset="1" stopColor="#080808" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="32" height="62" rx="5" fill={`url(#dm-${uid})`} />
          <rect x="2" y="2" width="30" height="60" rx="4.5" fill="none" stroke="rgba(255,255,255,0.12)" />
          <path d="M5 32 H29" stroke="#d4c087" strokeWidth="1.2" />
          <circle cx="17" cy="32" r="1.8" fill="#e8d59c" />
          {[[10, 10], [24, 24], [17, 17], [10, 42], [24, 42], [10, 55], [24, 55]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill="#f3f1ea" />
          ))}
        </svg>
      )

    /* ── A sheet from the pad, crumpled: faceted, creased, lit from the upper left ── */
    case 'paperball': {
      const facets = [
        ['M25 3 L40 9 L31 18 Z', '#ffffff'], ['M25 3 L31 18 L16 14 Z', '#ecebe5'], ['M16 14 L31 18 L22 28 Z', '#d8d6cf'],
        ['M40 9 L48 22 L31 18 Z', '#f5f4ef'], ['M48 22 L42 36 L31 18 Z', '#c9c7bf'], ['M31 18 L42 36 L22 28 Z', '#e2e0d9'],
        ['M16 14 L22 28 L5 26 Z', '#f3f2ed'], ['M5 26 L22 28 L14 40 Z', '#cfcdc5'], ['M22 28 L42 36 L28 44 Z', '#bdbbb3'],
        ['M22 28 L28 44 L14 40 Z', '#d4d2ca'], ['M16 14 L5 26 L8 12 Z', '#fbfaf6'], ['M25 3 L16 14 L8 12 Z', '#f0efe9'],
      ]
      return (
        <svg viewBox="0 0 50 46" {...common}>
          <g filter="url(#pf-grain)">
            {facets.map(([d, f], i) => (
              <path key={i} d={d} fill={f} stroke="rgba(0,0,0,0.08)" strokeWidth=".4" strokeLinejoin="round" />
            ))}
          </g>
          <path d="M18 20 L26 24 M34 26 L38 31 M12 32 L19 34" stroke="rgba(0,0,0,0.12)" strokeWidth=".6" />
        </svg>
      )
    }

    default:
      return null
  }
}

// A split ring: two turns of steel wire, lit along the top.
function Ring({ cx, cy, r }) {
  return (
    <g fill="none">
      <circle cx={cx} cy={cy} r={r} stroke="#7f807c" strokeWidth="2.6" />
      <circle cx={cx + 0.8} cy={cy + 0.6} r={r - 1.2} stroke="#8b8c88" strokeWidth="2.2" />
      <path d={`M${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`} stroke="#f4f4f1" strokeWidth=".9" />
    </g>
  )
}

// Older names, kept so both drawers can share one renderer.
export const PropGlyph = Glyph
export const JunkGlyph = Glyph
