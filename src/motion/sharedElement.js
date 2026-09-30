/*
 * OPENING & CLOSING TRANSITION: card ⇄ case study, as a shared element.
 *
 * The index card and the case-study hero are built from the same parts,
 * tagged in the markup:
 *
 *   data-flip="num | rule | cat | title | disc"  → translate + uniform scale (the rule scales in x only)
 *   data-flip-image                              → the image frame (see below)
 *   data-reveal                                  → case content that arrives after the move
 *
 * The case-study root is the card's paper. It starts clipped to the card's
 * rectangle and grows to the viewport, so the card itself becomes the page.
 *
 * The image never changes file and never distorts. The frame's clip window
 * moves from the card's image window to the hero window. The <img> is laid out
 * at its "cover" size and only translated and uniformly scaled. Both ends are
 * exact `cover` crops, and the crop in between changes continuously.
 *
 * One rAF clock (tween.js) writes every value from the same progress, so the
 * parts stay locked together. Only transform, clip-path and opacity change.
 */
import { DUR, EASE_FADE, settled, wait } from './timing.js'
import { bezier, lerp, tween } from './tween.js'

const ease = bezier(0.32, 0.72, 0, 1) // same curve as --ease-out in CSS
const rectOf = (el) => el.getBoundingClientRect()

// Where an image of aspect `a` paints when it covers `box`, centred.
function cover(a, box) {
  const boxA = box.width / box.height
  const w = boxA > a ? box.width : box.height * a
  const h = w / a
  return { x: box.left + (box.width - w) / 2, y: box.top + (box.height - h) / 2, w, h }
}

// Insets [top, right, bottom, left] that clip `outer` down to `inner`.
const insets = (outer, inner) => [
  inner.top - outer.top,
  outer.right - inner.right,
  outer.bottom - inner.bottom,
  inner.left - outer.left,
]
const ZERO = [0, 0, 0, 0]
const insetCss = (a, b, t) => `inset(${a.map((v, i) => `${lerp(v, b[i], t)}px`).join(' ')})`

/** Measure the parts of an index card, in viewport coordinates. */
export function snapshotCard(cardEl) {
  const parts = {}
  cardEl.querySelectorAll('[data-flip]').forEach((el) => {
    parts[el.dataset.flip] = rectOf(el)
  })
  // Some sources (a fridge magnet) have no photograph: the page grows from them and the hero fades in.
  const paper = cardEl.querySelector('[data-card-paper]') || cardEl
  const image = cardEl.querySelector('[data-flip-image]')
  return {
    paper: rectOf(paper),
    image: image ? rectOf(image) : null,
    parts,
  }
}

// Offset + scale that maps a part's current rect onto another rect.
function partDelta(el, target) {
  const cur = rectOf(el)
  const s = cur.width ? target.width / cur.width : 1
  return { el, dx: target.left - cur.left, dy: target.top - cur.top, s, xOnly: el.dataset.flip === 'rule' }
}

// t = 0 → at `target`; t = 1 → natural position.
function applyPart(d, t) {
  const k = 1 - t
  const s = lerp(d.s, 1, t)
  d.el.style.transform = `translate(${d.dx * k}px, ${d.dy * k}px) ${d.xOnly ? `scaleX(${s})` : `scale(${s})`}`
}

// Lay the <img> out at its cover rect inside the frame so it can scale uniformly.
function pinImage(frame, img) {
  const F = rectOf(frame)
  const aspect = Number(frame.dataset.aspect) || img.naturalWidth / img.naturalHeight || 1.5
  const p = cover(aspect, F)
  Object.assign(img.style, {
    position: 'absolute',
    left: `${p.x - F.left}px`,
    top: `${p.y - F.top}px`,
    width: `${p.w}px`,
    height: `${p.h}px`,
    maxWidth: 'none',
    objectFit: 'fill',
    transformOrigin: '0 0',
  })
  frame.style.overflow = 'visible'
  return { F, aspect, p }
}

// Clip + image transform that make the hero frame look exactly like `cardImage`.
function imageDelta(frame, img, cardImage) {
  const { F, aspect, p } = pinImage(frame, img)
  const c = cover(aspect, cardImage)
  return { clip: insets(F, cardImage), tx: c.x - p.x, ty: c.y - p.y, s: c.w / p.w }
}

function applyImage(frame, img, d, t) {
  const k = 1 - t
  frame.style.clipPath = insetCss(d.clip, ZERO, t)
  img.style.transform = `translate(${d.tx * k}px, ${d.ty * k}px) scale(${lerp(d.s, 1, t)})`
}

function release(root) {
  root.style.clipPath = ''
  root.querySelectorAll('[data-flip]').forEach((el) => {
    el.style.transform = ''
    el.style.transformOrigin = ''
    el.style.opacity = ''
  })
  const frame = root.querySelector('[data-flip-image]')
  const img = frame?.querySelector('img')
  if (frame) Object.assign(frame.style, { clipPath: '', overflow: '', opacity: '' })
  if (img) {
    ;['position', 'left', 'top', 'width', 'height', 'maxWidth', 'objectFit', 'transformOrigin', 'transform'].forEach(
      (k) => (img.style[k] = ''),
    )
  }
}

/**
 * Card → case study. `root` is mounted with data-motion="entering", which fixes
 * it to the viewport. Call this before first paint (from a layout effect).
 */
