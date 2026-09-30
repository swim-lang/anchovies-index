import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion/timing.js'

/*
 * A studio Polaroid, brought up close: it lifts out of the drawer to fill the
 * view (grown from where it lay), and a click anywhere, or Escape, puts it back.
 */
export default function PhotoZoom({ item, from, onClose }) {
  const card = useRef(null)
  const [closing, setClosing] = useState(false)
  const reduced = prefersReducedMotion()
  const { photo, video } = item

  // Where it starts, relative to where it ends: a transform from the drawer's rect.
  const offset = () => {
    const to = card.current.getBoundingClientRect()
    const s = from.width / to.width
    return `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${s})`
  }

  useLayoutEffect(() => {
    if (reduced) return
    const el = card.current
    el.style.transition = 'none'
    el.style.transform = offset()
    el.getBoundingClientRect()
    el.style.transition = ''
    el.style.transform = ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    if (closing) return
    if (reduced) return onClose()
    setClosing(true)
    card.current.style.transform = offset()
    setTimeout(onClose, 420)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  const ar = photo.w / photo.h
  return (
    <div className={`photo-zoom${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={photo.alt} onClick={close}>
      <div ref={card} className="photo-zoom-card" style={{ '--ar': ar }}>
        {video ? (
          <video src={video} poster={photo.src} autoPlay={!reduced} muted loop playsInline controls={reduced} />
        ) : (
          <img src={photo.src} alt={photo.alt} />
        )}
      </div>
      <button type="button" className="label photo-zoom-close" onClick={close} autoFocus>
        Close
      </button>
    </div>
  )
}
