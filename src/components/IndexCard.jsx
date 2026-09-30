import { forwardRef } from 'react'
import Img from './Img.jsx'

/*
 * One card in the rotary file. The front face carries the same data-flip parts
 * as the case-study hero, which is how the opening transition pairs them up.
 * The tab sticks up above the card so the index stays readable when cards sit
 * behind one another. The back is plain card stock, seen when a card flips over the ring.
 */
const IndexCard = forwardRef(function IndexCard(
  { project, index, count, active, onActivate, onPreload, buttonRef, eager },
  ref,
) {
  const verb = project.kind === 'full' ? 'Open case study' : 'Open preview'
  const label = active ? `${verb}: ${project.name}` : `Show ${project.name}`

  return (
    <article
      ref={ref}
      className={`card${active ? ' is-active' : ''}`}
      data-id={project.id}
      aria-roledescription="index card"
      aria-label={`${project.number}, ${project.name}`}
      style={{ '--tab-slot': count > 1 ? index / (count - 1) : 0 }}
    >
      <div className="card-face">
        <div className="card-recede">
          <div className="card-lift">
            <button
              type="button"
              className="card-tab label"
              tabIndex={-1}
              aria-hidden="true"
              onClick={onActivate}
            >
              <span className="tab-num">{project.number}</span>
              <span className="tab-name">{project.name}</span>
            </button>
            <div className="card-paper" data-card-paper>
              <div className="card-shade" aria-hidden="true" />
              <header className="hero-head">
                <span className="label" data-flip="num">{project.number}</span>
                <span className="hero-rule" data-flip="rule" />
                <span className="label" data-flip="cat">{project.category}</span>
              </header>
              <h2 className="card-title" style={{ '--chars': project.name.length }}>
                <span data-flip="title">{project.name}</span>
              </h2>
              <div className="card-image" data-flip-image data-aspect={project.cover.w / project.cover.h}>
                <Img image={project.cover} eager={eager} draggable={false} />
              </div>
              <footer className="card-foot">
                <span className="label disc" data-flip="disc">
                  {project.meta.deliverables.join(' · ')}
                </span>
                <span className="card-open label" aria-hidden="true">
                  {project.kind === 'full' ? 'Open' : 'Preview'} <span className="arrow">↑</span>
                </span>
              </footer>
              <button
                ref={buttonRef}
                type="button"
                className="card-button"
                tabIndex={active ? 0 : -1}
                aria-label={label}
                onClick={onActivate}
                onPointerEnter={onPreload}
                onFocus={onPreload}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card-back" aria-hidden="true" />
    </article>
  )
})

export default IndexCard
