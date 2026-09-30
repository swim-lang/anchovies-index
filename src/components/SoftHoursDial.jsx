/*
 * THE WATCH FACE (Soft Hours)
 * The identity came from vintage women's watches and the railroad minute tracks
 * around their faces. The supplied watch-face lockup, large and still, in the
 * brand's own two colours (Soft Black on Linen, from its identity guide).
 */
export default function SoftHoursDial({ mark, caption }) {
  return (
    <div className="dial-block">
      <div className="dial-stage">
        <img className="dial" src={mark.src} alt={mark.alt} />
      </div>
      <div className="stack-bar">
        <p className="stack-caption">
          <span className="label">
            Watch face<span className="stack-kind"> · the lockup</span>
          </span>
          <span className="stack-text">{caption}</span>
        </p>
      </div>
    </div>
  )
}
