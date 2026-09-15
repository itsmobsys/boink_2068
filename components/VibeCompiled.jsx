/* VibeCompiled — human-readable interpretation (presentational).
   Reads from the SAME `vibe.data` object as VibeSource. Change the
   data once and both representations update — no second hardcoded
   copy exists anywhere. Entrance staggering is pure CSS, keyed off
   the parent stage's `data-phase` attribute. */

export default function VibeCompiled({ data }) {
  return (
    <div className="vibe-c">
      <div className="vibe-c__block" style={{ "--i": 0 }}>
        <p className="vibe-c__label">Energy</p>
        <p className="vibe-c__energy">{data.energy}</p>
      </div>

      <div className="vibe-c__block" style={{ "--i": 1 }}>
        <p className="vibe-c__label">Personality</p>
        <p className="vibe-c__pills">
          {data.personality.map((word) => (
            <span className="vibe-c__pill" key={word}>
              {word}
            </span>
          ))}
        </p>
      </div>

      <div className="vibe-c__block" style={{ "--i": 2 }}>
        <p className="vibe-c__label">Interests</p>
        <div className="vibe-c__interests">
          {data.interests.map((topic, i) => (
            <p className="vibe-c__interest" style={{ "--j": i }} key={topic}>
              <span className="vibe-c__idx" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {topic}
            </p>
          ))}
        </div>
      </div>

      <div className="vibe-c__block" style={{ "--i": 3 }}>
        <div className="vibe-c__split">
          <div>
            <p className="vibe-c__label">
              <span className="vibe-c__mark vibe-c__mark--plus" aria-hidden="true" />
              Likes
            </p>
            <ul className="vibe-c__list">
              {data.likes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="vibe-c__label">
              <span className="vibe-c__mark vibe-c__mark--minus" aria-hidden="true" />
              Dislikes
            </p>
            <ul className="vibe-c__list vibe-c__list--dim">
              {data.dislikes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="vibe-c__block" style={{ "--i": 4 }}>
        <p className="vibe-c__label">Aesthetic</p>
        <p className="vibe-c__aesthetic">{data.aesthetic}</p>
      </div>

      <div className="vibe-c__block" style={{ "--i": 5 }}>
        <p className="vibe-c__label">Currently</p>
        <p className="vibe-c__currently">
          <span className="vibe-c__pulse" aria-hidden="true" />
          {data.currently}
        </p>
      </div>
    </div>
  );
}
