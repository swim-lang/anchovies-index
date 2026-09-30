import { useEffect, useRef, useState } from 'react'
import { sfx } from '../motion/sound.js'

/*
 * THE PIXEL TREATMENT (Lex Politica)
 * A photograph of columns, pixelated live. Pixel size, tones and contrast
 * are sliders; squares or dots; black and white or colour. Everything happens
 * in a canvas: the photo is sampled down to one value per block, adjusted, and
 * drawn back up with smoothing off.
 */

const MAX_W = 1400 // canvas pixels across

export default function Pixelator({ photos }) {
  const canvasRef = useRef(null)
  const [which, setWhich] = useState(0)
  const [size, setSize] = useState(14)
  const [tones, setTones] = useState(5)
  const [contrast, setContrast] = useState(20)
  const [mono, setMono] = useState(true)
  const [dots, setDots] = useState(false)
  const [image, setImage] = useState(null)
  const photo = photos[which]

  useEffect(() => {
    let alive = true
    const im = new Image()
    im.onload = () => alive && setImage(im)
    im.src = photo.src
    return () => {
      alive = false
    }
  }, [photo.src])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !image) return
    const W = Math.min(MAX_W, image.naturalWidth)
    const H = Math.round((W * image.naturalHeight) / image.naturalWidth)
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')
    // Sample: one pixel per block.
    const cols = Math.max(1, Math.ceil(W / size))
    const rows = Math.max(1, Math.ceil(H / size))
    const small = document.createElement('canvas')
    small.width = cols
    small.height = rows
    const sctx = small.getContext('2d', { willReadFrequently: true })
    sctx.imageSmoothingQuality = 'high'
    sctx.drawImage(image, 0, 0, cols, rows)
    const data = sctx.getImageData(0, 0, cols, rows)
    const d = data.data
    const k = (259 * (contrast + 255)) / (255 * (259 - contrast)) // contrast factor
    const step = 255 / (tones - 1)
    const q = (v) => Math.round(Math.max(0, Math.min(255, k * (v - 128) + 128)) / step) * step
    for (let i = 0; i < d.length; i += 4) {
      if (mono) {
        const y = q(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
        d[i] = d[i + 1] = d[i + 2] = y
      } else {
        d[i] = q(d[i])
        d[i + 1] = q(d[i + 1])
        d[i + 2] = q(d[i + 2])
      }
    }
    ctx.imageSmoothingEnabled = false
    if (!dots) {
      sctx.putImageData(data, 0, 0)
      ctx.drawImage(small, 0, 0, cols * size, rows * size)
      return
    }
    // Dots: a black ground, each block a dot sized by its brightness.
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
        if (lum <= 0.02) continue
        ctx.fillStyle = mono ? '#fff' : `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`
        ctx.beginPath()
        ctx.arc(x * size + size / 2, y * size + size / 2, (size / 2) * Math.sqrt(mono ? lum : 1) * 1.02, 0, Math.PI * 2)
        ctx.fill()
      }
  }, [image, size, tones, contrast, mono, dots])

  const slider = (label, value, set, min, max, fmt = (v) => v) => (
    <label className="pix-slider">
      <span className="label">
        {label} <b>{fmt(value)}</b>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => (sfx('tick', { throttle: 45 }), set(Number(e.target.value)))} />
    </label>
  )

  return (
    <div className="pix-block">
      <div className="pix-stage">
        <canvas ref={canvasRef} className="pix-canvas" role="img" aria-label={`${photo.alt}, pixelated at ${size}-pixel blocks`} />
      </div>
      <div className="pix-controls">
        {photos.length > 1 && (
        <div className="pix-photos" role="group" aria-label="Photo">
          {photos.map((p, i) => (
            <button key={p.src} type="button" className="pix-thumb" aria-pressed={i === which} onClick={() => setWhich(i)}>
              <img src={p.src} alt="" />
              <span className="label">{p.label}</span>
            </button>
          ))}
        </div>
        )}
        <div className="pix-sliders">
          {slider('Pixel size', size, setSize, 2, 64, (v) => `${v}px`)}
          {slider('Tones', tones, setTones, 2, 16)}
          {slider('Contrast', contrast, setContrast, -60, 120)}
        </div>
        <div className="pix-toggles">
          <button type="button" className="text-btn label" aria-pressed={mono} onClick={() => setMono((m) => !m)}>
            {mono ? 'Black & white' : 'Colour'}
          </button>
          <button type="button" className="text-btn label" aria-pressed={dots} onClick={() => setDots((m) => !m)}>
            {dots ? 'Dots' : 'Squares'}
          </button>
          <button
            type="button"
            className="text-btn label"
            onClick={() => {
              setSize(14)
              setTones(5)
              setContrast(20)
              setMono(true)
              setDots(false)
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
