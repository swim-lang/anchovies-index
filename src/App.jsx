import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { projects } from './content/projects.js'
import RotaryIndex from './components/Index.jsx'
import DrawerIndex from './components/DrawerIndex.jsx'
import CaseStudy from './components/CaseStudy.jsx'
import { animateClose, animateOpen, snapshotCard } from './motion/sharedElement.js'
import { prefersReducedMotion } from './motion/timing.js'
import { sfx } from './motion/sound.js'

/*
 * PROJECT SELECTION & STATE
 *
 *   index ──open──▶ opening ──▶ case ──close──▶ closing ──▶ index
 *
 * Every transition is guarded by `phase`, so repeated clicks, Escape and the
 * browser's Back button can't interleave. A Back pressed mid-opening is queued
 * and runs as soon as the opening lands.
 */

const idFromHash = () => {
  const m = window.location.hash.match(/^#\/([\w-]+)/)
  return m ? projects.findIndex((p) => p.id === m[1]) : -1
}

// The drawer is the default index. ?index=rotary brings back the rotary card file.
const IndexView =
  new URLSearchParams(window.location.search).get('index') === 'rotary' ? RotaryIndex : DrawerIndex

export default function App() {
  const initial = useRef(idFromHash()).current
  const [active, setActive] = useState(initial >= 0 ? initial : 0)
  const [openIndex, setOpenIndex] = useState(initial >= 0 ? initial : null)
  const [phase, _setPhase] = useState(initial >= 0 ? 'case' : 'index')
  const [receded, setReceded] = useState(initial >= 0)

  const phaseRef = useRef(phase)
  const setPhase = (p) => {
    phaseRef.current = p
    _setPhase(p)
  }
  const activeRef = useRef(active)
  activeRef.current = active
  const openRef = useRef(openIndex)
  openRef.current = openIndex

  const cardEls = useRef([])
  const buttonEls = useRef([])
  const caseRef = useRef(null)
  const backRef = useRef(null)
  const fromRef = useRef(null)
  const pendingClose = useRef(false)
  const lightboxOpen = useRef(false)

  // A deep link lands on the case, with the index sitting one Back step behind it.
  useEffect(() => {
    if (initial < 0) return
    const url = window.location.pathname + window.location.search
    history.replaceState(null, '', url)
    history.pushState({ project: projects[initial].id }, '', `#/${projects[initial].id}`)
  }, [initial])

  // ── Open ─────────────────────────────────────────────────────────────────
  // `el` lets something other than the project's postcard (a fridge magnet) be where it opens from.
  const sourceRef = useRef(null)
  const open = useCallback((i, { fromHistory = false, el = null } = {}) => {
    if (phaseRef.current !== 'index') return
    const card = el || cardEls.current[i]
    if (!card) return
    sourceRef.current = el
    fromRef.current = snapshotCard(card)
    window.scrollTo(0, 0)
    if (!fromHistory) history.pushState({ project: projects[i].id }, '', `#/${projects[i].id}`)
    setPhase('opening')
    sfx('open')
    setReceded(true)
    setOpenIndex(i)
  }, [])

  // Runs after the case study mounts and before it paints.
  useLayoutEffect(() => {
    const root = caseRef.current
    if (phase !== 'opening' || !root) return
    const reduced = prefersReducedMotion()
    if (!reduced) root.dataset.motion = 'entering'
    animateOpen({ root, from: fromRef.current, reduced }).then(() => {
      delete root.dataset.motion
      setPhase('case')
      root.querySelector('#case-title')?.focus({ preventScroll: true })
      if (pendingClose.current) {
        pendingClose.current = false
        setTimeout(close, 0) // a task, not rAF: must run even if frames aren't painting
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Close ────────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    if (phaseRef.current === 'opening') {
      pendingClose.current = true
      return
    }
    if (phaseRef.current !== 'case' || !caseRef.current) return
    setPhase('closing')
    sfx('close')
    const i = activeRef.current
    animateClose({
      root: caseRef.current,
      reduced: prefersReducedMotion(),
      getCard: () => snapshotCard(sourceRef.current || cardEls.current[i]),
      onMove: () => setReceded(false),
    }).then(() => {
      flushSync(() => {
        setOpenIndex(null)
        setPhase('index')
      })
      const back = sourceRef.current
      sourceRef.current = null
      ;(back?.querySelector('button') || back || buttonEls.current[i])?.focus({ preventScroll: true })
    })
  }, [])

  // UI "Back to index": step back through history when we added the entry,
  // so the browser's Back and the on-page control stay in agreement.
  const back = useCallback(() => {
    if (phaseRef.current !== 'case' && phaseRef.current !== 'opening') return
    if (history.state?.project) history.back()
    else close()
  }, [close])

  // ── Browser history ──────────────────────────────────────────────────────
  useEffect(() => {
    const onPop = (e) => {
      // A hand-edited hash arrives without state: honour the hash itself.
      const fromHash = idFromHash()
      const id = e.state?.project ?? (fromHash >= 0 ? projects[fromHash].id : null)
      if (!id) return close()
      if (!e.state?.project) history.replaceState({ project: id }, '', window.location.hash)
      if (openRef.current !== null && projects[openRef.current]?.id !== id) return close()
      const i = projects.findIndex((p) => p.id === id)
      if (i < 0 || phaseRef.current !== 'index') return
      if (i === activeRef.current) open(i, { fromHistory: true })
      else {
        setActive(i)
        setTimeout(() => open(i, { fromHistory: true }), prefersReducedMotion() ? 0 : 480)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [close, open])

  // ── Escape: nested view first, then the case study ───────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || lightboxOpen.current) return
      if (phaseRef.current === 'case') back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [back])

  useEffect(() => {
    document.documentElement.classList.toggle('case-open', phase === 'case')
  }, [phase])

  return (
    <>
      <IndexView
        projects={projects}
        startOpen={initial >= 0}
        active={active}
        onActiveChange={setActive}
        onOpen={(i, el) => open(i, { el })}
        receded={receded}
        busy={phase !== 'index'}
        hidden={phase === 'case'}
        cardEls={cardEls}
        buttonEls={buttonEls}
      />
      {openIndex !== null && (
        <CaseStudy
          key={projects[openIndex].id}
          ref={caseRef}
          project={projects[openIndex]}
          onBack={back}
          backRef={backRef}
          onLightboxChange={(v) => (lightboxOpen.current = v)}
        />
      )}
    </>
  )
}
