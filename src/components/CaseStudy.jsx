import { forwardRef, useState } from 'react'
import Img from './Img.jsx'
import ImageStack from './ImageStack.jsx'
import Lightbox from './Lightbox.jsx'
import Sheet from './Sheet.jsx'
import FlipObject from './FlipObject.jsx'
import GalleryPainting from './GalleryPainting.jsx'
import PlateWindow from './PlateWindow.jsx'
import StampEnvelope from './StampEnvelope.jsx'
import BoardingPass from './BoardingPass.jsx'
import WaxSeal from './WaxSeal.jsx'
import Pixelator from './Pixelator.jsx'
import Highlighter from './Highlighter.jsx'
import SoftHoursDial from './SoftHoursDial.jsx'
import RoseBed from './RoseBed.jsx'
import RedLens from './RedLens.jsx'
import HeartwoodRings from './HeartwoodRings.jsx'

/*
 * CASE-STUDY VIEW
 * An ordinary, vertically scrolling document. Its hero repeats the card's parts
 * (number, rule, category, title, image, disciplines) at editorial scale. They
 * carry the same data-flip names, and that's what the transition pairs up.
 *   kind: 'full'    → complete case study with the image stack
 *   kind: 'preview' → sourced excerpt, linking to the live case study
 */
const CaseStudy = forwardRef(function CaseStudy({ project, onBack, backRef, onLightboxChange }, ref) {
  const [lightbox, setLightbox] = useState(null)
  const p = project
  const setBox = (img) => {
    setLightbox(img)
    onLightboxChange?.(!!img)
  }

  return (
    <main ref={ref} className="case" aria-labelledby="case-title" data-kind={p.kind}>
      <div className="case-bar" data-reveal>
        <button ref={backRef} type="button" className="back label" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to index
        </button>
        <span className="label case-bar-id" aria-hidden="true">
          {p.number} <span className="muted">/ {p.name}</span>
        </span>
      </div>

      <header className="case-hero wrap">
        <div className="hero-head">
          <span className="label" data-flip="num">{p.number}</span>
          <span className="hero-rule" data-flip="rule" />
          <span className="label" data-flip="cat">{p.category}</span>
        </div>
        <h1 className="case-title" id="case-title" tabIndex={-1} style={{ '--chars': p.name.length }}>
          <span data-flip="title">{p.name}</span>
        </h1>
        <div className="case-image" data-flip-image data-aspect={p.cover.w / p.cover.h}>
          <Img image={p.cover} eager fetchPriority="high" draggable={false} />
        </div>
        <div className="hero-foot">
          <span className="label disc" data-flip="disc">{p.meta.deliverables.join(' · ')}</span>
          <span className="label muted" data-reveal>
            {p.meta.location} — {p.meta.year}
          </span>
        </div>
      </header>

      <section className="case-intro wrap" data-reveal>
        <p className="lede">{p.intro}</p>
        <dl className="facts">
          <div><dt className="label">Client</dt><dd>{p.meta.client}</dd></div>
          <div><dt className="label">Industry</dt><dd>{p.meta.industry}</dd></div>
          <div><dt className="label">Location</dt><dd>{p.meta.location}</dd></div>
          <div><dt className="label">Year</dt><dd>{p.meta.year}</dd></div>
          <div className="facts-wide">
            <dt className="label">Deliverables</dt>
            <dd>{p.meta.deliverables.join(', ')}</dd>
          </div>
          {p.meta.website && (
            <div className="facts-wide">
              <dt className="label">Website</dt>
              <dd><a href={p.meta.website.href} target="_blank" rel="noreferrer">{p.meta.website.label} <span aria-hidden="true">↗</span></a></dd>
            </div>
          )}
        </dl>
      </section>

      {p.kind === 'full' ? <FullBody p={p} onEnlarge={setBox} /> : <PreviewBody p={p} onEnlarge={setBox} />}

      <footer className="case-end wrap">
        <button type="button" className="end-back" onClick={onBack}>
          <span className="label">Return</span>
          <span className="end-back-title"><span aria-hidden="true">←</span> Back to the index</span>
        </button>
        <a className="end-link label" href={p.source} target="_blank" rel="noreferrer">
          {p.kind === 'full' ? 'This project on anchovies.agency' : 'Read the full case study on anchovies.agency'}{' '}
          <span aria-hidden="true">↗</span>
        </a>
      </footer>

      <Lightbox image={lightbox} onClose={() => setBox(null)} />
    </main>
  )
})

