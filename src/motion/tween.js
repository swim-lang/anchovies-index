/*
 * A single-clock tween. Every element in the shared-element move is written from
 * the same eased progress value in the same frame. Paper, image, clip and type
 * therefore can't drift apart, whichever thread the browser would have picked for
 * separate CSS or WAAPI animations.
 *
 * If rAF stops (a hidden tab), a timer completes the tween so the interface
 * never gets stuck between states.
 */

// cubic-bezier(x1, y1, x2, y2) as a function of linear time, with the same
// Newton/bisection approach browsers use.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      if (Math.abs(e) < 1e-6) return sy(t)
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0
    let hi = 1
    t = x
    while (hi - lo > 1e-6) {
      if (sx(t) < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}

export const lerp = (a, b, t) => a + (b - a) * t

export function tween({ duration, ease, update }) {
  return new Promise((resolve) => {
    let start = null
    let done = false
    const finish = () => {
      if (done) return
      done = true
      update(1)
      resolve()
    }
    const frame = (now) => {
      if (done) return
      if (start === null) start = now
      const t = Math.min(1, (now - start) / duration)
      update(ease(t))
      if (t < 1) requestAnimationFrame(frame)
      else finish()
    }
    update(0)
    requestAnimationFrame(frame)
    setTimeout(finish, duration + 400)
  })
}
