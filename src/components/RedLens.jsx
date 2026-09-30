import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'
import '../styles/freddie.css'

/*
 * THROUGH RED LENSES (Freddie)
 * Freddie makes red-lensed glasses for the hours in front of a screen before
 * bed. Here a pair sits over one of the studio's own mockups: through the two
 * lenses the picture turns red and amber, its blue taken out. Move the pointer
 * (or drag the glasses, or use the arrow keys) to look around; "Put them on"
 * tints the whole picture, with the frames soft at the edges of your view.
 *
 * The lens colour is an approximation of a red blue-blocking lens (blue removed,
 * green mostly removed), computed once into a canvas copy of the image.
 * The glasses are drawn here, not taken from Freddie's files.
 */

// Lens tint, as a colour matrix: R' = .95R + .35G + .05B, G' = .08R + .27G, B' = 0.
const M = [
  [0.95, 0.35, 0.05],
  [0.08, 0.27, 0],
  [0, 0, 0],
]
const MATRIX = `${M[0].join(' ')} 0 0  ${M[1].join(' ')} 0 0  ${M[2].join(' ')} 0 0  0 0 0 1 0`

// A soft, slightly keyhole-shaped lens (flat top, round bottom), centred on 0,0.
function lensPath(cx, cy, w, h) {
  const r = w * 0.22
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const y0 = cy - h / 2
  const y1 = cy + h / 2
  return [
    `M${x0 + r} ${y0 + h * 0.02}`,
    `Q${cx} ${y0 - h * 0.03} ${x1 - r} ${y0 + h * 0.02}`,
    `Q${x1} ${y0} ${x1} ${y0 + r}`,
    `C${x1} ${cy + h * 0.25} ${cx + w * 0.38} ${y1} ${cx} ${y1}`,
    `C${cx - w * 0.38} ${y1} ${x0} ${cy + h * 0.25} ${x0} ${y0 + r}`,
    `Q${x0} ${y0} ${x0 + r} ${y0 + h * 0.02}`,
    'Z',
  ].join(' ')
}

// Filter the image once into a canvas (the blue channel zeroed), as a blob URL.
function useTinted(src) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    let made = null
    const im = new Image()
    im.decoding = 'async'
    im.onload = () => {
      if (!alive) return
      try {
        const scale = Math.min(1, 1600 / im.naturalWidth)
        const c = document.createElement('canvas')
        c.width = Math.round(im.naturalWidth * scale)
        c.height = Math.round(im.naturalHeight * scale)
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(im, 0, 0, c.width, c.height)
        const px = ctx.getImageData(0, 0, c.width, c.height)
        const d = px.data
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          d[i] = M[0][0] * r + M[0][1] * g + M[0][2] * b
          d[i + 1] = M[1][0] * r + M[1][1] * g + M[1][2] * b
          d[i + 2] = 0
        }
        ctx.putImageData(px, 0, 0)
        c.toBlob((blob) => {
          if (!alive || !blob) return
          made = URL.createObjectURL(blob)
          setUrl(made)
        }, 'image/jpeg', 0.9)
      } catch {
        /* keep the SVG-filter fallback */
      }
    }
    im.src = src
    return () => {
      alive = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [src])
  return url
}

