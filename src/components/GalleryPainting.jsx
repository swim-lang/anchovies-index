import { useEffect, useRef, useState } from 'react'
import PaintingViewer from './PaintingViewer.jsx'
import { sfx } from '../motion/sound.js'

/*
 * ON THE WALL (Garza)
 * The canyon painting hung as it would be in a gallery: a black float frame,
 * a white mat, a picture light above. Move over it and a loupe shows the
 * brushwork from the full-resolution file (scroll to change the loupe's power).
 * "Walk up to it" swaps the wall for the pan-and-zoom viewer.
 */

const LOUPE = 220 // px across

export default function GalleryPainting({ full, preview, caption }) {
  const [close, setClose] = useState(false)
  const [loupe, setLoupe] = useState(null) // { x, y, fx, fy } — position in the art, fractions of it
  const [power, setPower] = useState(1) // 1 = one file pixel per screen pixel
  const [hiRes, setHiRes] = useState(false)
  const artRef = useRef(null)
  const loupeOn = useRef(false)
  loupeOn.current = !!loupe

  // Scroll changes the loupe's power while it's up (non-passive, so the page stays put).
  useEffect(() => {
    const el = artRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!loupeOn.current) return
      e.preventDefault()
      setPower((p) => Math.max(0.35, Math.min(2, p * Math.exp(-e.deltaY * 0.002))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [close])

  if (close)
    return (
      <div className="gallery-close">
        <PaintingViewer full={full} preview={preview} caption={caption} />
        <button type="button" className="text-btn label gallery-back" onClick={() => setClose(false)}>
          ← Back to the wall
        </button>
      </div>
    )

  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    const r = artRef.current.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return setLoupe(null)
    setHiRes(true)
    setLoupe({ x: e.clientX - r.left, y: e.clientY - r.top, fx, fy, w: r.width })
  }

  // The loupe shows the file at `power` × its own pixels, centred on the pointer.
  const bw = full.w * power
  const bh = full.h * power

  return (
    <div className="gallery-block">
      <div className="gallery-wall">
        <div className="gallery-light" aria-hidden="true" />
        <div className="gallery-frame">
          <div className="gallery-mat">
            <div
              ref={artRef}
              className="gallery-art"
              style={{ aspectRatio: `${full.w} / ${full.h}` }}
              onPointerMove={onMove}
              onPointerLeave={() => setLoupe(null)}
              onClick={() => (sfx('pop'), setClose(true))}
            >
              <img src={preview.src} alt={full.alt} draggable={false} />
              {loupe && (
                <div
                  className="gallery-loupe"
                  aria-hidden="true"
                  style={{
                    width: LOUPE,
                    height: LOUPE,
                    left: loupe.x - LOUPE / 2,
                    top: loupe.y - LOUPE / 2,
                    backgroundImage: `url(${hiRes ? full.src : preview.src})`,
                    backgroundSize: `${bw}px ${bh}px`,
                    backgroundPosition: `${LOUPE / 2 - loupe.fx * bw}px ${LOUPE / 2 - loupe.fy * bh}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <p className="gallery-plaque">
          <span className="label">Garza</span>
          <span>{caption}</span>
        </p>
      </div>
      <div className="stack-bar">
        <p className="stack-caption">
          <span className="label">
            Loupe {Math.round(power * 100)}%<span className="stack-kind"> · move over the painting · scroll to change the power</span>
          </span>
          <span className="stack-text">Click the painting to walk up to it.</span>
        </p>
        <div className="stack-controls">
          <button type="button" className="text-btn label" onClick={() => setClose(true)}>
            Walk up to it
          </button>
        </div>
      </div>
    </div>
  )
}
