import { useEffect, useRef } from 'react'
import Img from './Img.jsx'

/*
 * Enlarged view. A native <dialog> provides the focus trap and the top layer.
 * Escape closes it first, before any case-study-level handler runs.
 */
export default function Lightbox({ image, onClose }) {
  const ref = useRef(null)
  const returnTo = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (image && !d.open) {
      returnTo.current = document.activeElement
      d.showModal()
    }
    if (!image && d.open) {
      d.close()
      returnTo.current?.focus({ preventScroll: true })
    }
  }, [image])

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={image ? image.caption || image.alt : 'Image'}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {image && (
        <figure className="lightbox-figure" onClick={(e) => e.target.tagName !== 'IMG' && onClose()}>
          <Img image={image} eager className="lightbox-img" />
          <figcaption className="lightbox-caption">
            <span className="label">{image.label}</span>
            <span>{image.caption}</span>
          </figcaption>
        </figure>
      )}
      <button type="button" className="lightbox-close label" onClick={onClose} autoFocus>
        Close <span aria-hidden="true">✕</span>
      </button>
    </dialog>
  )
}
