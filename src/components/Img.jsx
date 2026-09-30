import { useState } from 'react'

/*
 * Image with reserved proportions. If a file fails to load, it shows a quiet
 * placeholder naming the missing file, never a broken-image icon or a substitute.
 */
export default function Img({ image, eager = false, className = '', alt, ...rest }) {
  const [failed, setFailed] = useState(false)
  const file = image.src.split('/').pop()

  if (failed) {
    return (
      <span
        className={`img-missing ${className}`}
        style={{ aspectRatio: `${image.w} / ${image.h}` }}
        role="img"
        aria-label={`Missing image: ${alt ?? image.alt}`}
      >
        <span className="label">Missing asset</span>
        <span className="label">{file}</span>
      </span>
    )
  }

  return (
    <img
      className={className}
      src={image.src}
      width={image.w}
      height={image.h}
      alt={alt ?? image.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}
