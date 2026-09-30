import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'

/*
 * SEAL THE ENVELOPE (Lex Politica)
 * The back of a plain envelope, drawn here (no stock photo). Click it: black
 * wax pools where you click (the flap's point is the natural spot), then the griffin
 * (the studio's own mark, unaltered) is pressed into it. Click again to seal it
 * somewhere else. Black wax, because the identity is black and white.
 */

// An irregular wax pool: a circle pushed out by a few soft lobes.
function waxPath(seed, r = 50) {
  const pts = []
  const n = 28
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const wob = Math.sin(a * 3 + seed) * 3.5 + Math.sin(a * 5 + seed * 2) * 2.2 + Math.sin(a * 11 + seed * 3) * 0.8
    pts.push([50 + Math.cos(a) * (r + wob), 50 + Math.sin(a) * (r + wob)])
  }
  return `M${pts.map((p) => p.map((v) => v.toFixed(2)).join(' ')).join(' L')} Z`
}

// A plain envelope, seen from the back: body, side flaps, and the top flap folded down.
function Envelope() {
  return (
    <svg className="seal-envelope" viewBox="0 0 800 500" aria-hidden="true">
      <defs>
        <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f4ef" />
          <stop offset="1" stopColor="#ecE9e1" />
        </linearGradient>
        <filter id="env-soft" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".16" />
        </filter>
      </defs>
      <rect x="0" y="0" width="800" height="500" rx="6" fill="#f1efe9" />
      {/* side and bottom flaps */}
      <path d="M0 500 L 360 250 Q 400 226 440 250 L 800 500 Z" fill="#efece5" stroke="rgba(0,0,0,.08)" strokeWidth="1.2" />
      <path d="M0 0 L 330 262 L 0 500 Z" fill="#f3f1ec" stroke="rgba(0,0,0,.07)" strokeWidth="1.2" />
      <path d="M800 0 L 470 262 L 800 500 Z" fill="#f3f1ec" stroke="rgba(0,0,0,.07)" strokeWidth="1.2" />
      {/* top flap, folded down over the rest */}
      <path d="M0 0 L 800 0 L 430 292 Q 400 314 370 292 Z" fill="url(#env-flap)" filter="url(#env-soft)" />
      <path d="M0 0 L 800 0" stroke="rgba(255,255,255,.9)" strokeWidth="2" />
    </svg>
  )
}

export default function WaxSeal({ mark, caption }) {
  const [paths, setPaths] = useState(null)
  const [seal, setSeal] = useState(null) // { x, y, seed, stage }
  const stageRef = useRef(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    let alive = true
    fetch(mark.src)
      .then((r) => r.text())
      .then((svg) => {
        if (!alive) return
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        const vb = doc.documentElement.getAttribute('viewBox')
        setPaths({ vb, d: [...doc.querySelectorAll('path')].map((p) => p.getAttribute('d')) })
      })
      .catch(() => alive && setPaths({ vb: '0 0 100 100', d: [] }))
    return () => {
      alive = false
    }
  }, [mark.src])

  const place = (x, y) => {
    const s = { x, y, seed: Math.random() * 10, stage: 'pour' }
    setSeal(s)
    sfx('wax')
    setTimeout(() => sfx('press'), reduced ? 0 : 480)
    if (reduced) return setSeal({ ...s, stage: 'pressed' })
    setTimeout(() => setSeal((c) => (c && c.seed === s.seed ? { ...c, stage: 'press' } : c)), 480)
    setTimeout(() => setSeal((c) => (c && c.seed === s.seed ? { ...c, stage: 'pressed' } : c)), 820)
  }

  const onClick = (e) => {
    const r = stageRef.current.getBoundingClientRect()
    place(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <div className="seal-block">
      <div className="seal-stage">
        <div
          ref={stageRef}
          className="seal-letter"
          style={{ aspectRatio: '800 / 500' }}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={seal ? 'The envelope, sealed with the griffin. Click to seal it again.' : 'The back of an envelope. Click to seal it with wax.'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              place(50, 58)
            }
          }}
        >
          <Envelope />
          {seal && (
            <div className={`wax is-${seal.stage}`} style={{ left: `${seal.x}%`, top: `${seal.y}%` }} aria-hidden="true">
              <svg viewBox="-6 -6 112 112">
                <defs>
                  <radialGradient id="wax-fill" cx=".4" cy=".35" r=".7">
                    <stop offset="0" stopColor="#3b3b3a" />
                    <stop offset=".55" stopColor="#141414" />
                    <stop offset="1" stopColor="#050505" />
                  </radialGradient>
                </defs>
                <path className="wax-pool" d={waxPath(seal.seed)} fill="url(#wax-fill)" />
                <circle cx="50" cy="50" r="36" fill="#0e0e0e" className="wax-well" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
                {paths && (
                  <svg className="wax-mark" x="24" y="24" width="52" height="52" viewBox={paths.vb}>
                    <g filter="url(#pf-relief)">
                      {paths.d.map((d, i) => (
                        <path key={i} d={d} fill="#1d1d1c" />
                      ))}
                    </g>
                  </svg>
                )}
                <path d="M22 26 C 30 16 44 12 58 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="stack-bar">
        <p className="stack-caption" aria-live="polite">
          <span className="label">
            Seal<span className="stack-kind"> · {seal ? 'sealed' : 'click the envelope to seal it'}</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => setSeal(null)} disabled={!seal}>
            Break the seal
          </button>
        </div>
      </div>
    </div>
  )
}
