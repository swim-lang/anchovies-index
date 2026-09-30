// Shared motion vocabulary. One place to tune the feel of the whole piece.

export const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)' // heavy, long settle; no overshoot
export const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'
export const EASE_FADE = 'cubic-bezier(0.2, 0, 0, 1)'

// Add ?slowmo=8 to the URL to inspect the transitions at 1/8 speed.
const SLOW =
  (typeof location !== 'undefined' && Number(new URLSearchParams(location.search).get('slowmo'))) || 1

export const DUR = {
  open: 720 * SLOW, // card → case study
  close: 640 * SLOW, // case study → card
  stage: 200 * SLOW, // fade before a close that starts deep in the page
  reveal: 460 * SLOW, // body content arriving after the move
  reduced: 200 * SLOW, // dissolve used when prefers-reduced-motion
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Resolve when an Animation finishes, is cancelled, or after a safety timeout.
// Transitions must never leave the interface stuck, even in a background tab
// where animations can be throttled.
export function settled(animations, timeout) {
  const list = animations.filter(Boolean)
  const done = Promise.all(list.map((a) => a.finished.catch(() => {})))
  return Promise.race([done, new Promise((r) => setTimeout(r, timeout + 250))])
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()))