export default function RedLens({ image, colors, caption }) {
  const W = image.w
  const H = image.h
  // Glasses in image units: two lenses and a bridge, about a third of the picture across
  // (a little larger on a narrow screen, so they stay easy to see and catch).
  const [narrow, setNarrow] = useState(false)
  const LW = W * (narrow ? 0.19 : 0.14)
  const LH = LW * 0.84
  const GAP = LW * 0.24
  const LX = LW / 2 + GAP / 2 // lens centre offset from the bridge

  const reduced = prefersReducedMotion()
  const tinted = useTinted(image.src)
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState({ x: W * 0.5, y: H * 0.36 })
  const [held, setHeld] = useState(false)
  const target = useRef(pos)
  const raf = useRef(0)
  const stageRef = useRef(null)
  const grab = useRef(null)

  // Ease the glasses toward the pointer (straight there with reduced motion).
  const moveTo = (p, instant) => {
    const clamped = {
      x: Math.max(LX, Math.min(W - LX, p.x)),
      y: Math.max(LH * 0.2, Math.min(H - LH * 0.2, p.y)),
    }
    target.current = clamped
    if (instant || reduced) {
      cancelAnimationFrame(raf.current)
      raf.current = 0
      return setPos(clamped)
    }
    if (raf.current) return
    const step = () => {
      setPos((cur) => {
        const t = target.current
        const nx = cur.x + (t.x - cur.x) * 0.22
        const ny = cur.y + (t.y - cur.y) * 0.22
        if (Math.hypot(t.x - nx, t.y - ny) < 0.5) {
          raf.current = 0
          return t
        }
        raf.current = requestAnimationFrame(step)
        return { x: nx, y: ny }
      })
    }
    raf.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 560))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const toImage = (e) => {
    const r = stageRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }

  // Mouse: the glasses follow. Touch and pen: drag the glasses, or tap to place them.
  const onStageMove = (e) => {
    if (grab.current) {
      const p = toImage(e)
      moveTo({ x: p.x - grab.current.dx, y: p.y - grab.current.dy }, true)
      sfx('slide', { throttle: 140 })
      return
    }
    if (e.pointerType === 'mouse' && !on) moveTo(toImage(e))
  }
  const onStageClick = (e) => {
    if (e.pointerType === 'mouse' || on) return
    moveTo(toImage(e))
  }
  const onGlassesDown = (e) => {
    if (on) return
    e.preventDefault()
    e.stopPropagation()
    try {
      stageRef.current.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const p = toImage(e)
    grab.current = { dx: p.x - pos.x, dy: p.y - pos.y }
    setHeld(true)
    sfx('pick')
  }
  const onUp = (e) => {
    if (!grab.current) return e?.type === 'pointerup' && onStageClick(e)
    grab.current = null
    setHeld(false)
    sfx('drop')
  }

  const onKey = (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
    if (!k || on) return
    e.preventDefault()
    const s = (e.shiftKey ? 0.12 : 0.04) * W
    moveTo({ x: target.current.x + k[0] * s, y: target.current.y + k[1] * s }, true)
    sfx('tick', { throttle: 60 })
  }

  const toggle = () => {
    sfx(on ? 'close' : 'open')
    setOn((v) => !v)
  }

  const left = lensPath(pos.x - LX, pos.y, LW, LH)
  const right = lensPath(pos.x + LX, pos.y, LW, LH)
  const stroke = LW * 0.07
  const bridge = `M${pos.x - GAP / 2 - stroke * 0.2} ${pos.y - LH * 0.3} Q${pos.x} ${pos.y - LH * 0.46} ${pos.x + GAP / 2 + stroke * 0.2} ${pos.y - LH * 0.3}`
  const temples = [
    `M${pos.x - LX - LW / 2} ${pos.y - LH * 0.36} L${pos.x - LX - LW / 2 - LW * 0.16} ${pos.y - LH * 0.42}`,
    `M${pos.x + LX + LW / 2} ${pos.y - LH * 0.36} L${pos.x + LX + LW / 2 + LW * 0.16} ${pos.y - LH * 0.42}`,
  ]

  // "On": the view as if wearing them. Two large lens openings, the frame soft around them.
  const VL = W * 0.47
  const VH = H * 0.98
  const vignette = `M${-W} ${-H} H${2 * W} V${2 * H} H${-W} Z ${lensPath(W / 2 - VL / 2 - W * 0.012, H / 2, VL, VH)} ${lensPath(W / 2 + VL / 2 + W * 0.012, H / 2, VL, VH)}`

  const tintHref = tinted || image.src
  const tintFilter = tinted ? undefined : 'url(#fr-red)'

  return (
    <div className="fr-block" style={{ '--fr-brown': colors.brown, '--fr-cream': colors.cream, '--fr-red': colors.red }}>
      <div
        ref={stageRef}
        className={`fr-stage${on ? ' is-on' : ''}${held ? ' is-held' : ''}`}
        style={{ aspectRatio: `${W} / ${H}` }}
        role="application"
        tabIndex={0}
        aria-roledescription="glasses over a picture"
        aria-label={`${image.alt}. ${on ? 'Seen as if wearing the red-lensed glasses.' : 'A pair of red-lensed glasses sits over the picture; use the arrow keys to move them.'}`}
        onKeyDown={onKey}
        onPointerMove={onStageMove}
        onPointerUp={onUp}
        onPointerCancel={() => onUp()}
      >
        <svg className="fr-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <filter id="fr-red" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={MATRIX} />
            </filter>
            <clipPath id="fr-lenses">
              <path d={`${left} ${right}`} />
            </clipPath>
            <filter id="fr-soft" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={W * 0.018} />
            </filter>
          </defs>

          <image href={image.src} width={W} height={H} preserveAspectRatio="xMidYMid slice" />

          {on ? (
            <g className="fr-worn">
              <image href={tintHref} width={W} height={H} filter={tintFilter} preserveAspectRatio="xMidYMid slice" />
              <path d={vignette} fillRule="evenodd" fill={colors.brown} opacity="0.72" filter="url(#fr-soft)" />
            </g>
          ) : (
            <g className="fr-glasses">
              <g clipPath="url(#fr-lenses)">
                <image href={tintHref} width={W} height={H} filter={tintFilter} preserveAspectRatio="xMidYMid slice" />
                <path d={`${left} ${right}`} fill={colors.red} opacity="0.08" />
              </g>
              {/* the frame: clear acetate with a brown rim, the brand's drawn line */}
              <path d={`${left} ${right}`} fill="none" stroke={colors.cream} strokeOpacity="0.55" strokeWidth={stroke * 1.9} />
              <path
                d={`${left} ${right} ${bridge} ${temples.join(' ')}`}
                fill="none"
                stroke={colors.brown}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
        {/* the handle: an HTML box over the glasses (touch-action none), a little larger for fingers */}
        {!on && (
          <div
            className="fr-grip"
            aria-hidden="true"
            onPointerDown={onGlassesDown}
            style={{
              left: `${((pos.x - LX - LW / 2 - LW * 0.2) / W) * 100}%`,
              top: `${((pos.y - LH * 0.7) / H) * 100}%`,
              width: `${((2 * LX + LW + LW * 0.4) / W) * 100}%`,
              height: `${((LH * 1.4) / H) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            {on ? 'Wearing them' : 'Red lenses'}
            <span className="stack-kind">{on ? ' · the whole view, blue taken out' : ' · move over the picture · drag the glasses · arrow keys'}</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" aria-pressed={on} onClick={toggle}>
            {on ? 'Take them off' : 'Put them on'}
          </button>
        </div>
      </div>
    </div>
  )
}
