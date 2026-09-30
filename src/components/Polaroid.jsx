import { forwardRef } from 'react'

/*
 * One team Polaroid. The front is the studio's own scan, frame and all, with
 * the person's name and role set on the white strip. The back is modelled
 * on a paper-backed print: matte and light.
 * Click to turn it over, drag to move it.
 */
const Polaroid = forwardRef(function Polaroid({ person, flipped, onTurn, style, handlers }, ref) {
  return (
    <article
      ref={ref}
      className={`polaroid postcard${flipped ? ' is-flipped' : ''}`}
      aria-label={`Polaroid: ${person.name}`}
      style={{ ...style, '--pw': `${style.width}px` }}
      {...handlers}
    >
      <div className="pc-turn">
        <div className="pola-face pola-front">
          <img src={person.photo.src} alt={person.photo.alt} draggable={false} />
          <span className="pola-sheen" aria-hidden="true" />
          <span className="pola-caption" aria-hidden="true">
            <span className="pola-caption-name">{person.name}</span>
            <span className="pola-caption-role label">{person.role}</span>
          </span>
        </div>
        <div className="pola-face pola-back" aria-hidden={!flipped}>
          <p className="pola-name">{person.name}</p>
          <p className="pola-role label">{person.role}</p>
          <ul className="pola-tags label">
            {person.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="pola-line">“{person.line}”</p>
        </div>
      </div>
      <button
        type="button"
        className="pola-button"
        onClick={onTurn}
        aria-label={`${flipped ? 'Turn back to the photo of' : 'Turn over the Polaroid of'} ${person.name}`}
        aria-pressed={flipped}
      />
      {flipped && (
        <span className="sr-only" aria-live="polite">
          {person.name}, {person.role}. {person.tags.join(', ')}. {person.line}
        </span>
      )}
    </article>
  )
})

export default Polaroid