export async function animateOpen({ root, from, reduced }) {
  // Hero parts the card doesn't have (e.g. a postcard has no rule) arrive with the content.
  const unmatched = [...root.querySelectorAll('[data-flip]')].filter((el) => !from.parts[el.dataset.flip])
  const heroImage = from.image ? [] : [...root.querySelectorAll('[data-flip-image]')]
  const reveal = [...unmatched, ...heroImage, ...root.querySelectorAll('[data-reveal]')]

  if (reduced) {
    await settled([root.animate({ opacity: [0, 1] }, { duration: DUR.reduced })], DUR.reduced)
    return
  }

  const R = rectOf(root)
  const rootClip = insets(R, from.paper)
  const parts = [...root.querySelectorAll('[data-flip]')]
    .filter((el) => from.parts[el.dataset.flip])
    .map((el) => {
      el.style.transformOrigin = '0 0'
      return partDelta(el, from.parts[el.dataset.flip])
    })
  const frame = root.querySelector('[data-flip-image]')
  const img = frame?.querySelector('img')
  const image = frame && img && from.image ? imageDelta(frame, img, from.image) : null

  const update = (t) => {
    root.style.clipPath = insetCss(rootClip, ZERO, t)
    parts.forEach((d) => applyPart(d, t))
    if (image) applyImage(frame, img, image, t)
  }

  // First frame: the case study looks exactly like the card.
  update(0)
  reveal.forEach((el) => (el.style.opacity = '0'))

  // Start the clock only once the hero pixels are ready (it's the card's own file, so usually instant).
  if (img?.decode) await Promise.race([img.decode().catch(() => {}), wait(150)])

  // Content arrives once the new layout has been established.
  reveal.forEach((el, i) => {
    el.animate(
      { opacity: [0, 1], transform: ['translateY(14px)', 'none'] },
      { duration: DUR.reveal, delay: DUR.open * 0.58 + i * 55, easing: EASE_FADE, fill: 'backwards' },
    )
    el.style.opacity = ''
  })

  await tween({ duration: DUR.open, ease, update })
  release(root)
}

/**
 * Case study → card. Works from any scroll depth.
 *
 *  1. Body content fades. If the hero is scrolled out of view, the hero parts fade too
 *     (the staging beat), so the page can return to the top without showing a scroll.
 *  2. The root is pinned in place with position: fixed, and the window scroll resets
 *     underneath it with nothing visibly moving.
 *  3. The paper, image and type travel back into the card's exact geometry.
 *
 * `getCard` is called after step 2, so the index is measured as it will be.
 */
export async function animateClose({ root, getCard, reduced, onMove }) {
  const vh = window.innerHeight

  if (reduced) {
    await settled([root.animate({ opacity: [1, 0] }, { duration: DUR.reduced, fill: 'forwards' })], DUR.reduced)
    window.scrollTo(0, 0)
    onMove?.()
    return
  }

  const probe = getCard()
  const cardKeys = probe?.parts ?? {}
  const unmatched = [...root.querySelectorAll('[data-flip]')].filter((el) => !cardKeys[el.dataset.flip])
  const heroImage = probe?.image ? [] : [...root.querySelectorAll('[data-flip-image]')]
  const reveal = [...unmatched, ...heroImage, ...root.querySelectorAll('[data-reveal]')]
  const partEls = [...root.querySelectorAll('[data-flip]')].filter((el) => cardKeys[el.dataset.flip])
  const frame = root.querySelector('[data-flip-image]')
  const img = frame?.querySelector('img')

  const heroRect = frame ? rectOf(frame) : { bottom: vh }
  const staged = heroRect.bottom < vh * 0.35
  const heroEls = [...partEls, frame].filter(Boolean)

  const fadeOpts = { duration: DUR.stage, easing: EASE_FADE, fill: 'forwards' }
  const fades = reveal.map((el) => el.animate({ opacity: [1, 0] }, fadeOpts))
  const heroFades = staged ? heroEls.map((el) => el.animate({ opacity: [1, 0] }, fadeOpts)) : []
  await settled([...fades, ...heroFades], DUR.stage)

  // Pin the page where it is, then reset scroll beneath it.
  const y = window.scrollY
  root.style.setProperty('--leave-top', staged ? '0px' : `${-y}px`)
  root.dataset.motion = 'leaving'
  window.scrollTo(0, 0)

  onMove?.()
  const card = getCard()
  if (!card) return

  const R = rectOf(root)
  const rootFrom = [-R.top, 0, R.bottom - vh, 0]
  const rootTo = insets(R, card.paper)
  const parts = partEls
    .filter((el) => card.parts[el.dataset.flip])
    .map((el) => {
      el.style.transformOrigin = '0 0'
      return partDelta(el, card.parts[el.dataset.flip])
    })
  const image = frame && img && card.image ? imageDelta(frame, img, card.image) : null

  if (staged) {
    // The hero comes back into view as it travels, rather than popping in.
    heroEls.forEach((el) => (el.style.opacity = '0'))
    heroFades.forEach((a) => a.cancel())
  }

  await tween({
    duration: DUR.close,
    ease,
    update: (e) => {
      const t = 1 - e // 1 = case layout, 0 = card
      root.style.clipPath = insetCss(rootTo, rootFrom, t)
      parts.forEach((d) => applyPart(d, t))
      if (image) applyImage(frame, img, image, t)
      if (staged) {
        const o = String(Math.min(1, e / 0.3))
        heroEls.forEach((el) => (el.style.opacity = o))
      }
    },
  })
}
