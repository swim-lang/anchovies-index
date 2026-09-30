import { forwardRef } from 'react'
import Img from './Img.jsx'

/*
 * A postcard for one project. The front is the project's own image, printed
 * with a white border and a caption strip. Its parts carry the same data-flip
 * names as the case-study hero, so the card can become the page. The back is
 * set like a postcard back: message on the left, address lines and a stamp box on the right.
 * The paper grain and sheen are overlays; the artwork underneath is untouched.
 */
const Postcard = forwardRef(function Postcard(
  { project, buttonRef, onOpen, onTurn, onPreload, flipped, eager, style, handlers },
  ref,
) {
  const verb = project.kind === 'full' ? 'Open case study' : 'Open preview'
  const m = project.meta

  return (
    <article
      ref={ref}
      className={`postcard${flipped ? ' is-flipped' : ''}`}
      data-id={project.id}
      aria-label={`${project.number}, ${project.name}`}
      style={style}
      {...handlers}
    >
      <div className="pc-turn">
        {/* Front */}
        <div className="pc-face pc-front" data-card-paper>
          <div className="pc-image" data-flip-image data-aspect={project.cover.w / project.cover.h}>
            <Img image={project.cover} eager={eager} draggable={false} />
          </div>
          <div className="pc-caption">
            <span className="pc-title">
              <span data-flip="title">{project.name}</span>
            </span>
            <span className="label pc-cat" data-flip="cat">{project.category}</span>
          </div>
          <span className="pc-grain" aria-hidden="true" />
          <span className="pc-sheen" aria-hidden="true" />
          <button
            ref={buttonRef}
            type="button"
            className="card-button"
            aria-label={`${verb}: ${project.name}`}
            aria-describedby={`pc-hint-${project.id}`}
            onClick={onOpen}
            onFocus={onPreload}
            tabIndex={flipped ? -1 : 0}
          />
        </div>

        {/* Back */}
        <div className="pc-face pc-back" aria-hidden={!flipped}>
          <div className="pc-back-message">
            <p className="label muted">
              {project.number} · {project.category}
            </p>
            <p className="pc-back-title">{project.name}</p>
            <p className="pc-back-intro">{project.intro}</p>
            <p className="label pc-back-disc">{m.deliverables.join(' · ')}</p>
          </div>
          <span className="pc-back-divider" aria-hidden="true" />
          <div className="pc-back-address">
            <span className="pc-stamp" aria-hidden="true">
              <span className="label">{project.number}</span>
            </span>
            <p className="pc-line"><span className="label muted">Client</span> {m.client}</p>
            <p className="pc-line"><span className="label muted">From</span> {m.location}</p>
            <p className="pc-line"><span className="label muted">Year</span> {m.year}</p>
            <button type="button" className="pc-back-open label" onClick={onOpen} tabIndex={flipped ? 0 : -1}>
              {verb} <span aria-hidden="true">→</span>
            </button>
          </div>
          <span className="pc-grain" aria-hidden="true" />
        </div>
      </div>

      <button
        type="button"
        className="pc-turn-btn"
        onClick={onTurn}
        aria-label={`Turn over ${project.name}`}
        title="Turn over"
      >
        <span aria-hidden="true">↻</span>
      </button>
      <span id={`pc-hint-${project.id}`} className="sr-only">
        Drag to move. Arrow keys nudge it. Turn over for details.
      </span>
    </article>
  )
})

export default Postcard
