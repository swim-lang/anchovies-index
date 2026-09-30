import { useEffect, useMemo, useRef, useState } from 'react'
import { magnets } from '../content/magnets.js'
import { workTags } from '../content/archive.js'
import { prefersReducedMotion } from '../motion/timing.js'
import { sfx } from '../motion/sound.js'
import { cssUrl } from '../lib/cssUrl.js'

/*
 * THE ARCHIVE
 * Every brand on anchovies.agency/work, one index card each, filed A–Z in a
 * tray. The top card lies face up; flip it and it goes to the back of the file.
 * Letter tabs jump through the file. A card with a case study opens it here;
 * one with a live page opens that; the rest just say so.
 * Card content: brand name, mark (in its colour), and its /work tags. Nothing else.
 */

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
const letterOf = (label) => (/^[a-z]/i.test(label) ? label[0].toUpperCase() : '#')

export default function IndexTray({ active, projects, onOpenProject }) {
  const cards = useMemo(() => [...magnets].sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true })), [])
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(null) // { i, dir } a card on its way off the top
  const reduced = prefersReducedMotion()
  const cardRef = useRef(null)
  const n = cards.length

  const go = (dir) => {
    sfx('flip')
    if (!reduced) setLeaving({ i: at, dir })
    setAt((i) => (i + dir + n) % n)
    if (!reduced) setTimeout(() => setLeaving(null), 380)
  }
  const jump = (letter) => {
    const i = cards.findIndex((c) => letterOf(c.label) === letter)
    if (i < 0 || i === at) return
    sfx('flip')
    if (!reduced) setLeaving({ i: at, dir: i > at ? 1 : -1 })
    setAt(i)
    if (!reduced) setTimeout(() => setLeaving(null), 380)
  }

  // Keys while the archive drawer is open: arrows flip, letters jump.
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), go(1))
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), go(-1))
      else if (/^[a-z]$/i.test(e.key)) jump(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const openCard = (mg) => {
    const i = mg.project ? projects.findIndex((p) => p.id === mg.project) : -1
    if (i >= 0) return onOpenProject?.(i, cardRef.current)
    if (mg.url) window.open(mg.url, '_blank', 'noopener')
  }

  const Card = ({ mg, i, className = '', style }) => {
    const tags = workTags[mg.id] || []
    return (
      <div className={`ix-card ${className}`} style={style}>
        <div className="ix-card-head">
          <span className="label">No. {String(i + 1).padStart(3, '0')}</span>
          <span className="label">{letterOf(mg.label)}</span>
        </div>
        <div className="ix-card-body">
          <div className="ix-card-text">
            <span className="ix-name">{mg.label}</span>
            <span className="ix-tags">{tags.length ? tags.join(' · ') : '—'}</span>
          </div>
          <span className="ix-mark" style={{ '--mark': cssUrl(mg.src), background: mg.color || '#1a1a1a', aspectRatio: `${mg.w} / ${mg.h}` }} aria-hidden="true" />
        </div>
        <div className="ix-card-foot label">{mg.project ? 'Case study →' : mg.url ? 'anchovies.agency ↗' : 'No case study yet'}</div>
      </div>
    )
  }

  const top = cards[at]
  const cur = letterOf(top.label)
  return (
    <div className="ix-tray" role="group" aria-label={`Index of every brand, ${n} cards`}>
      <div className="ix-well">
        {/* The file below: edges of the next few cards */}
        {[3, 2, 1].map((d) => (
          <div key={d} className="ix-card ix-under" style={{ '--d': d }} aria-hidden="true" />
        ))}
        {leaving && <Card mg={cards[leaving.i]} i={leaving.i} className={`is-leaving${leaving.dir < 0 ? ' is-back' : ''}`} />}
        <button
          ref={cardRef}
          type="button"
          className="ix-top"
          key={top.id}
          onClick={() => openCard(top)}
          aria-label={`${top.label}. ${(workTags[top.id] || []).join(', ')}. ${top.project ? 'Open the case study' : top.url ? 'Open the live case study' : 'No case study yet'}`}
        >
          <Card mg={top} i={at} className={leaving ? 'is-arriving' : ''} />
        </button>
      </div>
      <div className="ix-bar">
        <button type="button" className="ix-step label" onClick={() => go(-1)} aria-label="Previous card">
          ←
        </button>
        <div className="ix-tabs" role="group" aria-label="Jump to letter">
          {LETTERS.map((l) => {
            const has = cards.some((c) => letterOf(c.label) === l)
            return (
              <button key={l} type="button" className="ix-tab label" aria-pressed={l === cur} disabled={!has} onClick={() => jump(l)}>
                {l}
              </button>
            )
          })}
        </div>
        <button type="button" className="ix-step label" onClick={() => go(1)} aria-label="Next card">
          →
        </button>
      </div>
      <p className="ix-count label" aria-live="polite">
        {at + 1} / {n}
      </p>
    </div>
  )
}