function FullBody({ p, onEnlarge }) {
  return (
    <>
      <section className="case-identity wrap" aria-label="Identity">
        <figure className="plate">
          <Img image={p.identity} />
        </figure>
        <div className="identity-side">
          <figure className="engraving">
            <Img image={p.engraving} />
          </figure>
          {p.statements.map((s) => (
            <p key={s} className="statement">{s}</p>
          ))}
        </div>
      </section>

      <section className="case-stack" aria-labelledby="stack-heading">
        <div className="section-head wrap">
          <h2 className="label" id="stack-heading">Applications</h2>
          <span className="hero-rule" aria-hidden="true" />
          <p className="label muted">Click or drag the top print</p>
        </div>
        <div className="wrap">
          <ImageStack items={p.stack} onEnlarge={onEnlarge} />
        </div>
      </section>

      {p.sheet && (
        <section className="case-sheet" aria-labelledby="sheet-heading">
          <div className="section-head wrap">
            <h2 className="label" id="sheet-heading">The letterhead</h2>
            <span className="hero-rule" aria-hidden="true" />
            <p className="label muted">Tilt it to the light · hold to pick up</p>
          </div>
          <div className="wrap">
            <Sheet image={p.sheet} caption={p.sheet.caption} />
          </div>
        </section>
      )}

      <ObjectSection p={p} />

      <section className="case-web" aria-label="Website">
        <div className="section-head wrap">
          <h2 className="label">Website</h2>
          <span className="hero-rule" aria-hidden="true" />
          <a className="label" href={p.meta.website.href} target="_blank" rel="noreferrer">
            {p.meta.website.label} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <figure className="wrap web-wide">
          <Img image={p.web[0]} />
        </figure>
        <div className="wrap web-grid">
          <p className="story">{p.story}</p>
          <figure className="web-inset">
            <Img image={p.web[1]} />
          </figure>
        </div>
      </section>
    </>
  )
}

function PreviewBody({ p, onEnlarge }) {
  return (
    <>
      <section className="case-preview wrap" aria-label="Overview">
        <div className="preview-text">
          {p.statements.map((s) => (
            <p key={s} className="statement">{s}</p>
          ))}
          <p className="story">{p.story}</p>
          <p className="label muted preview-note">Preview: an excerpt from the live case study</p>
        </div>
        <figure className="preview-a">
          <Img image={p.feature} />
        </figure>
      </section>

      <ObjectSection p={p} />

      {p.stack?.length > 0 && (
        <section className="case-stack" aria-labelledby="stack-heading">
          <div className="section-head wrap">
            <h2 className="label" id="stack-heading">Applications</h2>
            <span className="hero-rule" aria-hidden="true" />
            <p className="label muted">Click or drag the top print</p>
          </div>
          <div className="wrap">
            <ImageStack items={p.stack} onEnlarge={onEnlarge} />
          </div>
        </section>
      )}
    </>
  )
}

// Hands-on objects for each project, built from the files the studio supplied.
function ObjectSection({ p }) {
  const objects = []
  if (p.stamps)
    objects.push(['stamps', 'The stamps', 'Drag them onto the envelope', <StampEnvelope envelope={p.stamps.envelope} stamps={p.stamps.set} />])
  if (p.seal) objects.push(['seal', 'Sealed', 'Click the envelope', <WaxSeal mark={p.seal.mark} caption="The griffin symbolizes the union of traditional power and visionary precision." />])
  if (p.highlight)
    objects.push(['highlight', 'The highlighter', 'Drag across the words', <Highlighter text={p.highlight.text} marks={p.highlight.marks} color={p.highlight.color} caption="Talent worth your attention." />])
  if (p.pixel) objects.push(['pixel', 'The pixel treatment', 'Drag the sliders', <Pixelator photos={p.pixel} />])
  if (p.pass) objects.push(['pass', 'The boarding pass', 'Tear off the stub', <BoardingPass front={p.pass.front} back={p.pass.back} perf={p.pass.perf} />])
  if (p.card) objects.push(['card', 'The business card', 'Drag to turn it over', <FlipObject front={p.card.front} back={p.card.back} label="Business card" />])
  if (p.dial) objects.push(['dial', 'The watch face', 'For the first hour and the last', <SoftHoursDial mark={p.dial.mark} caption="For the first hour and the last." />])
  if (p.tag) objects.push(['tag', 'The hang tag', 'Push it · drag to turn it over', <FlipObject front={p.tag.front} back={p.tag.back} label="Hang tag" hang />])
  if (p.garden) objects.push(['garden', 'The flower bed', 'Click to plant', <RoseBed gardener={p.garden.gardener} />])
  if (p.painting)
    objects.push([
      'painting',
      'The painting',
      'Hover for the loupe · click to walk up',
      <GalleryPainting full={p.painting.full} preview={p.painting.preview} caption="The canyon painting from the Garza identity" />,
    ])
  if (p.plate)
    objects.push([
      'plate',
      'The symbol',
      'Drill the plate',
      <PlateWindow mark={p.plate.mark} behind={p.plate.behind} caption="Perforated steel plates, forming a symbol that also reads as an abstract 88" />,
    ])
  if (p.redLens)
    objects.push(['red-lens', 'Through red lenses', 'Drag the glasses', <RedLens image={p.redLens.image} colors={p.redLens.colors} caption={p.statements?.[0]} />])
  if (p.rings) objects.push(['rings', 'The rings', 'Spin them', <HeartwoodRings mark={p.rings.mark} caption={p.statements?.[1]} />])
  return objects.map(([id, title, hint, body]) => (
    <section key={id} className="case-object" aria-labelledby={`object-${p.id}-${id}`}>
      <div className="section-head wrap">
        <h2 className="label" id={`object-${p.id}-${id}`}>{title}</h2>
        <span className="hero-rule" aria-hidden="true" />
        <p className="label muted">{hint}</p>
      </div>
      <div className="wrap">{body}</div>
    </section>
  ))
}

export default CaseStudy
